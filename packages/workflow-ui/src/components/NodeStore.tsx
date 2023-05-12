import React from 'react';

import type {
  Task,
  CustomTaskStrategy,
  NodeId,
  TaskStrategy,
} from '@lla-ui/workflow-core';
import type { Node } from 'reactflow';

// import {
//   createIfNodeUIWithHook,
//   // createWorkflowNodeUIWithHook,
//   createWorkflowNodeUIWithHook,
// } from './builtInNodes';

type GetTaskTemplateInfo<T> = T extends Task
  ? {
      type: T['type'];
      templateInfo: T['__phantomData'];
      alias?: string;
    }
  : never;

export type TaskTemplateData = Required<GetTaskTemplateInfo<Task>>;

export type WorkflowNodeType = Node<TaskTemplateData>;

type WorkflowTaskNodeComponent<TemplateInfo> = {
  template: React.FC<{
    id: NodeId;
    value: TemplateInfo;
    onChange: React.Dispatch<React.SetStateAction<TemplateInfo>>;
    editable?: boolean;
  }>;
  taskInfo: React.FC<{
    id: NodeId;
    task: Task;
  }>;
  initialValue: TemplateInfo;
};

export type NeededNodeTypeStore = {
  [k in keyof CustomTaskStrategy]: WorkflowTaskNodeComponent<
    ExtractTaskTemplateInfoFromStrategy<CustomTaskStrategy[k]>
  >;
};

const Context = React.createContext<NeededNodeTypeStore | null>(null);

export const useTargetNodeComponent = (type: string) =>
  React.useContext(Context)![type]!;

export const useNodeComponentStore = () => React.useContext(Context)!;

export const NodeTypeProvider: React.FC<{
  // nodeComponents: Omit<NeededNodeTypeStore, 'if' | 'workflow'>;
  nodeComponents: NeededNodeTypeStore;
  useTask?: (id: NodeId) => Task;
  children: React.ReactNode;
}> = ({ nodeComponents, children }) => {
  return (
    <Context.Provider
      value={React.useMemo(
        () => ({
          ...nodeComponents,
          // if: createIfNodeUIWithHook(useTask),
          // workflow: createWorkflowNodeUIWithHook(useTask),
        }),
        [nodeComponents],
      )}
    >
      {children}
    </Context.Provider>
  );
};

export type ExtractTaskTemplateInfoFromStrategy<T> = T extends TaskStrategy<
  any,
  any,
  any,
  any,
  infer U
>
  ? U
  : never;
