import { useIsomorphicEffect } from './useIsomorphicEffect';
import React from 'react';

export type DelayType =
  | {
      type: 'timeout';
      timeout: number;
    }
  | {
      type: 'raf';
    }
  | {
      type: 'micro';
    };

const noop = () => {};

const toHanlderName = <T extends string>(status: T): `on${Capitalize<T>}` => {
  return `on${status.slice(0, 1).toUpperCase()}${status.slice(1)}` as any;
};

export type OnEvents<T extends string> = Record<
  `on${Capitalize<T>}`,
  (
    prev?: T,
  ) =>
    | [(set: React.Dispatch<React.SetStateAction<T>>) => void, DelayType]
    | ((set: React.Dispatch<React.SetStateAction<T>>) => void)
    | void
>;

export function useFSM<T extends string, S = any>(
  _input: (signal: S, now: T) => T | undefined,
  initialState: T | (() => T),
  _onEvents: Partial<OnEvents<T>>,
) {
  const [status, setStatus] = React.useState(initialState);

  const onEventsRef = React.useRef(_onEvents);
  const inputRef = React.useRef(_input);
  useIsomorphicEffect(() => {
    onEventsRef.current = _onEvents;
    inputRef.current = _input;
  });

  // const setStatus = React.useState(() => (v: React.SetStateAction<T>) => {
  //   let newValue: T;
  //   if (typeof v === 'function') {
  //     newValue = v(statusRef.current);
  //   } else {
  //     newValue = v;
  //   }
  //   statusRef.current = newValue;
  // })[0];
  const prevStatusRef = React.useRef<T | null>(null);

  useIsomorphicEffect(() => {
    const now = status;
    if (prevStatusRef.current === now) return;
    prevStatusRef.current = now;
    const handler = onEventsRef.current[toHanlderName(now)] || noop;
    let _delay = handler(prevStatusRef.current ?? undefined);
    // let cleaner;
    if (_delay) {
      if (!Array.isArray(_delay)) _delay = [_delay, { type: 'raf' }];
      const [nextAction, delay] = _delay;
      if (delay.type === 'micro')
        Promise.resolve().then(
          makeFnwithCancelFlag(() => nextAction(setStatus)),
        );
      if (delay.type === 'raf') {
        requestAnimationFrame(
          makeFnwithCancelFlag(() => nextAction(setStatus)),
        );
        // cleaner = () => cancelAnimationFrame(id);
      }
      if (delay.type === 'timeout') {
        setTimeout(
          makeFnwithCancelFlag(() => nextAction(setStatus)),
          delay.timeout,
        );
        // cleaner = () => clearTimeout(id);
      }
    }

    // return cleaner;
  }, [status]);

  const currentFnFlag = React.useRef<{} | null>(null);

  function makeFnwithCancelFlag<T extends (...args: any) => any>(f: T): T {
    const flag = {};
    currentFnFlag.current = flag;

    const handler: any = (...args: any[]) => {
      if (currentFnFlag.current === flag) {
        f(...args);
      }
    };
    return handler;
  }

  return [
    status,
    React.useCallback((signal: S) => {
      setStatus((prev) => {
        const next = inputRef.current(signal, prev);
        if (next && next !== prev) {
          return next;
        }
        return prev;
      });
    }, []),
  ] as const;
}

export const FSMSchedule = {
  timeout: (timeout: number): DelayType => ({ type: 'timeout', timeout }),
  raf: (): DelayType => ({ type: 'raf' }),
  micro: (): DelayType => ({ type: 'micro' }),
};

export function useFSMWithSignal<T extends string, S>(
  signal: S,
  _input: (signal: S, now: T) => T | undefined,
  initialState: T | (() => T),
  _onEvents: Partial<OnEvents<T>>,
) {
  const [status, next] = useFSM(_input, initialState, _onEvents);

  const prevSignalRef = React.useRef<S | null>(null);
  useIsomorphicEffect(() => {
    if (prevSignalRef.current === signal) return;
    prevSignalRef.current = signal;
    next(signal);
  }, [signal]);

  return status;
}
