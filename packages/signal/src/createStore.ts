import {
  OldVersionError,
  CircularError,
  SSRError,
  DependencyError,
} from './error';
import { isPromisify, delay } from './utils';

import type { ID, Context, Option, Signal } from './type';
import { PLACEHOLDER } from './type';

// const ERRORVALUE = Symbol('ERRORVALUE');

export const createStore = (initialValues: Record<ID, Context>) => {
  let globalVersion = 0;
  const ctxMap = new Map<ID, Context>();
  const subscriberMap = new Map<ID, Array<() => void>>();
  // eslint-disable-next-line no-unused-vars
  const executionMap = new Map<ID, (...args: any[]) => any>();
  const optionMap = new Map<ID, Option<any> | undefined>();

  Object.entries(initialValues).forEach(([id, ctx]) => {
    ctxMap.set(id, fillCtx(ctx));
  });

  return {
    subscribe,
    getSnapshotData,
    registerSignal,
    recall,
    __internalData: ctxMap,
    topologicalSorting,
  };

  function fillCtx(ctx: Context): Context {
    const status = ctx.data.status;
    const newError =
      status === 'rejected' ? new SSRError(ctx.data.error as any) : null;
    const raw =
      ctx.raw === 'isSimple'
        ? ctx.data.value
        : status === 'fulfilled'
        ? Promise.resolve(ctx.data.value)
        : Promise.reject(newError);
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
    { id, execution, option: raw }: Signal,
    _option?: Signal['option'],
  ) {
    const oldExecution = executionMap.get(id);
    // const oldOptions = optionsMap.get(id);
    if (execution !== oldExecution) {
      executionMap.set(id, execution);
      optionMap.set(id, _option || raw);
      if (!oldExecution) return;
      exec(id);
    }
  }

  function recall<Param extends any[], Ret>(
    signal: Signal<Param, Ret>,
    newOption: Signal<Param, Ret>['option'],
  ) {
    optionMap.set(signal.id, { ...signal?.option, ...newOption });
    exec(signal.id);
  }

  function getCtx(signal: Signal<any>) {
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
    const execution = executionMap.get(id)!;
    const { timeout, args = [] } = optionMap.get(id) || {};
    if (oldContext) {
      oldContext.isOld = true;
    }
    const ctx: Context = {
      dependencies: [],
      dependencyMap: {},
      raw: null,
      data: {
        value: oldContext?.data?.value || PLACEHOLDER,
        error: oldContext?.data?.error || null,
        status: oldContext?.data?.status || 'pending', // 'rejected' || 'fulfilled' | 'pending'
      },
      isOld: false,
      version: globalVersion++,
    };
    const getter = (other: Signal<any> | Signal<any>['id']) => {
      if (ctx.isOld) {
        throw new OldVersionError();
      }
      if (typeof other !== 'string') {
        const target = getCtx(other);
        if (hasCircularDependency(id, other.id)) throw new CircularError();
        if (target.raw === PLACEHOLDER) throw new DependencyError();
        ctx.dependencies.push(other.id);
        ctx.dependencyMap[other.id] = true;
        return target.raw;
      } else {
        const target = ctxMap.get(other);
        if (!target) throw new Error();
        if (hasCircularDependency(id, other)) throw new CircularError();
        if (target.raw === PLACEHOLDER) throw new DependencyError();
        ctx.dependencies.push(other);
        ctx.dependencyMap[other] = true;
        return target.raw;
      }
    };
    ctxMap.set(id, ctx);
    let result = PLACEHOLDER;
    let err = null;

    try {
      result = execution(getter, ...args);
    } catch (e) {
      err = e;
      result = PLACEHOLDER;
    }

    if (isPromisify(result)) {
      let isTimeoutFirst: boolean | null = null;
      result
        .then(async (v) => {
          isTimeoutFirst = isTimeoutFirst === null ? false : isTimeoutFirst;
          if (ctx.isOld) return;
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
        })
        .catch((e) => {
          if (e instanceof OldVersionError) return;
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
    } else {
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
    }
    ctx.raw = result;
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
        if (ctxMap.get(id)!.dependencies.length === 0) return acc;
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
          if (graph[id]) return acc;
          if (ctxMap.get(id)!.dependencies.every((v) => graph[v])) return acc;
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

    if (needGC)
      allIds.forEach((removeId) => {
        if (!graphIds[removeId]) {
          ctxMap.delete(removeId);
          subscriberMap.delete(removeId);
          executionMap.delete(removeId);
          optionMap.delete(removeId);
        }
      });
    return graphIds;
  }
};
