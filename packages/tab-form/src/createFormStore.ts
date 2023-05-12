import React from 'react';
import { createFormState, FormState } from './createFormState';

export const createFormStore = () => {
  let formMap: Record<string, FormState<any>> = {};
  let currentTab: string | undefined = undefined;
  let subscribes: (() => void)[] = [];

  return {
    getState: () => ({
      currentTab,
      formMap,
    }),
    setCurrentTab: (v: React.SetStateAction<string | undefined>) => {
      if (typeof v === 'function') {
        currentTab = v(currentTab);
      } else {
        currentTab = v;
      }
      subscribes.forEach((v) => v());
    },
    subscribe,
    openTab,
    closeTab,
    refreshTab,
  };

  function openTab<T extends Record<string, any>>(
    tabName: string,
    children: React.ReactNode | (() => React.ReactNode),
    {
      value,
      onChange,
      onBeforeChange,
    }: {
      value: Partial<T>;
      onChange: React.Dispatch<React.SetStateAction<T>>;
      onBeforeChange: (curr: Partial<T>, prev: Partial<T>) => T;
    },
  ) {
    let formState = formMap[tabName];
    if (!formState) {
      formState = createFormState(
        children,
        value,
        (v) => {
          onChange(v);
          closeTab(tabName);
        },
        onBeforeChange,
      );
      formMap = {
        ...formMap,
        [tabName]: formState,
      };
    }
    currentTab = tabName;
    subscribes.forEach((s) => s());
  }

  function closeTab(tabName: string) {
    formMap = { ...formMap };
    const tabNames = Object.keys(formMap);
    const idx = tabNames.findIndex((v) => v === tabName);
    if (!~idx) {
      currentTab = tabNames[tabNames.length - 1];
    } else {
      currentTab = idx === 0 ? tabNames[idx + 1] : tabNames[idx - 1];
    }
    delete formMap[tabName];
    subscribes.forEach((s) => s());
  }

  function subscribe(f: () => void) {
    subscribes = subscribes.concat(f);
    return () => {
      subscribes = subscribes.filter((v) => v !== f);
    };
  }

  function refreshTab(
    tabName: string,
    children: React.ReactNode | (() => React.ReactElement),
  ) {
    const formState = formMap[tabName];
    if (!formState) throw new Error();
    formState.replaceChildren(children);
  }
};

export type FormStore = ReturnType<typeof createFormStore>;
