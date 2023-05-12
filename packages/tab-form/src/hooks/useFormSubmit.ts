import React from 'react';
import { useFormState } from './useFormState';

export const useFormSubmit = () => {
  const [version, setVersion] = React.useState(0);

  const formState = useFormState();

  const [submit, setSubmit] = React.useState(() => formState.checkSubmit());

  React.useEffect(() => {
    formState.subscribeSubmit(() => setVersion((prev) => ++prev));
  }, []);

  React.useEffect(() => {
    const f = formState.checkSubmit();
    setSubmit(() => f);
  }, [version, formState]);

  return [!!submit, submit] as const;
};
