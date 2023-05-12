import React from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { view, lensPath, set } from '@zhujianshi/lens';
import { useDebounce, useEvent } from '@lla-ui/utils';
import { useFormState } from './useFormState';

export type Feedback =
  | {
      type: 'uncomplete';
    }
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'success';
    };

export const useFiled = ({
  name: _name,
  validate,
  validateDelay = 100,
}: {
  name: string[] | string;
  validateDelay?: number;
  validate?: (value: any) => Promise<Feedback>;
}) => {
  const name = React.useMemo(
    () => (typeof _name === 'string' ? [_name] : _name),
    [_name],
  );
  const formState = useFormState();
  const len = React.useMemo(() => lensPath<any>(name as any), [name]);
  const value = useSyncExternalStoreWithSelector(
    formState.subscribe,
    formState.getState,
    null,
    React.useMemo(() => {
      return (v: any) => view(len, v);
    }, [len]),
  );
  const [feedback, setFeedBack] = React.useState<Feedback>(() =>
    hasValidate
      ? {
          type: 'uncomplete',
        }
      : {
          type: 'success',
        },
  );
  const tokenRef = React.useRef<(() => void) | null>(() => {});
  const hasValidate = typeof validate === 'function';
  const [triggerValidate] = useDebounce(async (token: null | (() => void)) => {
    if (tokenRef.current !== token || !token) return;
    if (hasValidate) {
      const feed = await validate(value);
      if (tokenRef.current !== token) return;
      setFeedBack((prev) => {
        if (feed.type === 'error') return feed;
        if (feed.type === prev.type) return prev;
        return feed;
      });
    } else {
      setFeedBack((prev) => {
        if (prev.type === 'success') return prev;
        return {
          type: 'success',
        };
      });
    }
    token();
    tokenRef.current = null;
    return true;
  }, validateDelay);
  const onChange = useEvent((v: any) => {
    if (hasValidate || feedback.type !== 'success')
      tokenRef.current = formState.willComplete(...name);

    formState.dispatch((prev: any) => set(len, v, prev));
  });
  React.useEffect(() => {
    return formState.registerValidater(() => feedback.type === 'success');
  }, [feedback]);
  React.useEffect(() => {
    if (tokenRef.current) triggerValidate(tokenRef.current);
  }, [value, validate]);

  return {
    onChange,
    feedback,
    value,
  };
};
