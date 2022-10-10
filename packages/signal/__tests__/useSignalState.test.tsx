/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { renderHook, act } from '@testing-library/react';

import {
  signal,
  useSignalState,
  SSRSupportWrapper,
  SharedScope,
  delay,
  setUpdateWrapper,
} from '../src';

describe('[useSingalState] test', () => {
  beforeAll(() => {
    setUpdateWrapper(act);
  });
  test('should work with sync execution', () => {
    const spy = jest.fn();
    const signal_async = signal('async', (_, str: string) => str, {
      args: ['default'],
    });
    const { result } = renderHook(
      () => {
        spy();
        return useSignalState(signal_async);
      },
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, recall] = result.current;
    expect(result.current[0].value).toBe('default');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(1);

    recall({ args: ['sayhello'] });

    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(2);

    recall({ args: ['sayhello'] });

    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(2);
  });

  test('should work with asynchronous execution', async () => {
    const spy = jest.fn();
    const signal_sync = signal(
      'sync',
      async (_, str: string) => {
        await delay(100);
        return str;
      },
      {
        args: ['default'],
      },
    );
    const { result } = renderHook(
      () => {
        spy();
        return useSignalState(signal_sync);
      },
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, recall] = result.current;
    expect(result.current[0].status).toBe('pending');
    expect(spy).toBeCalledTimes(1);

    await delay(100);
    expect(result.current[0].value).toBe('default');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(2);

    recall({ args: ['sayhello'] }); // return different will trigger rerender

    expect(result.current[0].value).toBe('default');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(2);

    await delay(100);
    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(3);

    recall({ args: ['sayhello'] }); // return the same result won't trigger rerender

    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(3);

    await delay(100);
    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(3);

    recall({ args: ['sayhello'], timeout: 10 }); // recall with short timeout will cause twice rerender(->pendding->fulfilled)
    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(3);

    await delay(10);
    expect(result.current[0].status).toBe('pending');
    expect(spy).toBeCalledTimes(4);

    await delay(100);
    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(5);

    // recall with long timeout is equal to recall with no timeout

    recall({ args: ['sayhello'], timeout: 1000 });

    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(5);

    await delay(100);
    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(5);

    recall({ args: ['hello world'], timeout: 1000 });
    expect(result.current[0].value).toBe('sayhello');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(5);

    await delay(100);
    expect(result.current[0].value).toBe('hello world');
    expect(result.current[0].status).toBe('fulfilled');
    expect(spy).toBeCalledTimes(6);
  });

  test('should work with asynchronous dependencies', async () => {
    const spy = jest.fn();
    const parent = signal(
      'parent',
      async (_, str: string) => {
        await delay(100);
        return str;
      },
      {
        args: ['parent'],
      },
    );
    const child = signal(
      'child',
      async (get, str: string) => {
        const p = await get(parent);
        await delay(100);
        return `${p}-${str}`;
      },
      {
        args: ['child'],
      },
    );
    const { result } = renderHook(
      () => {
        spy();
        return { parent: useSignalState(parent), child: useSignalState(child) };
      },
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    // eslint-disable-next-line no-unused-vars
    expect(result.current.parent[0].status).toBe('pending');
    expect(result.current.child[0].status).toBe('pending');
    expect(spy).toBeCalledTimes(1);

    await delay(100);
    expect(result.current.parent[0].status).toBe('fulfilled');
    expect(result.current.parent[0].value).toBe('parent');
    expect(result.current.child[0].status).toBe('pending');
    expect(spy).toBeCalledTimes(2);

    await delay(100);
    expect(result.current.parent[0].status).toBe('fulfilled');
    expect(result.current.parent[0].value).toBe('parent');
    expect(result.current.child[0].status).toBe('fulfilled');
    expect(result.current.child[0].value).toBe('parent-child');
    expect(spy).toBeCalledTimes(3);

    result.current.parent[1]({ args: ['new_parent'] }); // parent call will trigger child recall
    expect(result.current.parent[0].status).toBe('fulfilled');
    expect(result.current.parent[0].value).toBe('parent');
    expect(result.current.child[0].status).toBe('fulfilled');
    expect(result.current.child[0].value).toBe('parent-child');
    expect(spy).toBeCalledTimes(3);

    await delay(100);
    expect(result.current.parent[0].status).toBe('fulfilled');
    expect(result.current.parent[0].value).toBe('new_parent');
    expect(result.current.child[0].status).toBe('fulfilled');
    expect(result.current.child[0].value).toBe('parent-child');
    expect(spy).toBeCalledTimes(4);

    await delay(100);
    expect(result.current.parent[0].status).toBe('fulfilled');
    expect(result.current.parent[0].value).toBe('new_parent');
    expect(result.current.child[0].status).toBe('fulfilled');
    expect(result.current.child[0].value).toBe('new_parent-child');
    expect(spy).toBeCalledTimes(5);

    result.current.child[1]({ args: ['new_child'] }); // child call won't trigger parent recall
    expect(result.current.parent[0].status).toBe('fulfilled');
    expect(result.current.parent[0].value).toBe('new_parent');
    expect(result.current.child[0].status).toBe('fulfilled');
    expect(result.current.child[0].value).toBe('new_parent-child');
    expect(spy).toBeCalledTimes(5);

    await delay(102);
    expect(result.current.parent[0].status).toBe('fulfilled');
    expect(result.current.parent[0].value).toBe('new_parent');
    expect(result.current.child[0].status).toBe('fulfilled');
    expect(result.current.child[0].value).toBe('new_parent-new_child');
    expect(spy).toBeCalledTimes(6);
  });
});
