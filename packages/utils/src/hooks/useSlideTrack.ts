import React from 'react';
import { useEventStable } from './useEvent';
// import { flushSync } from 'react-dom';
const defaultFlushSync = (f: any) => f();

export type SlideEvent =
  | {
      type: 'pre';
    }
  | {
      type: 'next';
    }
  | {
      type: 'ix';
      idx: number;
    };

export const SlideEvents = {
  prev: { type: 'pre' } as SlideEvent,
  next: { type: 'next' } as SlideEvent,
  ix: (i: number) => ({ type: 'ix', idx: i } as SlideEvent),
} as const;

const useTrackPropsAndMethod = (
  slideUnit: number,
  slideCount: number,
  {
    slideGap = 0,
    infinity: _infinity = true,
    flushSync = defaultFlushSync,
    direction = 'horization',
    speedPerUnit = 100,
  }: {
    slideGap?: number;
    infinity?: boolean;
    direction?: 'horization' | 'vertical';
    flushSync?: (f: () => void) => any;
    speedPerUnit?: number;
  } = {},
) => {
  const infinity = _infinity && slideCount > 1;
  const [state, setState] = React.useState<{
    targetIdx: number;
    animate: boolean;
    prevTargetIdx?: number;
    origin?: number;
    offset?: number;
  }>({
    targetIdx: infinity ? 1 : 0,
    animate: false,
  });
  const batchEventRef = React.useRef<SlideEvent | null>(null);
  const slide = useEventStable((e: SlideEvent) => {
    if (state?.offset !== undefined) return;
    if (state.animate) {
      batchEventRef.current = e;
      return;
    }
    _slide(e);
  });

  const isVertical = direction === 'vertical';
  const mouseEvents = makeSwipeListenners((e: any) => [e.pageX, e.pageY]);
  const touchEvents = makeSwipeListenners((e: any) => {
    const t = e.touches[0];
    return [t.pageX, t.pageY];
  });

  return {
    onTransitionEnd,
    onMouseDown: mouseEvents.onSwipeStart,
    onMouseMove: mouseEvents.onSwipeMove,
    onMouseUp: mouseEvents.onSwipeEnd,
    onMouseLeave: mouseEvents.onSwipeEnd,
    onTouchStart: touchEvents.onSwipeStart,
    onTouchMove: touchEvents.onSwipeMove,
    onTouchCancel: touchEvents.onSwipeEnd,
    onTouchEnd: touchEvents.onSwipeEnd,

    style: React.useMemo((): React.CSSProperties => {
      const { targetIdx, animate, offset = 0, prevTargetIdx } = state;
      let len;
      if (infinity) {
        len = (slideUnit + slideGap) * (slideCount + 2) + slideGap;
      } else {
        len = (slideUnit + slideGap) * slideCount + slideGap;
      }
      const speed = prevTargetIdx
        ? Math.abs(targetIdx - prevTargetIdx) * speedPerUnit
        : speedPerUnit;
      if (!isVertical) {
        return Object.assign(
          {
            width: `${len}px`,
            transform: `translate3d(${
              offset - targetIdx * (slideUnit + slideGap)
            }px,0,0)`,
          },
          animate && {
            transition: `transform ${speed ?? speedPerUnit}ms linear`,
          },
        );
      } else {
        return Object.assign(
          {
            height: `${len}px`,
            transform: `translate3d(0,${
              offset - targetIdx * (slideUnit + slideGap)
            }px,0)`,
          },
          animate && {
            transition: `transform ${speed ?? speedPerUnit}ms linear`,
          },
        );
      }
    }, [state, slideUnit, slideCount, infinity, isVertical, slideGap]),
    slide,

    isFirst: infinity ? state.targetIdx === 1 : state.targetIdx === 0,
    isLast: infinity
      ? state.targetIdx === slideCount + 1
      : state.targetIdx === slideCount - 1,
  };

  function makeSwipeListenners(getEventPos: (e: any) => [number, number]) {
    return {
      onSwipeStart,
      onSwipeMove,
      onSwipeEnd,
    };

    function onSwipeStart(e: any) {
      const [x, y] = getEventPos(e);
      setState((prev) => ({
        ...prev,
        prevTargetIdx: undefined,
        animate: false,
        origin: isVertical ? y : x,
        offset: 0,
      }));
    }
    function onSwipeMove(e: any) {
      const [x, y] = getEventPos(e);
      setState((prev) => {
        const { origin, offset } = prev;
        if (origin === undefined || offset === undefined) return prev;
        let newOffset = offset;
        if (isVertical) {
          newOffset = Math.round(y - origin);
        } else {
          newOffset = Math.round(x - origin);
        }
        return {
          ...prev,
          prevTargetIdx: undefined,
          animate: false,
          offset: newOffset,
        };
      });
    }
    function onSwipeEnd(e: any) {
      const [x, y] = getEventPos(e);
      setState((prev) => {
        const { origin, offset } = prev;
        if (origin === undefined || offset === undefined) return prev;
        let newOffset = offset;
        if (isVertical) {
          newOffset = Math.round(y - origin);
        } else {
          newOffset = Math.round(x - origin);
        }
        if (Math.abs(newOffset) < slideUnit / 3) {
          return {
            ...prev,
            offset: undefined,
            origin: undefined,
            animate: newOffset !== 0,
          };
        } else {
          let f: any;

          if (newOffset > 0) {
            f = _slide({ type: 'pre' }, (x) => x);
          } else {
            f = _slide({ type: 'next' }, (x) => x);
          }
          return f(prev);
        }
      });
    }
  }

  // event listener

  function onTransitionEnd() {
    if (batchEventRef.current) {
      const e = batchEventRef.current;
      batchEventRef.current = null;
      _slide(e);
    } else {
      flushSync(() => {
        setState(({ targetIdx }) => {
          let newTargetIdx = targetIdx;
          if (infinity) {
            if (targetIdx === 0) newTargetIdx = slideCount;
            if (targetIdx === slideCount + 1) newTargetIdx = 1;
          }
          return {
            animate: false,
            targetIdx: newTargetIdx,
          };
        });
      });
    }
  }

  // private methods
  function _slide(
    e: SlideEvent,
    cpsNext: (f: React.SetStateAction<typeof state>) => any = setState,
  ) {
    return cpsNext(({ targetIdx }) => {
      if (e.type === 'ix') {
        const newTargetIdx = infinity ? e.idx + 1 : e.idx;
        return Object.assign(
          {
            animate: true,
            targetIdx: newTargetIdx,
          },
          targetIdx !== newTargetIdx && {
            prevTargetIdx: targetIdx,
          },
        );
      } else if (e.type === 'next') {
        if (
          infinity ? targetIdx >= slideCount + 1 : targetIdx >= slideCount - 1
        ) {
          return {
            animate: false,
            targetIdx: infinity ? slideCount + 1 : slideCount - 1,
          };
        }
        return {
          animate: true,
          prevTargetIdx: targetIdx,
          targetIdx: targetIdx + 1,
        };
      } else {
        if (targetIdx === 0) {
          return { animate: false, targetIdx };
        }
        return {
          animate: true,
          prevTargetIdx: targetIdx,
          targetIdx: targetIdx - 1,
        };
      }
    });
  }
};

export const getTrackChildrenInfo = (
  children: React.ReactNode,
  infinity = true,
) => {
  let firstCloned: any = null;
  let lastCloned: any = null;
  const elements = React.Children.toArray(children);
  const realElements = elements.map((child: any, idx) => {
    if (idx === 0) {
      firstCloned = React.cloneElement(child, {
        key: '--lla-ui-slide-first-cloned',
      });
    }
    if (idx === elements.length - 1) {
      lastCloned = React.cloneElement(child, {
        key: '--lla-ui-slide-last-cloned',
      });
    }
    return child;
  });
  if (infinity && elements.length > 1) {
    return {
      children: [lastCloned, ...realElements, firstCloned],
      slideCount: elements.length,
    };
  }
  return { children: realElements, slideCount: elements.length };
};

export const useSlideTrack = (
  children: React.ReactNode,
  {
    slideUnit,
    infinity,
    ...options
  }: {
    slideUnit: number;
    slideGap?: number;
    infinity?: boolean;
    direction?: 'horization' | 'vertical';
    flushSync?: (f: () => void) => any;
    speedPerUnit?: number;
  } = {
    slideUnit: 0,
  },
) => {
  if (slideUnit === 0)
    throw new Error("[useSlideTrack]'s [slideUnit] must > 0");
  const { children: _children, slideCount } = React.useMemo(
    () => getTrackChildrenInfo(children, infinity),
    [children, infinity],
  );
  const { slide, isLast, isFirst, ...trackProps } = useTrackPropsAndMethod(
    slideUnit,
    slideCount,
    { infinity, ...options },
  );

  return {
    children: _children,
    slide,
    isLast,
    isFirst,
    count: slideCount,
    trackProps,
  };
};
