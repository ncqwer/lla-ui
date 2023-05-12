import React from 'react';

import { useDerivedValue, useEvent } from '@lla-ui/utils';
import { useFormStore } from './useFormStore';

const emptyObj = {};
const doNothing = () => {};
const returnCurrent = (current: any) => current;

export const useComplexValue = <T extends Record<string, any>>(
  name: string,
  children: React.ReactNode,
  {
    value: _value = emptyObj,
    onChange = doNothing,
    onBeforeChange: _onBeforeChange = returnCurrent,
  }: Partial<{
    value: Partial<T>;
    onChange: React.Dispatch<React.SetStateAction<T>>;
    onBeforeChange?: (curr: Partial<T>, prev: Partial<T>) => T;
  }> = {},
) => {
  const [value, setValue] = useDerivedValue<T>(_value as any, (v) => {
    setIsEditibg(false);
    onChange(v);
  });
  const [isEditing, setIsEditibg] = React.useState(false);
  const onBeforeChange = useEvent(_onBeforeChange);
  const store = useFormStore();

  return [value, isEditing, useEvent(edit)] as const;

  function edit() {
    if (isEditing) throw new Error('');
    store.openTab(name, children, {
      value,
      onChange: setValue,
      onBeforeChange,
    });
    setIsEditibg(true);
  }
};
