import type { Signal, ID } from './type';

export const signal = <Param extends any[], Ret>(
  id: ID,
  f: Signal<Param, Ret>['execution'],
  option?: Signal<Param, Ret>['option'],
): Signal<Param, Ret> => ({
  id,
  execution: f,
  option,
});
