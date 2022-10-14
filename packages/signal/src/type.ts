/* eslint-disable no-unused-vars */
export const PLACEHOLDER = Symbol('PLACEHOLDER');

export type ID = string;
export type Version = number;

export type Context<Ins = any> = {
  dependencies: ID[];
  dependencyMap: Record<ID, true>;
  raw: any | Promise<any> | null;
  data: {
    value: Ins;
    error: Error | null;
    status: 'rejected' | 'pending' | 'fulfilled';
  };
  isOld: boolean;
  version: Version;
  cleanup: null | (() => void);
  type: 'single' | 'mutiply';
};

export type Option<Args extends any[]> = {
  args?: Args;
  timeout?: number;
};

export type Func = (...args: any[]) => any;

export type PromiseValue<T> = T extends Promise<infer U> ? U : T;
export type Signal<Param extends any[] = any[], Ret = any> = {
  id: ID;
  option?: Option<Param>;
  typeMarker: PromiseValue<Ret>;
  type: 'single';
  execution: (helper: { get: SignalGet }, ...args: Param) => Ret;
};

export type DataSource<Ins = any, Param extends any[] = any[], Ret = any> = {
  id: ID;
  option?: Option<Param>;
  typeMarker: Ins;
  type: 'mutiply';
  execution: (
    helper: { get: SignalGet; set: (v: Ins) => void },
    ...args: Param
  ) => Ret;
};

export type SignalGet = {
  <Param extends any[] = any[], Ret = any>(
    s: Signal<Param, Ret> | Signal<Param, Ret>['id'],
  ): Ret;

  <Ins = any, Param extends any[] = any[], Ret = any>(
    s: DataSource<Ins, Param, Ret> | DataSource<Ins, Param, Ret>['id'],
  ): Ins;
};

export type SSRCache = Record<string, Record<string, Context>>;
