import React from 'react';
import { createClient, Workflow } from '@lla-ui/workflow-core';
import { createShared } from '@zhujianshi/use-lens';

import type { Client, DataAdapter, Chain, Task } from '@lla-ui/workflow-core';
import { v4 as uuid } from 'uuid';
import { EditableContext, StageContext } from '@lla-ui/workflow-ui';
import { NormalTaskStrategy } from './NormalNode';

declare module '@lla-ui/workflow-core' {
  interface AtomicHelper {
    (): {
      WorkflowId: 'mainWorkflow' | 'subWorkflow';
      ChainId: string;
      TaskId: string;
      NodeId: string;
      ResultPointer: string;
    };
  }
}

export type Database = {
  chainMap: Record<string, Chain>;
  chainResultMap: Record<string, string>;
  taskMap: Record<string, Task>;
  mainWorkflow: Workflow;
  subWorkflow: Workflow;
};

export const DatabaseInfo = createShared<Database>({
  chainMap: {},
  chainResultMap: {},
  taskMap: {},
  mainWorkflow: {},
  subWorkflow: {},
});

const WorkflowClientContext = React.createContext<
  | (Client & {
      setEditable: React.Dispatch<boolean>;
      setStage: React.Dispatch<'draft' | 'running'>;
    })
  | null
>(null);

export const useWorkflowClient = () => React.useContext(WorkflowClientContext)!;

export const WorkflowClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const store = DatabaseInfo.useStore();
  const [editable, setEditable] = React.useState(true);
  const [stage, setStage] = React.useState<'draft' | 'running'>('draft');
  const [client] = React.useState(() => {
    const adapter: DataAdapter = {
      async findTask(uniqueKey) {
        const { taskMap } = store.getState();
        if (typeof uniqueKey === 'string') return taskMap[uniqueKey]!;
        return Object.values(taskMap).find((v) => {
          return (
            v.chainId === uniqueKey.chainId && v.nodeId === uniqueKey.nodeId
          );
        })!;
      },
      async createTasks(tasks) {
        const { taskMap, ...rest } = store.getState();
        store.setState({
          ...rest,
          taskMap: tasks.reduce((acc, task) => {
            const taskId = uuid();
            return {
              ...acc,
              [taskId]: { ...task, id: taskId },
            };
          }, taskMap as any),
        });
        return tasks.length;
      },
      async updateTaskResult(uniqueKey, result, fromStatus, toStatus) {
        const { taskMap, ...rest } = store.getState();
        let task: any = null;
        if (typeof uniqueKey === 'string') {
          task = taskMap[uniqueKey]!;
        } else {
          task = Object.values(taskMap).find(
            (v) =>
              v.chainId === uniqueKey.chainId && v.nodeId === uniqueKey.nodeId,
          )!;
        }
        if (task.status !== fromStatus) return null;
        store.setState({
          ...rest,
          taskMap: {
            ...taskMap,
            [task.id]: { ...task, result, status: toStatus },
          },
        });
        return task.id;
      },
      async findTaskResults(info) {
        const { taskMap } = store.getState();
        return Object.entries(info).reduce(
          (acc, [alias, resultPointer]) => ({
            ...acc,
            [alias]: taskMap[resultPointer].result,
          }),
          {},
        );
      },

      async findWorkflow(id) {
        const { subWorkflow, mainWorkflow } = store.getState();
        return id === 'mainWorkflow' ? mainWorkflow : subWorkflow;
      },

      async findChain(id) {
        const { chainMap } = store.getState();
        return chainMap[id];
      },
      async createChain(v) {
        const chainId = uuid();
        const { chainMap, ...rest } = store.getState();
        store.setState({
          ...rest,
          chainMap: {
            ...chainMap,
            [chainId]: { ...v, id: chainId, body: v.chainBody },
          },
        });
        return chainId;
      },
      async findChainResults(chainId, aliases) {
        const { chainMap } = store.getState();
        return aliases.reduce(
          (acc, alias) => ({
            ...acc,
            [alias]: ((chainMap[chainId] as any).alias2pointer || {})[alias],
          }),
          {},
        );
      },
      async updateChainResults(id, completedNumber, addedResults) {
        const { chainMap, ...rest } = store.getState();
        const chain = chainMap[id];
        store.setState({
          ...rest,
          chainMap: {
            ...chainMap,
            [id]: {
              ...chain,
              count: chain.count - completedNumber,
              alias2pointer: {
                ...(chain as any)?.alias2pointer,
                ...addedResults,
              },
            } as any,
          },
        });
      },
      async transaction(f) {
        return f(adapter);
      },
    };
    return {
      ...createClient(adapter, { normal: NormalTaskStrategy }),
      setEditable,
      setStage,
    };
  });

  return (
    <StageContext.Provider value={stage}>
      <EditableContext.Provider value={editable}>
        <WorkflowClientContext.Provider value={client}>
          {children}
        </WorkflowClientContext.Provider>
      </EditableContext.Provider>
    </StageContext.Provider>
  );
};
