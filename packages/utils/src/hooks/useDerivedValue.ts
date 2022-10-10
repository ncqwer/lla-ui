import React from 'react';
import { useEvent } from './useEvent';

export const useDerivedValue = <T>(
  value: T,
  _onChange: React.Dispatch<React.SetStateAction<T>> = () => {},
) => {
  const onRawChange = useEvent(_onChange);
  const [{ inst }, forceUpdate] = React.useState(() => ({
    inst: {
      value,
      isInitial: true,
    },
  }));

  React.useMemo(() => {
    inst.isInitial = false;
    inst.value = value;
  }, [inst, value]);

  const onChange = React.useCallback(
    (nVal: React.SetStateAction<T>) => {
      inst.isInitial = true;
      onRawChange(nVal);
      if (!inst.isInitial) return;

      let newState = nVal;
      if (typeof nVal === 'function') {
        newState = (nVal as any)(inst.value);
      }
      if (nVal === inst.value) return;
      inst.value = newState as T;
      forceUpdate({ inst });
    },
    [inst, onRawChange],
  );
  React.useDebugValue(inst.value);
  return [inst.value, onChange] as const;
};
