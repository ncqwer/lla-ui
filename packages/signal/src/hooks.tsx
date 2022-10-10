import React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { createStore } from './createStore';
import { createSSRSupport } from './ssr';
// eslint-disable-next-line no-unused-vars
import type { Signal, Func, ID, Context, SSRCache } from './type';
import { getUpdateWrapper } from './supportAct';

export type StoreType = ReturnType<typeof createStore>;
export type SSRSupport = ReturnType<typeof createSSRSupport>;

const StoreContext = React.createContext<StoreType | null>(null);

const SSRSupportContext = React.createContext<SSRSupport | null>(null);

export const SharedScope: React.FC<{
  scopeName: string;
  children: React.ReactNode;
}> = ({ scopeName, children }) => {
  const ssrSupport = React.useContext(SSRSupportContext)!;
  const [[store, un]] = React.useState(() => {
    const init = ssrSupport.getInit(scopeName) || {};
    const s = createStore(init);
    const unRegister = ssrSupport.register(scopeName, s);
    return [s, unRegister] as const;
  });

  React.useEffect(() => {
    return un;
  }, [un]);

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

export function useSignal<S extends Signal>(signal: S, options?: S['option']) {
  const store = React.useContext(StoreContext)!;
  React.useMemo(() => store.registerSignal(signal, options), [signal]);
  const snapshot = React.useCallback(() => {
    const data = store.getSnapshotData(signal.id);
    return data; //
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

export function useSignalState<S extends Signal>(
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
