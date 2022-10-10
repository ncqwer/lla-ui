import React from 'react';
import type { Func } from '../type';

export const useEvent = <T extends Func>(f: T): T => {
  const ref = React.useRef(f);
  React.useEffect(() => {
    ref.current = f;
  });

  return React.useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
};

export const useEventStable = <T extends Func>(f: T): T => {
  const ref = React.useRef(f);
  ref.current = f;
  // React.useEffect(() => {
  // });
  return React.useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []) as T;
};
