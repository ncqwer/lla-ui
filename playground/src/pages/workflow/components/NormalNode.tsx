import type { TaskStrategy } from '@lla-ui/workflow-core';

import type { NeededNodeTypeStore } from '@lla-ui/workflow-ui';
import React from 'react';
import { Inspector } from 'react-inspector';
import { useTask } from './builtInNodes';
import { useWorkflowClient } from './workflowStore';

export const NormalNodeUI: NeededNodeTypeStore['normal'] = {
  template: ({ value, onChange }) => {
    const code = value.code;
    return (
      <>
        <div className="mt-3 flex items-center justify-between">
          <label className="block uppercase tracking-wide flex-shrink-0 text-gray-700 text-xs font-bold mr-2">
            表达式:
          </label>
          <input
            className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            type="text"
            value={code}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, code: e.target.value }))
            }
          />
        </div>
      </>
    );
  },
  taskInfo: ({ id }) => {
    const task = useTask(id);
    const taskData = React.useMemo(
      () => ({
        stats: task?.status,
        id: task?.id,
        result: task?.result,
      }),
      [task],
    );
    const client = useWorkflowClient();
    return (
      <div>
        <div
          onClick={() => {
            if (task && task.id) client.endTask(task.id, {});
          }}
        >
          End It!!
        </div>
        <Inspector data={taskData} table={false}></Inspector>
      </div>
    );
  },
  initialValue: {
    code: 'true',
  },
};

export const NormalTaskStrategy: TaskStrategy<
  'normal',
  {
    timestamp: number;
    code: string;
    aliases?: string[];
  },
  null,
  any,
  {
    code: string;
    aliases?: string[];
  }
> = {
  type: 'normal',
  beforeStart({ templateInfo }) {
    return {
      ...templateInfo,
      timestamp: Date.now(),
    };
  },
  async notifyStart({ chainId, nodeId }) {
    console.log(
      '%c [ { chainId, nodeId } ]-22',
      'font-size:13px; background:pink; color:#bf2c9f;',
      { chainId, nodeId },
    );
  },

  async summary({ info }, { getTaskResult }) {
    const { code, aliases } = info;
    const chainInfo = (aliases || []).reduce(
      (acc, alias) => ({
        ...acc,
        [alias]: getTaskResult(alias),
      }),
      {},
    );
    const logger = createLogger();
    const result = new Function('CHAININFO', `console`, code)(
      chainInfo,
      logger,
    );
    return {
      result,
      log: logger.eject(),
    };
  },

  async notifyEnd() {
    return;
  },
};

const createLogger = () => {
  const strs = [] as string[];

  return {
    log: (v: string) => strs.push(v),
    warn: (v: string) => strs.push(`WARNING======>:${v}`),
    error: (v: string) => strs.push(`ERROR=====>:${v}`),
    eject: () => {
      return strs.join('\n');
    },
  };
};

declare module '@lla-ui/workflow-core' {
  interface CustomTaskStrategy {
    normal: typeof NormalTaskStrategy;
  }
}
