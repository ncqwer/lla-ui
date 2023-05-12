import React from 'react';
import { createFormStore, FormStore } from '../createFormStore';
import { FormStoreContext } from '../hooks/useFormStore';

export const FormStoreProvider = React.forwardRef<
  FormStore,
  { children?: React.ReactNode }
>(({ children }, ref) => {
  const storeRef = React.useRef<FormStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createFormStore();
  }

  React.useImperativeHandle(ref, () => storeRef.current!, []);

  return (
    <FormStoreContext.Provider value={storeRef.current}>
      {children}
    </FormStoreContext.Provider>
  );
});
