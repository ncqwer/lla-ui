import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { useFormStore } from './useFormStore';

function id<T>(x: T) {
  return x;
}
function isEqual(prev: any, curr: any) {
  return prev.currentTab === curr.currentTab && prev.formMap === curr.formMap;
}

export const useFormTabs = () => {
  const formStore = useFormStore();
  const { currentTab, formMap } = useSyncExternalStoreWithSelector(
    formStore.subscribe,
    formStore.getState,
    null,
    id,
    isEqual,
  );
  return {
    currentTab,
    formMap,
    formStore,
  };
};
