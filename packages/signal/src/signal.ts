import type { Signal, ID, DataSource } from './type';

export const signal = <Param extends any[], Ret>(
  id: ID,
  f: Signal<Param, Ret>['execution'],
  option?: Signal<Param, Ret>['option'],
): Signal<Param, Ret> => ({
  id,
  execution: f,
  option,
  typeMarker: null as any, // only for type annotation
  type: 'single',
});

export const dataSource =
  <Ins>() =>
  <Param extends any[], Ret>(
    id: ID,
    f: DataSource<Ins, Param, Ret>['execution'],
    option?: Signal<Param, Ret>['option'],
  ): DataSource<Ins, Param, Ret> => ({
    id,
    execution: f,
    option,
    typeMarker: null as any, // only for type annotation
    type: 'mutiply',
  });
