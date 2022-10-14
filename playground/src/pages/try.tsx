import React from 'react';
import {
  ID,
  Signal,
  signal,
  useSignalState,
  dataSource,
  useSignal,
} from '@lla-ui/signal';
// eslint-disable-next-line import/no-extraneous-dependencies
import { transform } from 'sucrase';
import { useSize } from '@lla-ui/utils';

const useStrSignalState = (key: string, code: string) => {
  const s = React.useMemo(() => {
    let execution: any = null;
    try {
      const adjustedCode = `return ${code.trim().replace(/;$/, '')}`.trim();
      execution = new Function(
        transform(adjustedCode, { transforms: ['typescript'] }).code,
      )();
    } catch (e) {
      execution = function () {
        throw e;
      };
    }
    return signal(key, execution);
  }, [code, key]);
  return useSignalState(s);
};

const atom = function <T>(key: ID, _initialValue: T) {
  let prev = _initialValue;
  return signal(key, (_, v: React.SetStateAction<T>) => {
    if (typeof v === 'function') {
      prev = (v as any)(prev);
    } else {
      prev = v;
    }
    return prev;
  });
};

const useAtom = function <T>(
  signal: Signal<Array<T | ((v: any) => T)>, T>,
  initialState: T | (() => T),
) {
  const [value, recall] = useSignalState(signal, {
    args: [initialState],
  });
  if (value.error) throw value.error;
  return [
    value.value as T,
    React.useCallback(
      (v: React.SetStateAction<T>) => recall({ args: [v] }),
      [recall],
    ),
  ] as const;
};

const source = dataSource<string>()('datasource', async ({ get, set }) => {
  await new Promise((res) => setTimeout(res, 1000));
  const v = get('instant');
  console.log(
    '%c [ v ]-63',
    'font-size:13px; background:pink; color:#bf2c9f;',
    v,
  );
  let handler: any = null;
  let flag = false;
  const id = setInterval(() => {
    console.log('ajskdfjsl');
    set(`${v}-${Date.now()}`);
    if (!flag) {
      flag = true;
      handler(() => {
        console.log('clear', v);
        clearInterval(id);
      });
    }
  }, 5000);
  return new Promise((res) => {
    handler = res;
  });
  return () => {};
});

const delay = atom('delay', 1000);

const dateTimeBySeconds = dataSource<number>()(
  'dataTimeBySecond',
  ({ get, set }) => {
    const d = get(delay);
    let handler: any = null;
    let flag = false;
    const id = setInterval(() => {
      set(Date.now());
      if (!flag) {
        flag = true;
        handler(() => {
          clearInterval(id);
        });
      }
    }, d);
    return new Promise((res) => {
      handler = res;
    });
  },
);

export default () => {
  const [instant, recallInstant] = useStrSignalState(
    'instant',
    `
   (_,str) => {
    return str || 'helloworld';
  }
  `,
  );
  const state = useSignal(dateTimeBySeconds);
  console.log(
    '%c [ state ]-124',
    'font-size:13px; background:pink; color:#bf2c9f;',
    state,
  );
  useSignal(source);
  const [size, ref] = useSize();
  const [text, setText] = useAtom<string>(
    React.useMemo(() => atom('atom', 'hello'), []),
    'world',
  );

  const [parent] = useStrSignalState(
    'parent',
    `
  async ({ get }) => {
    await new Promise(res=>setTimeout(res,100));
    return get('datasource');
  }
  `,
  );
  const [child] = useStrSignalState(
    'child',
    `
  async ({ get }) => {
    const data = await get('parent');
    await new Promise(res=>setTimeout(res,1000)) ;
    return \`the same $\{data\}\`;
  } 
  `,
  );

  const style = child.status === 'fulfilled' ? { height: '60px' } : {};
  return (
    <div ref={ref} style={style}>
      <input
        type="text"
        value={text}
        onChange={(e) =>
          setText((prev) => {
            console.log(
              '%c [ prev ]-96',
              'font-size:13px; background:pink; color:#bf2c9f;',
              prev,
            );
            return e.target.value;
          })
        }
      />
      <div>
        <div>parent</div>
        {parent.status === 'pending' && <div>loading...</div>}
        {parent.status === 'rejected' && <div>{`${parent.error}`}</div>}
        {parent.status === 'fulfilled' && <div>{parent.value as any}</div>}
      </div>
      <div>
        <div>child</div>
        {child.status === 'pending' && <div>loading...</div>}
        {child.status === 'rejected' && <div>{`${child.error}`}</div>}
        {child.status === 'fulfilled' && <div>{child.value as any}</div>}
      </div>
      <div>{size?.height || 'noono'}</div>
      <input
        className="px-4 py-2 bg-primary-container outline-neutral-variant-outline outline-1"
        type="text"
        value={instant.value as any}
        onChange={(e) => {
          recallInstant({
            args: [e.target.value],
          });
        }}
      />
    </div>
  );
};
