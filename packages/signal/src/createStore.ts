import {
  OldVersionError,
  CircularError,
  SSRError,
  DependencyError,
  DataSourceSSRError,
} from './error';
import { isPromisify, delay } from './utils';

import type { ID, Context, Option, Signal, DataSource } from './type';
import { PLACEHOLDER } from './type';
import { isBrowser } from '@lla-ui/utils';

// const ERRORVALUE = Symbol('ERRORVALUE');

export const createStore = (
  initialValues: Record<ID, Context>,
  isFrozen = false,
) => {
  let mountFlag = true;
  let globalVersion = Array.from(Object.values(initialValues)).reduce(
    (acc, ctx) => Math.max(acc, ctx.version),
    0,
  );
  const ctxMap = new Map<ID, Context>();
  const subscriberMap = new Map<ID, Array<() => void>>();
  // eslint-disable-next-line no-unused-vars
  const executionMap = new Map<ID, (...args: any[]) => any>();
  const optionMap = new Map<ID, Option<any> | undefined>();
  const typeMap = new Map<ID, 'single' | 'mutiply'>();

  Object.entries(initialValues).forEach(([id, ctx]) => {
    ctxMap.set(id, fillCtx(ctx));
  });

  return {
    subscribe,
    getSnapshotData,
    getSnapshot,
    setSnapshot,
    registerSignal,
    recall,
    __internalData: ctxMap,
    topologicalSorting,
    unmount: () => {
      topologicalSorting([], true);
      mountFlag = false;
    },
  };

  function fillCtx(ctx: Context): Context {
    const status = ctx.data.status;
    const newError =
      status === 'rejected' ? new SSRError(ctx.data.error as any) : null;
    let raw =
      ctx.raw === 'isSimple'
        ? ctx.data.value
        : status === 'fulfilled'
        ? Promise.resolve(ctx.data.value)
        : status === 'rejected'
        ? Promise.reject(newError)
        : null;
    if (status === 'pending') {
      if (!isFrozen)
        throw new Error(
          'Some signal value is pending after ssr. This is Bug,please issue it!',
        );
      raw = new Promise(() => {}); // this promise never resolve or reject, it is safe in forzen mode
    }
    return {
      ...ctx,
      raw,
      data: {
        ...ctx.data,
        error: newError,
      },
    };
  }

  function subscribe(id: string, subscriber: () => void) {
    if (!ctxMap.has(id)) {
      exec(id);
    }
    let subscribers = subscriberMap.get(id) || [];
    subscribers = [...subscribers, subscriber];
    subscriberMap.set(id, subscribers);
    return () => {
      let subscribers = subscriberMap.get(id) || [];
      subscribers = subscribers.filter((v) => v !== subscriber);
      subscriberMap.set(id, subscribers);
    };
  }

  function getSnapshotData(id: string) {
    let ctx = ctxMap.get(id);
    if (!ctx) {
      ctx = exec(id);
    }
    return ctx.data;
  }

  function registerSignal(
    { id, execution, option: raw, type }: Signal | DataSource,
    _option?: Signal['option'],
  ) {
    const oldExecution = executionMap.get(id);
    // const oldOptions = optionsMap.get(id);
    if (execution !== oldExecution) {
      typeMap.set(id, type);
      executionMap.set(id, execution);
      optionMap.set(id, { ..._option, ...raw });
      if (!oldExecution) return;
      exec(id);
    }
  }

  function getSnapshot() {
    return Array.from(ctxMap.entries()).reduce(
      (a, [id, ctx]) => ({
        ...a,
        [id]: {
          ...ctx,
          raw: isPromisify(ctx.raw) ? 'isPromise' : 'isSimple',
          data: {
            ...ctx.data,
            error:
              ctx.data.status === 'rejected' ? ctx.data.error!.message : null,
          },
        },
      }),
      {},
    );
  }

  function setSnapshot(cache: Record<ID, Context>) {
    if (!isFrozen) {
      throw new Error('Only forzen mode support [setSnapshot] method');
    }
    const needUpdateIds: ID[] = [];
    Object.entries(cache).forEach(([id, ctx]) => {
      const oldContext = ctxMap.get(id);
      ctxMap.set(id, fillCtx(ctx));
      if (oldContext?.version !== ctx.version) {
        needUpdateIds.push(id);
      }
    });
    needUpdateIds.forEach((id) => {
      notify(id);
    });
  }

  function recall(signal: Signal['id'], newOption?: any): void;
  function recall<Param extends any[], Ret>(
    signal: Signal<Param, Ret> | DataSource<any, Param, Ret>,
    newOption?: Signal<Param, Ret>['option'],
  ): void;
  function recall(signal: Signal['id'] | Signal | DataSource, newOption?: any) {
    if (typeof signal === 'object') {
      optionMap.set(signal.id, { ...signal?.option, ...newOption });
      exec(signal.id);
    } else {
      const oldOption = optionMap.get(signal);
      if (!oldOption)
        throw new Error(
          'recall signal with id only work after signal has executed',
        );
      optionMap.set(signal, { ...oldOption, ...newOption });
      exec(signal);
    }
  }

  function getCtx(signal: Signal<any> | DataSource) {
    const { id } = signal;

    let ctx = ctxMap.get(id);
    if (!ctx) {
      registerSignal(signal);
      ctx = exec(id);
    }
    return ctx;
  }

  function exec(id: ID): Context {
    const oldContext = ctxMap.get(id);
    if (isFrozen) {
      if (!oldContext)
        throw new Error(
          'In forzen mode, signal can not run actually, there is no target cache value in snapshot data',
        );
      return oldContext;
    }
    const execution = executionMap.get(id)!;
    const { timeout, args = [] } = optionMap.get(id) || {};
    const type = typeMap.get(id)!;
    if (!isBrowser && type === 'mutiply') {
      throw new DataSourceSSRError(`DataSource[id:${id}] not support ssr!`);
    }
    if (oldContext) {
      oldContext.isOld = true;
      if (oldContext.cleanup) oldContext.cleanup();
    }
    const ctx: Context = {
      dependencies: [],
      dependencyMap: {},
      raw: null,
      data: {
        value: oldContext?.data?.value ?? PLACEHOLDER,
        error: oldContext?.data?.error || null,
        status: oldContext?.data?.status || 'pending', // 'rejected' || 'fulfilled' | 'pending'
      },
      isOld: false,
      version: globalVersion++,
      cleanup: null,
      type,
    };
    const getter = (other: Signal<any> | Signal<any>['id']) => {
      if (ctx.isOld || !mountFlag) {
        throw new OldVersionError();
      }
      if (typeof other !== 'string') {
        const target = getCtx(other);
        // if (ctx.version < target.version) {
        //   ctx.isOld = true;
        //   ctx.dependencies.push(other.id);
        //   ctx.dependencyMap[other.id] = true;
        //   throw new OldVersionError();
        // }
        if (hasCircularDependency(id, other.id)) throw new CircularError();
        if (target.raw === PLACEHOLDER) throw new DependencyError();
        ctx.dependencies.push(other.id);
        ctx.dependencyMap[other.id] = true;
        return target.type === 'single'
          ? target.raw
          : target.data.status === 'fulfilled'
          ? Promise.resolve(target.data.value)
          : target.raw;
      } else {
        const target = ctxMap.get(other);
        if (!target) throw new Error();
        // if (ctx.version < target.version) {
        //   ctx.isOld = true;
        //   ctx.dependencies.push(other);
        //   ctx.dependencyMap[other] = true;
        //   throw new OldVersionError();
        // }
        if (hasCircularDependency(id, other)) throw new CircularError();
        if (target.raw === PLACEHOLDER) throw new DependencyError();
        ctx.dependencies.push(other);
        ctx.dependencyMap[other] = true;
        return target.type === 'single'
          ? target.raw
          : target.data.status === 'fulfilled'
          ? Promise.resolve(target.data.value)
          : target.raw;
      }
    };
    let allowSetterTriggerUpdate = false;
    let hasSetBeforeReturnCleanup = false;
    const setter = (v: Signal['typeMarker']) => {
      if (ctx.isOld || !mountFlag) return;
      if (v !== ctx.data.value) {
        ctx.data = {
          ...ctx.data,
          value: v,
        };
        if (allowSetterTriggerUpdate) {
          ctx.version = globalVersion++;
          scheduleUpdatePlan(id);
          notify(id);
        } else {
          hasSetBeforeReturnCleanup = true;
        }
      }
    };
    ctxMap.set(id, ctx);
    let result: any = PLACEHOLDER;
    let err = null;

    try {
      result = execution({ get: getter, set: setter }, ...args);
    } catch (e) {
      if (e instanceof DataSourceSSRError) throw e;
      err = e;
      result = PLACEHOLDER;
    }

    if (isPromisify(result)) {
      let isTimeoutFirst: boolean | null = null;
      result
        .then(async (v) => {
          isTimeoutFirst = isTimeoutFirst === null ? false : isTimeoutFirst;
          if (ctx.isOld) return;
          if (type === 'single') {
            if (v !== ctx.data.value) {
              ctx.data = {
                error: null,
                status: 'fulfilled',
                value: v,
              };
              scheduleUpdatePlan(id);
              notify(id);
            } else {
              if (isTimeoutFirst) {
                notify(id);
              }
            }
          } else if (type === 'mutiply') {
            allowSetterTriggerUpdate = true;
            ctx.data = {
              ...ctx.data,
              error: null,
              status: 'fulfilled',
            };
            if (hasSetBeforeReturnCleanup) {
              scheduleUpdatePlan(id);
              notify(id);
            }
          }
        })
        .catch((e) => {
          if (e instanceof OldVersionError) return;
          if (e instanceof DataSourceSSRError) throw e;
          ctx.data = {
            error: e,
            status: 'rejected',
            value: PLACEHOLDER,
          };
          notify(id);
        });
      if (timeout)
        delay(timeout).then(() => {
          isTimeoutFirst = isTimeoutFirst === null ? true : isTimeoutFirst;
          if (isTimeoutFirst && ctx.data.status !== 'pending') {
            ctx.data = {
              error: null,
              status: 'pending',
              value: PLACEHOLDER,
            };
            notify(id);
          }
        });
      ctx.cleanup = () =>
        (result as any).then(
          (f: any) => typeof f === 'function' && f(),
          () => {},
        );
      ctx.raw =
        type === 'mutiply'
          ? result.then(() => {
              return ctx.data.value;
            })
          : result;
    } else {
      ctx.raw = result;
      if (type === 'single') {
        const old = ctx.data.value;
        ctx.data = {
          error: err as any,
          status: err ? 'rejected' : 'fulfilled',
          value: result,
        };
        if (old !== PLACEHOLDER && result !== old) {
          scheduleUpdatePlan(id);
          notify(id);
        }
      } else if (type === 'mutiply') {
        ctx.cleanup = () => typeof result === 'function' && (result as any)();
        ctx.data = {
          ...ctx.data,
          error: null,
          status: 'fulfilled',
        };
        allowSetterTriggerUpdate = true;
        if (hasSetBeforeReturnCleanup) {
          scheduleUpdatePlan(id);
          notify(id);
        }
      }
    }
    return ctx;
  }

  function scheduleUpdatePlan(id: ID) {
    const ctx = ctxMap.get(id)!;
    const needRefreshSingalNames = Array.from(ctxMap.entries())
      .filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, { dependencyMap, version }]) =>
          dependencyMap[id] && version < ctx.version,
      )
      .map(([name]) => name);
    needRefreshSingalNames.forEach((v) => exec(v));
  }

  function notify(id: ID) {
    const subscribers = subscriberMap.get(id) || [];
    subscribers.forEach((subscriber) => subscriber());
  }

  function hasCircularDependency(id: ID, addedId: ID) {
    if (id === addedId) return true;
    const queue = [id];
    const visited = {
      [id]: true,
    };

    while (queue.length > 0) {
      const targetId = queue.shift()!;
      let flag = false;
      ctxMap.get(targetId)?.dependencies.forEach((dId) => {
        if (dId === addedId) {
          flag = true;
        }
        if (!visited[dId]) {
          queue.push(dId);
          visited[dId] = true;
        }
      });
      if (flag) return true;
    }
    return false;

    // const { dependencies } = ctxMap.get(id)!;
    // let set = new Set(dependencies.concat(addedId));
    // const cache = {};
    // let count = 0;
    // while (count < MAX_DEPTH && !cache[id]) {
    //   ++count;
    //   dependencies.forEach((name) => {
    //     cache[name] = true;
    //   });
    //   const tmp = Array.from(set.values()).reduce((acc, name) => {
    //     return acc.concat(
    //       ctxMap.get(name)!.dependencies.filter((v) => !cache[v]),
    //     );
    //   }, [] as ID[]);
    //   if (tmp.length === 0) return false;
    //   set = new Set(tmp);
    // }
    // return true;
  }

  function topologicalSorting(currentIds?: ID[], needGC: boolean = false) {
    const allIds = Array.from(ctxMap.keys());
    currentIds = currentIds || allIds;
    let { graphIds, graph } = currentIds.reduce(
      (acc, id) => {
        if (ctxMap.get(id)!.dependencies.length !== 0) return acc;
        return {
          graph: {
            ...acc.graph,
            [id]: true,
          },
          graphIds: acc.graphIds.concat(id),
        };
      },
      { graph: {}, graphIds: [] } as {
        graph: Record<ID, boolean>;
        graphIds: ID[];
      },
    );

    while (graphIds.length < currentIds.length) {
      const prevLen = graphIds.length;
      const tmp = allIds.reduce(
        (acc, id) => {
          if (graph[id]) return acc; // avoid duplicate
          if (ctxMap.get(id)!.dependencies.some((v) => !graph[v])) return acc;
          return {
            graph: {
              ...acc.graph,
              [id]: true,
            },
            graphIds: acc.graphIds.concat(id),
          };
        },
        { graph, graphIds } as {
          graph: Record<ID, boolean>;
          graphIds: ID[];
        },
      );
      graphIds = tmp.graphIds;
      graph = tmp.graph;
      if (prevLen === graphIds.length && prevLen < currentIds.length) {
        throw new CircularError();
      }
    }

    if (needGC) {
      allIds.forEach((removeId) => {
        if (!graph[removeId]) {
          const t = ctxMap.get(removeId)!;
          if (t.cleanup) t.cleanup();
          ctxMap.delete(removeId);
          subscriberMap.delete(removeId);
          executionMap.delete(removeId);
          optionMap.delete(removeId);
        }
      });
    }
    return graphIds;
  }
};
