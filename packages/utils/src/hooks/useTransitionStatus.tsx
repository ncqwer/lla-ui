import { useDerivedValue } from './useDerivedValue';
import { useEventStable } from './useEvent';
import { useIsomorphicEffect } from './useIsomorphicEffect';
import React, { Children, cloneElement, isValidElement } from 'react';

import { OnEvents, FSMSchedule as Schedule, useFSMWithSignal } from './useFSM';

type TransitionStatus =
  | 'unmount'
  | 'enter'
  | 'entering'
  | 'entered'
  | 'exit'
  | 'exiting'
  | 'exited';

export type UseTransitionStageOptions = Partial<
  Omit<OnEvents<TransitionStatus>, 'onUnmount'>
> & {
  appear?: boolean;
  unMountOnExit?: boolean;
  timeout?: number | { enter: number; exit: number };
  animation?: boolean | { enter: boolean; exit: boolean };
  mountBeforeEnter?: boolean;
};

export const useTransitionStatus = (
  show = false,
  {
    onEnter,
    onEntering,
    onEntered,
    onExit,
    onExiting,
    onExited,
    appear = false,
    unMountOnExit = true,
    timeout: _timeout = 0,
    animation: _animation = true,
  }: UseTransitionStageOptions = {},
) => {
  const context = React.useContext(TransitionGroupContext);

  const timeout =
    typeof _timeout === 'number'
      ? { enter: _timeout, exit: _timeout }
      : _timeout;

  const animation =
    typeof _animation === 'boolean'
      ? { enter: _animation, exit: _animation }
      : _animation;

  const status = useFSMWithSignal<TransitionStatus, boolean>(
    show,
    (isShow, now) => {
      if (isShow) {
        if (
          now === 'unmount' ||
          now === 'exit' ||
          now === 'exiting' ||
          now === 'exited'
        )
          return animation.enter ? 'enter' : 'exited';
      } else {
        if (now === 'enter' || now === 'entering' || now === 'entered')
          return animation.exit ? 'exit' : 'exited';
      }
    },
    () => {
      if (show) {
        if ((context && context.isMount) || appear) return 'unmount';
        return 'entered';
      } else {
        if (unMountOnExit) return 'unmount';
        return 'exited';
      }
    },
    {
      onEnter(prev) {
        if (onEnter) onEnter(prev);
        return [(set) => set('entering'), Schedule.raf()];
      },
      onEntering(prev) {
        if (onEntering) onEntering(prev);
        return [(set) => set('entered'), Schedule.timeout(timeout.enter)];
      },
      onEntered(prev) {
        if (onEntered) onEntered(prev);
      },

      onExit(prev) {
        if (onExit) onExit(prev);
        return [(set) => set('exiting'), Schedule.raf()];
      },

      onExiting(prev) {
        if (onExiting) onExiting(prev);
        return [(set) => set('exited'), Schedule.timeout(timeout.exit)];
      },
      onExited(prev) {
        if (onExited) onExited(prev);
        if (unMountOnExit) return [(set) => set('unmount'), Schedule.micro()];
      },
      // onUnmount(prev) {
      //   if (prev !== 'unmount') forceUpdate({});
      // },
    },
  );

  return status;
};

export const useTransitionComputedValue = function <Value>(
  show = false,
  {
    valueFn,
    valueFnDeps = [],
    ...others
  }: UseTransitionStageOptions & {
    valueFn: (status: TransitionStatus) => Value;
    valueFnDeps?: React.DependencyList;
  },
) {
  const status = useTransitionStatus(show, others);

  const valueFnRef = React.useRef(valueFn);
  useIsomorphicEffect(() => {
    valueFnRef.current = valueFn;
  });
  return {
    value: React.useMemo(() => {
      const fn = valueFnRef.current;
      return fn(status);
    }, [status, ...valueFnDeps]),
    isMount: status !== 'unmount',
  };
};

export const useTransitionClassNames = (
  show = false,
  {
    classNames,
    classNamesDeps = [],
    ...others
  }: UseTransitionStageOptions & {
    classNames: string | ((status: TransitionStatus) => string);
    classNamesDeps?: React.DependencyList;
  } = {
    classNames: '',
  },
) => {
  const { value, isMount } = useTransitionComputedValue(show, {
    ...others,
    valueFn: (status) => {
      const cls = classNames;

      if (typeof cls === 'function') return cls(status);
      if (status === 'enter') return `${cls}-enter`;
      if (status === 'entering') return `${cls}-enter-active`;
      if (status === 'entered') return `${cls}-enter-done`;
      if (status === 'exit') return `${cls}-exit`;
      if (status === 'exiting') return `${cls}-exit-active`;
      if (status === 'exited') return `${cls}-exit-done`;
      return '';
    },
    valueFnDeps: classNamesDeps,
  });
  return { classNames: value, isMount };
};

export const useTransitionGroup = (_children: React.ReactNode) => {
  const [contextValue, setContextValue] = React.useState({ isMount: false });

  const prevChildrenRef = React.useRef<Record<
    string,
    React.ReactElement
  > | null>(null);

  const currentChildrenMap = React.useMemo(
    () => getChildMapping(_children),
    [_children],
  );

  const onExited = useEventStable((child: React.ReactElement) => {
    if (child.key! in currentChildrenMap) return;

    if (child.props.onExited) child.props.onExited();

    if (contextValue.isMount) {
      setChildren((prev) => {
        const nChildren = { ...prev };
        delete nChildren[child.key!];
        prevChildrenRef.current = nChildren;
        return nChildren;
      });
    }
  });

  const [children, setChildren] = useDerivedValue(
    React.useMemo(() => {
      let ret;
      if (!prevChildrenRef.current) {
        ret = Object.fromEntries(
          Object.entries(currentChildrenMap).map(([key, child]) => [
            key,
            cloneElement(child, {
              show: true,
              onExited: () => onExited(child),
            }),
          ]),
        );
      } else {
        ret = mergeChildrenMap(
          currentChildrenMap,
          prevChildrenRef.current,
          onExited,
        );
      }
      prevChildrenRef.current = ret;
      return ret;
    }, [currentChildrenMap, onExited]),
  );

  React.useEffect(() => {
    setContextValue({ isMount: true });
    return () => {
      setContextValue({ isMount: false });
    };
  }, []);

  return React.useMemo(() => {
    return (
      <TransitionGroupContext.Provider value={contextValue}>
        {Object.values(children)}
      </TransitionGroupContext.Provider>
    );
  }, [contextValue, children]);
};

const getChildMapping = (
  children: React.ReactNode,
  mapFn?: (child: React.ReactElement) => React.ReactElement,
): Record<string, React.ReactElement> => {
  const mapper = (child: React.ReactNode) =>
    mapFn && isValidElement(child) ? mapFn(child) : child;

  const result = Object.create(null);
  if (children)
    Children.toArray(children).forEach((child: any) => {
      result[child.key!] = mapper(child);
    });
  return result;
};

const mergeChildrenMap = (
  currentChildrenMap: Record<string, React.ReactElement>,
  previousChildrenMap: Record<string, React.ReactElement>,
  onExited: (node: React.ReactElement) => void,
): Record<string, React.ReactElement> => {
  const currs = Object.entries(currentChildrenMap);
  const prevs = Object.entries(previousChildrenMap);

  let ans = [];
  let curr_idx = 0;
  let prev_idx = 0;

  while (curr_idx < currs.length && prev_idx < prevs.length) {
    const [curr_key, curr_node] = currs[curr_idx];
    const [prev_key, prev_node] = prevs[prev_idx];

    const prev_node_has_next = prev_key in currentChildrenMap;

    if (curr_key === prev_key) {
      ans.push([
        curr_key,
        cloneElement(curr_node, {
          show: true,
          onExited: () => onExited(curr_node),
        }),
        true,
      ] as const);
      ++curr_idx;
      ++prev_idx;
    } else {
      ans.push([
        prev_key,
        cloneElement(prev_node, {
          show: prev_node_has_next, // Keep the animation state unchanged when the item only changes position
          onExited: () => onExited(prev_node),
        }),
        false,
      ] as const);
      ++prev_idx;
    }
  }

  // add new
  while (curr_idx < currs.length) {
    const [curr_key, curr_node] = currs[curr_idx];
    ans.push([
      curr_key,
      cloneElement(curr_node, {
        show: true,
        onExited: () => onExited(curr_node),
      }),
      true,
    ] as const);
    ++curr_idx;
  }

  // make first element is new or remain

  const idx = ans.findIndex((v) => !!v[2]);
  if (!~idx) ans = [...ans.slice(idx), ...ans.slice(0, idx)];

  // add remove
  while (prev_idx < prevs.length) {
    const [prev_key, prev_node] = prevs[prev_idx];
    ans.push([
      prev_key,
      cloneElement(prev_node, {
        show: false,
        onExited: () => onExited(prev_node),
      }),
      true,
    ] as const);
    ++prev_idx;
  }

  return Object.fromEntries(ans);
};

export const TransitionGroupContext = React.createContext<{
  isMount: boolean;
} | null>(null);
