import React from 'react';
import { FormState } from '../createFormState';

export const FormContext = React.createContext<FormState<any> | null>(null);

export const useFormState = () => React.useContext(FormContext)!;
