import React from 'react';
import {
  atom,
  dataSource,
  signal,
  useAtom,
  useSignalState,
  SharedScope,
  useSignalStore,
} from '@lla-ui/signal';
import type { Context } from '@lla-ui/signal';
import { Popover } from '@lla-ui/floating';
import { Inspector } from 'react-inspector';
import { v4 as uuid } from 'uuid';
import { css, cx } from '@emotion/css';

const ids_atom = atom('ids_atom', [] as string[]);

const wait = (delay: number) => new Promise((res) => setTimeout(res, delay));

const createItemState = (id: string) => {
  const item = atom<string>(`item-${id}`, '');
  const itemDataSource = dataSource<number>()(
    `item-dataSource-${id}`,
    async ({ set }) => {
      await wait(1000);
      set(Date.now());
      const target = setInterval(() => {
        console.log(`push mode run ${id}`);
        set(Date.now());
      }, 1000);
      console.log(
        '%c [ target ]-29',
        'font-size:13px; background:pink; color:#bf2c9f;',
        target,
      );
      return () => {
        console.log(
          '%c [ clearInterval ]-34',
          'font-size:13px; background:pink; color:#bf2c9f;',
          target,
        );
        clearInterval(target);
      };
    },
  );
  const itemRequest = signal(`item-request-${id}`, async ({ get }) => {
    console.log(`pull mode run ${id}`);
    await wait(1000);
    const name = get(item);
    const ds = await get(itemDataSource);
    return `${name}:${ds}`;
  });
  return [item, itemDataSource, itemRequest] as const;
};

function AsyncData<T>({ data }: { data: Context<T>['data'] }) {
  const { status } = data;
  return (
    <Popover
      trigger="click"
      contentProps={{
        showArrow: true,
        className: 'bg-white p-4 rounded shadow-xl',
      }}
      content={
        <div className="">
          <Inspector data={data} table={false}></Inspector>
        </div>
      }
      placement="bottom-end"
    >
      <div className="ml-3 cursor-pointer focus-visible:outline-none">
        {status === 'fulfilled' && (
          <div className="text-green-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25.5 36H21L11 41V36H4V6H44V17"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M12 14H15L18 14"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M12 20H18L24 20"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M29 30L35 35L44 24"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
        {status === 'pending' && (
          <div className="text-yellow-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M44 16V36H29L24 41L19 36H4V6H34"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M23 20H25.0025"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M33.001 20H34.9999"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M13.001 20H14.9999"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="43" cy="7" r="3" fill="#333" />
            </svg>
          </div>
        )}
        {status === 'rejected' && (
          <div className="text-red-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25.5 37H21L11 42V37H4V7H44V18"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M12 15H15L18 15"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M12 21H18L24 21"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M32 25L44 37"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M44 25L32 37"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </Popover>
  );
}

const TodoItem: React.FC<{
  id: string;
  onRemoveItem: () => void;
}> = ({ id, onRemoveItem }) => {
  const [n, ds, req] = React.useMemo(() => createItemState(id), [id]);
  const [name, setName] = useAtom(n, `default name ${id}`);
  const [pushData] = useSignalState(ds);
  const [pullData] = useSignalState(req);
  return (
    <div className="item relative border border-primary-key px-4 py-2 rounded">
      <div className="flex items-center">
        <div className="w-12">Name:</div>
        <input
          className="px-3 py-2 leading-6 bg-transparent focus-visible:outline-none"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex items-center">
        <div className="w-12">Push: </div>
        <AsyncData data={pushData}></AsyncData>
      </div>
      <div className="flex items-center">
        <div className="w-12">Pull: </div>
        <AsyncData data={pullData}></AsyncData>
      </div>
      <div className="flex mr-3 items-center absolute right-0 top-1/2 transform -translate-y-1/2">
        <div onClick={onRemoveItem} className="text-red-500">
          <svg
            width="24"
            height="24"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 10V44H39V10H9Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M20 20V33"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M28 20V33"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M4 10H44"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M16 10L19.289 4H28.7771L32 10H16Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const TodoList: React.FC<{ onSave: (v: any) => void }> = ({ onSave }) => {
  const [ids, setIds] = useAtom(ids_atom, ['default']);
  const store = useSignalStore();
  return (
    <div
      className={cx(css`
        .item + .item {
          margin-top: 2rem;
        }
      `)}
    >
      {ids.map((id) => (
        <TodoItem
          id={id}
          key={id}
          onRemoveItem={() => setIds((prev) => prev.filter((i) => i !== id))}
        ></TodoItem>
      ))}
      <div className="item flex">
        <div
          className="flex-1 border-neutral-variant-outline text-neutral-variant-on-surface border-dashed border p-4 flex justify-center items-center rounded cursor-pointer hover:shadow hover:border-solid"
          onClick={() => {
            setIds((prev) => {
              const id = generateId();
              return prev.concat(id);

              function generateId() {
                const cache = prev.reduce(
                  (acc, i) => ({ ...acc, [i]: true }),
                  {},
                );
                while (true) {
                  const id = uuid();
                  if (!cache[id]) return id;
                }
              }
            });
          }}
        >
          Add
        </div>
        <div
          onClick={() => {
            onSave(store.getSnapshot());
          }}
          className="cursor-pointer flex-1 flex justify-center items-center bg-primary-60 hover:bg-primary-50 text-primary-30 hover:text-primary-20 ml-4 rounded"
        >
          Save
        </div>
      </div>
    </div>
  );
};

export default () => {
  const [mode, setMode] = React.useState<'active' | 'forzen'>('active');
  const [caches, setCaches] = React.useState([]);
  console.log(
    '%c [ caches ]-312',
    'font-size:13px; background:pink; color:#bf2c9f;',
    caches,
  );
  const [idx, setIdx] = React.useState(0);
  return (
    <div className="relative w-screen h-screen bg-neutral-variant-surface">
      <div className="mx-auto w-full h-full max-w-[720px] pt-6">
        <SharedScope
          key={mode}
          scopeName={mode}
          isForzen={mode === 'forzen'}
          forzenCache={caches[idx]}
        >
          <TodoList
            onSave={(v) => setCaches((prev) => prev.concat(v))}
          ></TodoList>
        </SharedScope>
      </div>
      <div className="absolute bottom-16 right-16 cursor-pointer">
        <div
          onClick={() => {
            console.log('======================>');
            setMode((prev) => (prev === 'active' ? 'forzen' : 'active'));
          }}
        >
          {mode}
        </div>
        {mode === 'forzen' && (
          <div
            className={css`
              display: flex;

              div + div {
                margin-left: 0.75rem;
              }
            `}
          >
            {idx > 0 && (
              <div onClick={() => setIdx((prev) => prev - 1)}>prev</div>
            )}
            <div>{idx}</div>
            {idx < caches.length - 1 && (
              <div onClick={() => setIdx((prev) => prev + 1)}>next</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
