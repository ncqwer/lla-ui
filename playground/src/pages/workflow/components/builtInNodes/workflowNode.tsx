import React from 'react';

import type { NeededNodeTypeStore } from '@lla-ui/workflow-ui';
import { Inspector } from 'react-inspector';
import { useTask } from '.';

export const WorkflowNode: NeededNodeTypeStore['workflow'] = {
  template: ({ value, onChange }) => {
    const code = value.code;
    return (
      <>
        {/* <div>{`${value.workflowId || 'subWorkflow'}`}</div> */}
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
    return <Inspector data={task} table={false}></Inspector>;
  },
  initialValue: {
    workflowId: 'subWorkflow',
    code: 'true',
  },
};
