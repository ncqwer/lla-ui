import type { Client } from '.';
import { createChainHelper } from './createChainHelper';
import type { TaskStrategy, WorkflowId, Task, DataAdapter } from './type';

export function createStartWorkflow(
  adapter: DataAdapter,
  getTaskStrategy: (type: string) => TaskStrategy,
  getClient: () => Client,
) {
  return async (workflowId: WorkflowId, body: any) => {
    const client = getClient();
    const { transaction, findWorkflow, createChain } = adapter;
    const workflow = await findWorkflow(workflowId);
    if (!workflow) throw new Error('');
    // const { nodes } = workflow;
    const compliedInfo = workflow.compliedInfo!;
    // eslint-disable-next-line dot-notation
    const startNode = compliedInfo['START']; // 开始节点的id固定为START
    const chainId = await createChain({
      workflowId,
      count: startNode.endLeavesCount,
      chainBody: body,
    });

    const helper = await createChainHelper(chainId, [], adapter, {
      id: chainId,
      workflowId,
      count: startNode.endLeavesCount,
      body,
    });

    const nodeStore = compliedInfo;
    const [addedTasks, notifies, skips, skippedLevesCount] =
      startNode.childIds.reduce(
        (acc, nId) => {
          const [_addedTasks, _notifies, _skips, _skippedLevesCount] = acc;
          const {
            alias: childAlias,
            type: childType,
            templateInfo: childTemplateInfo,
            maybeSkipAliases,
            endLeavesCount,
          } = nodeStore[nId]!;
          const { beforeStart, notifyStart } = getTaskStrategy(childType);
          let info: any = null;
          let status: 'RUNNING' | 'SKIP' = 'RUNNING';
          let errorMsg = null;

          try {
            let isSkip = false;
            info = beforeStart(
              { templateInfo: childTemplateInfo },
              helper,
              () => (isSkip = true),
            );

            if (isSkip) {
              info = null;
              status = 'SKIP';
              errorMsg = 'Mannually Cancel!';
            }
          } catch (e: any) {
            errorMsg = e.message;
            status = 'SKIP';
            info = null;
          } finally {
            // eslint-disable-next-line no-unsafe-finally
            return [
              _addedTasks.concat({
                workflowId,
                nodeId: nId,
                type: childType,
                chainId,
                alias: childAlias,
                errorMsg,
                info,
                status,
              } as any),
              status === 'RUNNING'
                ? _notifies.concat(
                    () =>
                      notifyStart(
                        { chainId, nodeId: nId, workflowId, info },
                        helper,
                        client,
                      ).catch(() => {}), // 抑制报错
                  )
                : _notifies,
              status === 'SKIP' ? _skips.concat(maybeSkipAliases) : _skips,
              status === 'SKIP'
                ? _skippedLevesCount + endLeavesCount
                : _skippedLevesCount,
            ] as const;
          }
        },
        [
          [] as Task[],
          [] as Array<() => Promise<void>>,
          [] as string[],
          0 as number,
        ] as const,
      );

    await transaction(async (a) => {
      const { updateChainResults, createTasks } = a;
      const addedChainResults = skips.reduce(
        (acc, alias) => ({
          ...acc,
          [alias]: null,
        }),
        {},
      );
      await updateChainResults(chainId, skippedLevesCount, addedChainResults);
      const rows = await createTasks(addedTasks);
      if (rows !== addedTasks.length) throw new Error('');
    });
    await Promise.all(notifies.map((f) => f()));
  };
}
