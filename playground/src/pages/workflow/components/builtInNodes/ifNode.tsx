import type { NeededNodeTypeStore } from '@lla-ui/workflow-ui';
import React from 'react';
import { Inspector } from 'react-inspector';
import { useTask } from '.';

export const IfNode: NeededNodeTypeStore['if'] = {
  template: ({ value, onChange }) => {
    const code = value.code;
    console.log(
      '%c [ code ]-9',
      'font-size:13px; background:pink; color:#bf2c9f;',
      code,
      value,
    );
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
    return <Inspector data={taskData} table={false}></Inspector>;
  },
  initialValue: {
    code: 'true',
  },
};
