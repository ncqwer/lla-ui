export type Func<Params extends any[] = any[], Ret = any> = (
  // eslint-disable-next-line no-unused-vars
  ...args: Params
) => Ret;
