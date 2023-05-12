import React from 'react';

export const EditableContext = React.createContext(true);
export const StageContext = React.createContext<'draft' | 'running'>('draft');
