import React from 'react';

export const useRafState = <S>(initialState?: S | (() => S)) => {
  const [value, setValueRaw] = React.useState(initialState);
  const ref = React.useRef(0);
  const setValue: typeof setValueRaw = React.useCallback((nV) => {
    if (ref.current) cancelAnimationFrame(ref.current);
    ref.current = requestAnimationFrame(() => {
      setValueRaw(nV);
    });
  }, []);
  return [value, setValue] as const;
};
