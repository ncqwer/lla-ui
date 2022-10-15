/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import {
  useSignal,
  dataSource,
  setUpdateWrapper,
  SSRSupportWrapper,
  SharedScope,
  atom,
  useSignalState,
  useAtom,
  signal,
} from '../src';
import { renderHook, act } from '@testing-library/react';

const createMockStore = (unregister?: () => {}) => {
  let handler: any = null;
  return {
    dispatch: (...args: any[]) => {
      if (handler) handler(...args);
    },
    register: (h: any) => {
      handler = h;
      return () => {
        if (unregister) unregister();
        handler = null;
      };
    },
  };
};

describe('[dataSource] test', () => {
  beforeAll(() => {
    setUpdateWrapper(act);
  });
  test('should support sync datasource', async () => {
    const store = createMockStore();
    const simple_sync = dataSource<number>()('simple_sync', ({ set }) => {
      set(1);
      return store.register((v: number) => set(v));
    });
    const mockRender = jest.fn();
    const { result } = renderHook(
      () => {
        mockRender();
        return useSignal(simple_sync);
      },
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );

    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(1);

    store.dispatch(2);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(2);

    expect(mockRender).toBeCalledTimes(2);
  });

  test('should support async datasource', async () => {
    const store = createMockStore();
    const simple_async = dataSource<number>()(
      'simple_async',
      async ({ set }) => {
        await new Promise((res) => setTimeout(res));
        set(1);
        return store.register((v: number) => set(v));
      },
    );
    const mockRender = jest.fn();
    const { result } = renderHook(
      () => {
        mockRender();
        return useSignal(simple_async);
      },
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    expect(result.current.status).toBe('pending');
    expect(result.current.error).toBeNull();

    await new Promise((res) => setTimeout(res));

    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(1);

    store.dispatch(2);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(2);

    expect(mockRender).toBeCalledTimes(3);
  });

  test('should support sync get in async datasource', async () => {
    const un = jest.fn();
    const store = createMockStore(un);
    const atomNumber = atom('atom', 0);
    const simple_async = dataSource<number>()(
      'simple_async',
      async ({ get, set }) => {
        await new Promise((res) => setTimeout(res));
        const base = get(atomNumber);
        set(base + 1);
        return store.register((v: number) => set(v + base));
      },
    );
    const mockRender = jest.fn();
    const { result } = renderHook(
      () => {
        mockRender();
        const [, setNumber] = useAtom(atomNumber, 0);
        return { ...useSignal(simple_async), setNumber };
      },
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    expect(result.current.status).toBe('pending');
    expect(result.current.error).toBeNull();

    await new Promise((res) => setTimeout(res));

    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(1);

    store.dispatch(2);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(2);

    expect(mockRender).toBeCalledTimes(3);

    result.current.setNumber(10);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.value).toBe(2);

    await new Promise((res) => setTimeout(res));

    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(11);
    store.dispatch(2);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(12);

    expect(mockRender).toBeCalledTimes(6);
  });

  test('should support async get in async datasource', async () => {
    const un = jest.fn();
    const store = createMockStore(un);
    const asyncNumber = signal(
      'async',
      async (_, v) => {
        return v;
      },
      { args: [0] },
    );
    const simple_async = dataSource<number>()(
      'simple_async',
      async ({ get, set }) => {
        await new Promise((res) => setTimeout(res));
        const base = await get(asyncNumber);
        set(base + 1);
        return store.register((v: number) => set(v + base));
      },
    );
    const mockRender = jest.fn();
    const { result } = renderHook(
      () => {
        mockRender();
        const [, recall] = useSignalState(asyncNumber);
        return {
          ...useSignal(simple_async),
          setNumber: (v: number) => recall({ args: [v] }),
        };
      },
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    expect(result.current.status).toBe('pending');
    expect(result.current.error).toBeNull();

    await new Promise((res) => setTimeout(res));

    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(1);

    store.dispatch(2);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(2);

    expect(mockRender).toBeCalledTimes(4);

    result.current.setNumber(10);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.value).toBe(2);

    await new Promise((res) => setTimeout(res, 10));

    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(11);
    store.dispatch(2);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe(12);

    expect(mockRender).toBeCalledTimes(7);
  });
});
