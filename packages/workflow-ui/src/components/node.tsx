import React from 'react';
import { useReactFlow } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import type { NodeId } from '@lla-ui/workflow-core';
import {
  TaskTemplateData,
  useNodeComponentStore,
  useTargetNodeComponent,
} from './NodeStore';
import { EditableContext, StageContext } from './mode';

export const WorkflowNode: React.FC<NodeProps<TaskTemplateData>> = ({
  id,
  data,
  isConnectable,
}) => {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      ></Handle>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      ></Handle>
      <CustomNodeBlock id={id} data={data}></CustomNodeBlock>
    </>
  );
};

const CustomNodeBlock: React.FC<{
  id: NodeId;
  data: TaskTemplateData;
}> = ({ id, data }) => {
  const instances = useReactFlow();
  const { type, alias } = data;
  const UI = useTargetNodeComponent(type);
  const store = useNodeComponentStore();
  const isEditable = React.useContext(EditableContext);
  const stage = React.useContext(StageContext);
  const Comp = stage === 'draft' ? UI.template : UI.taskInfo;
  return (
    <div className="p-2">
      <div className="flex items-center">
        <label className="block flex-shrink-0 uppercase tracking-wide text-gray-700 text-xs font-bold mr-2">
          类型:
        </label>
        <select
          className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-1 px-2 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
          value={type}
          onChange={(e) =>
            updateData((prev) => ({
              alias: prev.alias,
              type: e.target.value as any,
              templateInfo: store[e.target.value].initialValue,
            }))
          }
        >
          {Object.keys(store).map((v) => (
            <option value={v} key={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <label className="block uppercase tracking-wide flex-shrink-0 text-gray-700 text-xs font-bold mr-2">
          别名:
        </label>
        <input
          className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
          type="text"
          value={alias}
          onChange={(e) =>
            updateData((prev) => ({ ...prev, alias: e.target.value }))
          }
        />
      </div>
      <Comp
        value={data.templateInfo}
        onChange={updateTemplateData}
        id={id}
        editable={isEditable}
      ></Comp>
    </div>
  );

  function updateData(v: React.SetStateAction<TaskTemplateData>) {
    const { setNodes } = instances;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          if (typeof v === 'function') {
            node.data = v(node.data);
          } else {
            node.data = {
              ...node.data,
              ...v,
            };
          }
        }

        return node;
      }),
    );
  }

  function updateTemplateData(
    v: React.SetStateAction<TaskTemplateData['templateInfo']>,
  ) {
    updateData((prev): any => {
      if (typeof v === 'function') {
        return {
          ...prev,
          templateInfo: v(prev.templateInfo),
        };
      } else {
        return {
          ...prev,
          templateInfo: v,
        };
      }
    });
  }
};
