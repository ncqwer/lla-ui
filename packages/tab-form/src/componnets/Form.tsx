import React from 'react';
import { FormContext, useFormState } from '../hooks/useFormState';
import { FormState } from '../createFormState';

export const Form = function <T extends Record<string, {}> = any>({
  formState,
  children,
}: React.PropsWithChildren<{
  formState: FormState<T>;
}>) {
  const isFirstMountRef = React.useRef(true);
  if (isFirstMountRef.current) {
    formState.active();
    isFirstMountRef.current = false;
  }
  React.useEffect(() => {
    formState.setActive(true);
    return () => formState.setActive(false);
  }, []);
  return (
    <FormContext.Provider value={formState}>{children}</FormContext.Provider>
  );
};

export const FormBody = () => {
  const formState = useFormState();
  const [, forceUpdate] = React.useState({});
  React.useEffect(() => {
    return formState.subscribeRender(() => forceUpdate({}));
  }, [formState]);
  return formState.render() as React.ReactElement;
};
