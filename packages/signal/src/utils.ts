export const isPromisify = (v: any): v is Promise<any> =>
  typeof v?.then === 'function';
export const delay = (timeout: number) =>
  new Promise((res) => setTimeout(res, timeout));
