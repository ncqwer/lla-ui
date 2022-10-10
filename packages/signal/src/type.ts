/* eslint-disable no-unused-vars */
export const PLACEHOLDER = Symbol('PLACEHOLDER');

export type ID = string;
export type Version = number;

export type Context = {
  dependencies: ID[];
  dependencyMap: Record<ID, true>;
  raw: any | Promise<any> | null;
  data: {
    value: any | typeof PLACEHOLDER;
    error: Error | null;
    status: 'rejected' | 'fulfilled' | 'pending';
  };
  isOld: boolean;
  version: Version;
};

export type Option<Args extends any[]> = {
  args?: Args;
  timeout?: number;
};

export type Func = (...args: any[]) => any;

export type Signal<Param extends any[] = any[], Ret = any> = {
  execution: (get: SignalGet, ...args: Param) => Ret;
  id: ID;
  option?: Option<Param>;
};

export type SignalGet = <Param extends any[] = any[], Ret = any>(
  s: Signal<Param, Ret> | Signal<Param, Ret>['id'],
) => Ret;

export type SSRCache = Record<string, Record<string, Context>>;
