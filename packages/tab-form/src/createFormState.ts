import React from 'react';

export const createFormState = function <T extends Record<string, any>>(
  children: React.ReactNode | (() => React.ReactNode),
  _value: Partial<T>,
  _onChange: React.Dispatch<React.SetStateAction<T>>,
  onBeforeChange: (curr: Partial<T>, prev: Partial<T>) => Partial<T>,
) {
  let value = _value;
  let isActive = false;
  let cachedUpdater: Array<React.SetStateAction<Partial<T>>> = [];
  let subscribes: (() => void)[] = [];
  let uncompleteMap: Record<string, true> = {};
  let validaterList: Array<() => boolean> = [];
  let submitSubscriber = () => {};
  let renderSubscriber = () => {};

  return {
    value,
    dispatch: stash,
    getState: () => value,
    willComplete,
    isUncomplete,
    subscribe,
    subscribeRender,
    subscribeSubmit,
    registerValidater,
    active,
    checkSubmit,

    setActive: (v: boolean) => {
      isActive = v;
    },

    replaceChildren: (
      newChildren: React.ReactNode | (() => React.ReactElement),
    ) => {
      children = newChildren;
      renderSubscriber();
    },

    render: () => {
      if (typeof children === 'function') return children();
      return children;
    },

    destory: () => {
      cachedUpdater = [];
      subscribes = [];
      uncompleteMap = {};
      validaterList = [];
      submitSubscriber = () => {};
      renderSubscriber = () => {};
    },
  };

  function stash(v: React.SetStateAction<Partial<T>>) {
    if (!isActive) cachedUpdater = cachedUpdater.concat(v);
    return dispatch([v]);
  }

  // internal use
  function dispatch(
    vs: Array<React.SetStateAction<Partial<T>>>,
    needNotify = true,
  ) {
    if (vs.length < 1) return;
    let prev = value;
    let curr = value;
    for (const v of vs) {
      if (typeof v === 'function') {
        curr = v(prev);
      } else {
        curr = v;
      }
      prev = curr;
    }
    if (needNotify) curr = onBeforeChange(curr, value);

    value = curr;

    // notify subscriber
    if (needNotify) {
      subscribes.forEach((s) => s());
      submitSubscriber();
    }
  }

  function active() {
    dispatch(cachedUpdater, false);
    cachedUpdater = [];
  }

  function checkSubmit() {
    // check uncomplete
    if (Object.values(uncompleteMap).length !== 0) return null;

    return () => {
      // check validator
      const isValids = validaterList.map((v) => v());
      if (!isValids.every(Boolean)) return null;
      _onChange(value as any);
      return value;
    };
  }

  function isUncomplete(...names: string[]) {
    return !!uncompleteMap[names.join('-')];
  }

  function willComplete(...names: string[]) {
    const name = names.join('-');
    uncompleteMap = {
      ...uncompleteMap,
      [name]: true,
    };
    return () => {
      uncompleteMap = { ...uncompleteMap };
      delete uncompleteMap[name];
      submitSubscriber();
    };
  }

  function subscribe(f: () => void) {
    subscribes = subscribes.concat(f);
    return () => {
      subscribes = subscribes.filter((v) => v !== f);
    };
  }

  function subscribeSubmit(f: () => void) {
    submitSubscriber = f;
    return () => {
      submitSubscriber = () => {};
    };
  }

  function subscribeRender(f: () => void) {
    renderSubscriber = f;
    return () => {
      renderSubscriber = () => {};
    };
  }

  function registerValidater(f: () => boolean) {
    validaterList = validaterList.concat(f);
    return () => {
      validaterList = validaterList.filter((v) => v !== f);
    };
  }
};

export type FormState<T extends Record<string, any>> = ReturnType<
  typeof createFormState<T>
>;
