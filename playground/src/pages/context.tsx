/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';

import { basicSetup, EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { vim, Vim } from '@replit/codemirror-vim';
import { useDerivedValue, useEvent } from '@lla-ui/utils';

import { v4 as uuid } from 'uuid';
import { signal, useSignalState, useSignalStore } from '@lla-ui/signal';

import { transform } from 'sucrase';

import classnames from 'classnames';
import prettier from 'prettier';
import prettierParser from 'prettier/parser-babel';
import { Modal, Popover } from '@lla-ui/floating';
import { Inspector } from 'react-inspector';

Vim.map('jj', '<Esc>', 'insert'); // alt+j

export const CodeBlock = React.forwardRef<
  { getCode: () => string; save: () => void },
  {
    className?: string;
    onCodeChangeComplete?: React.Dispatch<React.SetStateAction<string>>;
    code?: string;
  }
>(
  (
    {
      code: _code = `const path = require('path');`,
      onCodeChangeComplete: _onCodeChangeComplete,
      className,
    },
    ref,
  ) => {
    const [code, onCodeChangeComplete] = useDerivedValue(
      _code,
      _onCodeChangeComplete,
    );
    const domRef = React.useRef(null);
    const editorRef = React.useRef<EditorView | null>(null);
    const handleSave = useEvent(handleSaveImpl);

    React.useImperativeHandle(
      ref,
      () => {
        return {
          getCode: () => {
            if (!editorRef.current)
              throw new Error(
                `Can't call [getCode] when CodeBlock is unmounted`,
              );
            return editorRef.current.state.doc.toJSON().join('\n');
          },
          save: handleSave,
        };
      },
      [],
    );
    React.useEffect(() => {
      if (domRef.current) {
        const startState = EditorState.create({
          doc: '',
          extensions: [basicSetup],
        });
        const view = new EditorView({
          state: startState,
          parent: domRef.current,
        });
        editorRef.current = view;
        Vim.defineEx('write', 'w', () => {
          handleSave();
        });
        return () => {
          view.destroy();
          editorRef.current = null;
        };
      }
    }, [onCodeChangeComplete, handleSave]);

    React.useEffect(() => {
      if (editorRef.current) {
        editorRef.current.setState(
          EditorState.create({
            doc: code,
            extensions: [
              // make sure vim is included before other keymaps
              vim(),
              javascript({ typescript: true }),
              // include the default keymap and all other keymaps you want to use in insert mode
              basicSetup,
            ],
          }),
        );
      }
    }, [code]);

    return <div ref={domRef} className={classnames(className)}></div>;
    function handleSaveImpl() {
      const rawStr = editorRef.current!.state.doc.toJSON().join('\n');
      const str = prettier.format(rawStr, {
        parser: 'babel-ts',
        plugins: [prettierParser],
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 80,
      });
      onCodeChangeComplete(str);
    }
  },
);

export const BlockEditor: React.FC<{
  code: string;
  name: string;
  onChange: React.Dispatch<{ code: string; name: string }>;
}> = ({ code, name, onChange }) => {
  const ref = React.useRef<any>(null);
  const [n, setN] = useDerivedValue(name);
  return (
    <div className="w-[720px] h-[640px] px-4 pt-4 pb-3 rounded bg-white shadow-2xl flex flex-col ">
      <div className="text-sm flex justify-between items-center">
        <div>
          <span className="mr-4">名称:</span>
          <input
            type="text"
            className="focus-visible:outline-none"
            value={n}
            onChange={(e) => setN(e.target.value)}
          ></input>
        </div>
        <div className="flex">
          <button
            type="button"
            className="mr-4 w-20  flex justify-center items-center rounded-md bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5"
          >
            取消
          </button>
          <button
            type="button"
            className="w-20 flex justify-center items-center rounded-md bg-primary-60 hover:bg-primary-50 text-primary-30 hover:text-primary-20 text-sm font-medium px-3 py-1.5"
            onClick={() => ref.current!.save()}
          >
            保存
          </button>
        </div>
      </div>
      <CodeBlock
        className="bg-white flex-1 overflow-auto "
        code={code}
        ref={ref}
        onCodeChangeComplete={(newCode) => {
          onChange({
            code: newCode as string,
            name: n,
          });
        }}
      ></CodeBlock>
    </div>
  );
};

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

export const CTXBlock: React.FC<{
  code: string;
  name: string;
  uuid: string;
  active?: boolean;
  onActiveChange?: () => void;
  dependencyActive?: boolean;
  onChange: React.Dispatch<
    React.SetStateAction<{ code: string; name: string }>
  >;
  onDependenciesChange: (uuidMap: Record<string, true>) => void;
}> = ({
  code,
  active,
  name,
  uuid,
  onChange,
  dependencyActive,
  onDependenciesChange,
  onActiveChange = () => {},
}) => {
  const [state] = useStrSignalState(uuid, code);
  const store = useSignalStore();
  React.useEffect(() => {
    if (active) {
      const ctxMap = store.__internalData;
      onDependenciesChange({ ...ctxMap.get(uuid)!.dependencyMap });
    }
  }, [store, state, uuid, active]);

  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  return (
    <div
      className={classnames(
        active && 'outline outline-primary-key outline-2 outline-offset-2',
        dependencyActive && 'border-primary-key',
        'relative border-solid hover:border-primary-key hover:shadow-lg group block rounded-lg p-4 border border-neutral-variant-outline cursor-pointer',
      )}
      onClick={() => onActiveChange()}
    >
      <div className="mb-2 leading-6 font-medium text-neutral-on-background">
        <span className="mr-1">名称:</span>
        <span>{name}</span>
      </div>
      <div className="text-sm text-neutral-on-background/90 font-medium sm:mb-4 lg:mb-0 xl:mb-4">
        <span className="mr-1">ID:</span>
        <span>{uuid}</span>
      </div>
      {active && (
        <div className="flex mr-2 absolute bottom-2 right-2">
          <div className="mr-1" onClick={() => setIsEditorOpen(true)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M40 33V42C40 43.1046 39.1046 44 38 44H31.5"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M40 16V6C40 4.89543 39.1046 4 38 4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44H16"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 16H30"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M23 44L40 23"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M16 24H24"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mr-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M42 8V24"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 24L6 40"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M42 24C42 14.0589 33.9411 6 24 6C18.9145 6 14.3216 8.10896 11.0481 11.5M6 24C6 33.9411 14.0589 42 24 42C28.8556 42 33.2622 40.0774 36.5 36.9519"
                stroke="#333"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <Popover
            trigger="click"
            placement="bottom"
            contentProps={{
              showArrow: true,
              className: 'bg-white p-4 rounded shadow-xl',
            }}
            content={
              <div className="">
                <Inspector data={state} table={false}></Inspector>
              </div>
            }
          >
            <div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#icon-748c1e2336f0af1b)">
                  <path
                    d="M3.49381 17.7193L41.6776 6.32232L30.3639 44.5893L21.4834 35.7089L21.5251 26.4749L11.9791 26.2045L3.49381 17.7193Z"
                    stroke="#333"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M27.5352 14.8908C25.9731 16.4529 25.9731 18.9856 27.5352 20.5477C29.0973 22.1098 31.63 22.1098 33.1921 20.5477C34.7542 18.9856 34.7542 16.4529 33.1921 14.8908C31.63 13.3287 29.0973 13.3287 27.5352 14.8908Z"
                    fill="#333"
                  />
                  <path
                    d="M41.6777 6.40558L30.364 17.7193"
                    stroke="#333"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="icon-748c1e2336f0af1b">
                    <rect width="48" height="48" fill="#333" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </Popover>
        </div>
      )}
      <div className="absolute flex top-2 right-2 text-xs items-center">
        <div>
          {state.status === 'fulfilled' && (
            <div className="px-2 py-1 text-blue-600 bg-blue-100 rounded-sm">
              已运行
            </div>
          )}
          {state.status === 'pending' && (
            <div className="px-2 py-1 text-green-600 bg-green-100 rounded-sm">
              运行中
            </div>
          )}
          {state.status === 'rejected' && (
            <div className="px-2 py-1 text-red-600 bg-red-100 rounded-sm">
              错误中
            </div>
          )}
        </div>
      </div>
      <Modal open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <BlockEditor
          name={name}
          code={code}
          onChange={({ name, code }) => {
            onChange({ code, name });
            setIsEditorOpen(false);
          }}
        ></BlockEditor>
      </Modal>
    </div>
  );
};

export default () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newCode, setNewCode] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [blockMap, setBlockMap] = React.useState<
    Record<
      string,
      {
        name: string;
        code: string;
      }
    >
  >({});
  const [dependencyMap, setDependencyMap] = React.useState<
    Record<string, true>
  >({});
  const [activeUuid, setActiveUuid] = React.useState<string | null>(null);
  console.log(
    '%c [ activeUuid ]-408',
    'font-size:13px; background:pink; color:#bf2c9f;',
    activeUuid,
  );
  console.log(
    '%c [ dependencyMap ]-402',
    'font-size:13px; background:pink; color:#bf2c9f;',
    dependencyMap,
  );
  return (
    <div className="w-screen bg-neutral-background text-neutral-on-background">
      <div className="w-full mx-auto max-w-[1024px] px-4 sm:px-6 lg:px-4 xl:px-6 py-4 sm:pb-6 lg:pb-4 xl:pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg leading-6 font-medium text-black">项目</h2>
          <button
            type="button"
            className="flex group justify-center items-center rounded-md bg-primary-60 hover:bg-primary-50 text-primary-30 hover:text-primary-20 text-sm font-medium px-4 py-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg
              className="text-primary-30 group-hover:text-primary-20 mr-2"
              width="12"
              height="20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6 5a1 1 0 011 1v3h3a1 1 0 110 2H7v3a1 1 0 11-2 0v-3H2a1 1 0 110-2h3V6a1 1 0 011-1z"
              />
            </svg>
            New
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(blockMap).map(([uuid, { code, name }]) => (
            <CTXBlock
              key={uuid}
              uuid={uuid}
              code={code}
              name={name}
              onChange={(v) => updateBlock(uuid, v)}
              active={uuid === activeUuid}
              onActiveChange={() => setActiveUuid(uuid)}
              dependencyActive={!!dependencyMap[uuid]}
              onDependenciesChange={setDependencyMap}
            ></CTXBlock>
          ))}
        </div>
        <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <BlockEditor
            name={newName}
            code={newCode}
            onChange={({ name, code }) => {
              setNewCode('');
              setNewName('');
              setIsCreateModalOpen(false);
              addNew({ name, code });
            }}
          ></BlockEditor>
        </Modal>
      </div>
    </div>
  );

  function addNew({ code, name }: { code: string; name: string }) {
    let newId = uuid();
    while (blockMap[newId]) newId = uuid();
    setBlockMap({
      ...blockMap,
      [newId]: {
        code,
        name,
      },
    });
  }

  function updateBlock(uuid: string, others: any) {
    setBlockMap((prev) => ({
      ...prev,
      [uuid]: {
        ...prev[uuid],
        ...others,
      },
    }));
  }

  // function _removeBlock(uuid: string, others: any) {
  //   setBlockMap((prev) => {
  //     const newMap = { ...prev };
  //     delete newMap[uuid];
  //     return newMap;
  //   });
  // }
};
