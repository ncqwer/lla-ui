import React from 'react';
import { Feedback, useFiled } from '../hooks/useField';

export const Field: React.FC<{
  name: string[] | string;
  validateDelay?: number;
  validate?: (value: any) => Promise<Feedback>;
  children:
    | React.ReactNode
    | ((props: {
        value: any;
        onChange: React.Dispatch<React.SetStateAction<any>>;
        feedback: Feedback;
      }) => React.ReactNode);
  getValue?: (e: any) => any;
}> = ({
  name,
  validate,
  validateDelay,
  children,
  getValue = (e: any) => e.target.value,
}) => {
  const props = useFiled({
    validate,
    validateDelay,
    name,
  });

  if (typeof children === 'function') return children(props) as any;
  if (React.Children.only(children) && React.isValidElement(children))
    return React.cloneElement(children, {
      ...props,
      onChange: (e: any) => props.onChange(getValue(e)),
    } as any);

  throw new Error();
};
