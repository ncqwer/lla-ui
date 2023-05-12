import { createEndTask } from './endTask';
import { createStartWorkflow } from './startWorkflow';
import { IfTaskStrategy } from './builtin/ifTask';
import { WorkflowTaskStrategy } from './builtin/workflowTask';
import type { CustomTaskStrategy, DataAdapter } from './type';

export { IfTaskStrategy } from './builtin/ifTask';
export { WorkflowTaskStrategy } from './builtin/workflowTask';

export function createClient(
  adapter: DataAdapter,
  // adapter: Partial<DataAdapter>,
  taskStrategyStore: Omit<CustomTaskStrategy, 'if' | 'workflow'>,
) {
  const endTask = createEndTask(adapter, findTaskStrategy, () => client);
  const startWorkflow = createStartWorkflow(
    adapter,
    findTaskStrategy,
    () => client,
  );

  const client = {
    endTask,
    startWorkflow,
  };
  return client;

  function findTaskStrategy(key: string) {
    const store = {
      ...taskStrategyStore,
      workflow: WorkflowTaskStrategy,
      if: IfTaskStrategy,
    };
    return store[key];
  }
}

export type Client = ReturnType<typeof createClient>;

export * from './type';
