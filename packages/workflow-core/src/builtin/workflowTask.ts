import type { TaskStrategy, WorkflowId } from '../type';

export const WorkflowTaskStrategy: TaskStrategy<
  'workflow',
  {
    workflowId: WorkflowId;
    code: string;
    aliases?: string[];
  },
  null,
  boolean,
  {
    workflowId: WorkflowId;
    code: string;
    aliases?: string[]; // 注意这里的aliases指的是内部workflow的aliases
  }
> = {
  type: 'workflow',
  beforeStart({ templateInfo }) {
    return templateInfo;
  },
  async notifyStart({ chainId, nodeId, info }, _helper, { startWorkflow }) {
    const { workflowId, aliases = [], code } = info;
    return startWorkflow(workflowId, { chainId, nodeId, code, aliases });
  },

  async summary({ requestBody }) {
    return requestBody;
  },

  async notifyEnd() {
    return;
  },
};

declare module '../type' {
  interface CustomTaskStrategy {
    workflow: typeof WorkflowTaskStrategy;
  }
}
