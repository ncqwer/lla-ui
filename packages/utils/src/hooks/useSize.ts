import React from 'react';

import { useIsomorphicEffect } from './useIsomorphicEffect';
import { useDebounce } from './useDebounce';

export const useSize = <E extends HTMLElement = any>(timeout = 0) => {
  const ref = React.useRef<E>(null);
  const lastRef = React.useRef<E | null>(null);
  const [size, setSizeRaw] =
    React.useState<
      Record<
        | 'clientHeight'
        | 'clientWidth'
        | 'offsetHeight'
        | 'offsetWidth'
        | 'height'
        | 'width',
        number
      >
    >();
  const [setSize] = useDebounce((s) => {
    if (
      s?.height !== size?.height ||
      s?.width !== size?.width ||
      s?.clientHeight !== size?.clientHeight ||
      s?.clientWidth !== size?.clientWidth
    ) {
      setSizeRaw(s);
    }
  }, timeout);

  const hasObserverRef = React.useRef<boolean>(false);

  useIsomorphicEffect(() => {
    if (ref.current) {
      if (lastRef.current !== ref.current || !hasObserverRef.current) {
        lastRef.current = ref.current;
        const { clientHeight, clientWidth, offsetHeight, offsetWidth } =
          ref.current as any;
        setSize({
          height: offsetHeight,
          width: offsetWidth,
          offsetHeight,
          offsetWidth,
          clientHeight,
          clientWidth,
        });

        const observer = new ResizeObserver((entrties) => {
          entrties.forEach((entry) => {
            const { clientHeight, clientWidth, offsetHeight, offsetWidth } =
              entry.target as any;
            setSize({
              height: offsetHeight,
              width: offsetWidth,
              offsetHeight,
              offsetWidth,
              clientHeight,
              clientWidth,
            });
          });
        });

        observer.observe(ref.current);
        hasObserverRef.current = true;
        return () => {
          observer.disconnect();
          hasObserverRef.current = false;
        };
      }
    }
  });

  return [size, ref] as const;
};
