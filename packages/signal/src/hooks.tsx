import React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { createStore } from './createStore';
import { createSSRSupport } from './ssr';
import type { Context, DataSource, ID, Signal, SSRCache } from './type';
import { getUpdateWrapper } from './supportAct';
import { signal } from './signal';
import { useEffectOnce } from '@lla-ui/utils';

export type StoreType = ReturnType<typeof createStore>;
export type SSRSupport = ReturnType<typeof createSSRSupport>;

const StoreContext = React.createContext<StoreType | null>(null);

const SSRSupportContext = React.createContext<SSRSupport | null>(null);

export const SharedScope: React.FC<{
  scopeName: string;
  children: React.ReactNode;
  isForzen?: boolean;
  forzenCache?: any;
}> = ({ scopeName, children, isForzen = false, forzenCache }) => {
  const ssrSupport = React.useContext(SSRSupportContext)!;
  const prevCache = React.useRef(forzenCache);
  const [[store, un]] = React.useState(() => {
    const init = ssrSupport.getInit(scopeName) || {};
    const s = createStore(isForzen ? forzenCache ?? init : init, isForzen);
    const unRegister = ssrSupport.register(scopeName, s);
    return [s, unRegister] as const;
  });

  React.useEffect(() => {
    if (isForzen && forzenCache !== prevCache) {
      prevCache.current = forzenCache;
      store.setSnapshot(forzenCache);
    }
  }, [isForzen, store, forzenCache]);

  useEffectOnce(() => {
    return () => {
      store.unmount();
      un();
    };
  });

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const SSRSupportWrapper: React.FC<{
  cache?: SSRCache;
  children: React.ReactNode;
  ssrClient?: SSRSupport; // only pass the object when ssr
}> = ({ cache, children, ssrClient }) => {
  const [ssrSupport] = React.useState(() => {
    return ssrClient || createSSRSupport(cache);
  });
  return (
    <SSRSupportContext.Provider value={ssrSupport}>
      {children}
    </SSRSupportContext.Provider>
  );
};

export const useSignalStore = () => React.useContext(StoreContext)!;

export function useSignal<S extends Signal | DataSource>(
  signal: S,
  options?: S['option'],
) {
  const store = React.useContext(StoreContext)!;
  React.useMemo(() => store.registerSignal(signal, options), [signal]);
  const snapshot = React.useCallback(() => {
    const data = store.getSnapshotData(signal.id);
    return data as Context<S['typeMarker']>['data']; //
  }, [signal]);
  return useSyncExternalStore(
    React.useCallback(
      (cb) => {
        return store.subscribe(signal.id, () => {
          const wrapper = getUpdateWrapper();
          wrapper(cb);
        });
      },
      [signal],
    ),
    snapshot,
    snapshot,
  );
}

export function useSignalState<S extends Signal | DataSource>(
  signal: S,
  options?: S['option'],
) {
  const store = React.useContext(StoreContext)!;
  return [
    useSignal(signal, options),
    React.useCallback(
      (option: S['option'] = {}) => store.recall(signal, option),
      [signal],
    ),
  ] as const;
}

export function useDispatch(): {
  (signal: Signal['id'], newOption?: any): void;
  <Param extends any[], Ret>(
    signal: Signal<Param, Ret> | DataSource<any, Param, Ret>,
    newOption?: Signal<Param, Ret>['option'],
  ): void;
} {
  const store = React.useContext(StoreContext)!;
  return React.useCallback(
    (signal: any, option: any) => store.recall(signal, option),
    [store],
  );
}

// special case for useState interface with sync state
export function atom<T>(key: ID, _initialValue: T) {
  let prev = _initialValue;
  return signal(key, (_, v: React.SetStateAction<T>) => {
    if (typeof v === 'function') {
      prev = (v as any)(prev);
    } else {
      prev = v;
    }
    return prev as T;
  });
}

export function useAtom<T>(
  signal: Signal<Array<T | ((v: any) => T)>, T>,
  initialState?: T | (() => T),
) {
  const [value, recall] = useSignalState(
    signal,
    initialState !== undefined
      ? {
          args: [initialState],
        }
      : undefined,
  );
  if (value.error) throw value.error;
  return [
    value.value as T,
    React.useCallback(
      (v: React.SetStateAction<T>) => recall({ args: [v] }),
      [recall],
    ),
  ] as const;
}
