import React from 'react';
import { useSize } from './useSize';
import {
  useTransitionComputedValue,
  UseTransitionStageOptions,
} from './useTransitionStatus';

export const useCollapseStyles = (
  isOpen: boolean,
  options?: UseTransitionStageOptions,
  direction: 'width' | 'height' = 'height',
) => {
  const timeout = options?.timeout ?? 100;
  const [size, ref] = useSize();
  const { isMount, value } = useTransitionComputedValue(isOpen, {
    ...options,
    timeout,
    valueFn(status) {
      const style: React.CSSProperties = {
        transition: `${direction} ${timeout}ms ease-in-out`,
      };
      if (status === 'enter' || status === 'exiting' || status === 'exited') {
        style.overflow = 'hidden';
        style[direction] = '0px';
      } else if (status === 'entering' || status === 'exit') {
        style[direction] = `${size?.[direction] ?? 0}px`;
        style.overflow = 'hidden';
      } else if (status === 'entered') {
        style[direction] = 'auto';
      }
      return style;
    },
    valueFnDeps: [size],
  });

  return {
    ref,
    styles: value,
    isMount,
  };
};
