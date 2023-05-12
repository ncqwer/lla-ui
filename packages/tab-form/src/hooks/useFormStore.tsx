import React from 'react';
import { FormStore } from '../createFormStore';

export const FormStoreContext = React.createContext<FormStore | null>(null);

export const useFormStore = () => React.useContext(FormStoreContext)!;
