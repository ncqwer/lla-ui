/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { renderHook, act, render, screen } from '@testing-library/react';

import {
  signal,
  useSignal,
  SSRSupportWrapper,
  SharedScope,
  delay,
  setUpdateWrapper,
  waitForSSRRender,
} from '../src';

describe('[useSingal] test', () => {
  beforeAll(() => {
    setUpdateWrapper(act);
  });
  test('should work with sync execution', () => {
    const spy = jest.fn(() => 'test data');
    const signal_sync = signal('sync', spy);
    const { result, rerender } = renderHook(() => useSignal(signal_sync), {
      wrapper: ({ children }) => (
        <SSRSupportWrapper>
          <SharedScope scopeName="global">{children}</SharedScope>
        </SSRSupportWrapper>
      ),
    });
    expect(result.current.value).toBe('test data');
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.error).toBeNull();

    rerender();

    expect(spy).toBeCalledTimes(1);
  });

  test('should work with asynchronous execution', async () => {
    const signal_async = signal('async', async () => {
      await delay(10);
      return 'async data';
    });
    const { result } = renderHook(() => useSignal(signal_async), {
      wrapper: ({ children }) => (
        <SSRSupportWrapper>
          <SharedScope scopeName="global">{children}</SharedScope>
        </SSRSupportWrapper>
      ),
    });
    expect(result.current.status).toBe('pending');

    await delay(20);
    expect(result.current.status).toBe('fulfilled');
    expect(result.current.value).toBe('async data');
  });

  test('should work with shared store', async () => {
    const spy = jest.fn(async () => {
      await delay(10);
      return 'async data';
    });
    const signal_async = signal('async', spy);
    const signal_other = signal('other async', async ({ get }) => {
      const data = await get(signal_async);
      await delay(10);
      return `the same ${data}`;
    });

    const { result } = renderHook(
      () => [useSignal(signal_async), useSignal(signal_other)],
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    expect(result.current[0].status).toBe('pending');
    expect(result.current[1].status).toBe('pending');

    await delay(15);
    expect(result.current[0].status).toBe('fulfilled');
    expect(result.current[0].value).toBe('async data');
    expect(result.current[1].status).toBe('pending');

    await delay(20);
    expect(result.current[1].status).toBe('fulfilled');
    expect(result.current[1].value).toBe('the same async data');

    expect(spy).toBeCalledTimes(1);
  });

  test('should work with sync error', async () => {
    const signal_async = signal('async', () => {
      throw new Error();
    });
    const signal_other = signal('other async', async ({ get }) => {
      const data = get(signal_async);
      await delay(10);
      return `the same ${data}`;
    });

    const { result } = renderHook(
      () => [useSignal(signal_async), useSignal(signal_other)],
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    expect(result.current[0].status).toBe('rejected');
    // expect(result.current[1].status).toBe('pending');

    // await delay(10);

    // expect(result.current[1].status).toBe('rejected');
  });

  test('should work with asynchronous error', async () => {
    const signal_async = signal('async', () => {
      throw new Error();
    });
    const signal_other = signal('other async', async ({ get }) => {
      const data = await get(signal_async);
      await delay(10);
      return `the same ${data}`;
    });

    const { result } = renderHook(
      () => [useSignal(signal_async), useSignal(signal_other)],
      {
        wrapper: ({ children }) => (
          <SSRSupportWrapper>
            <SharedScope scopeName="global">{children}</SharedScope>
          </SSRSupportWrapper>
        ),
      },
    );
    expect(result.current[0].status).toBe('rejected');
    expect(result.current[1].status).toBe('pending');

    await delay(10);

    expect(result.current[1].status).toBe('rejected');
  });

  test('should work with ssr', async () => {
    const parent = signal('parent', async () => {
      await delay(10);
      return 'parent';
    });
    const child = signal('child', async ({ get }) => {
      await get(parent);
      await delay(10);
      return 'child';
    });
    const Parent = () => {
      const { status, value } = useSignal(parent);
      if (status === 'pending') return null;
      return (
        <>
          <div>{value}</div>
          <Child></Child>
        </>
      );
    };
    const Child = () => {
      const { status, value } = useSignal(child);
      if (status === 'pending') return null;
      return <div>{value}</div>;
    };

    const [data] = await waitForSSRRender(
      <SSRSupportWrapper>
        <SharedScope scopeName="global">
          <Parent></Parent>
        </SharedScope>
      </SSRSupportWrapper>,
    );

    expect(data).toBeTruthy();
    render(
      <SSRSupportWrapper cache={data}>
        <SharedScope scopeName="global">
          <Parent></Parent>
        </SharedScope>
      </SSRSupportWrapper>,
    );

    expect(screen.getByText('child')).toBeTruthy();
    expect(screen.getByText('parent')).toBeTruthy();
  });
});
