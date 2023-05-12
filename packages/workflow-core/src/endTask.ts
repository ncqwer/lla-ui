import { Client } from '.';
import { createChainHelper } from './createChainHelper';
import {
  TaskId,
  Task,
  DataAdapter,
  TaskStrategy,
  ChainId,
  NodeId,
} from './type';

export function createEndTask(
  adapter: DataAdapter,
  getTaskStrategy: (type: string) => TaskStrategy,
  getClient: () => Client,
) {
  return async (
    uniqueKey: TaskId | { chaindId: ChainId; NodeId: NodeId },
    body: any,
  ) => {
    const client = getClient();
    const { findTask, findWorkflow, transaction } = adapter;
    const task = await findTask(uniqueKey);
    if (!task || task.status !== 'RUNNING')
      throw new Error('No valid task needed to end');
    const {
      id: taskId,
      workflowId,
      type,
      info,
      detail,
      nodeId,
      alias,
      chainId,
    } = task;
    const workflow = await findWorkflow(workflowId);
    if (!workflow) throw new Error('');
    // const { nodes } = workflow;
    const compliedInfo = workflow.compliedInfo!;
    const { summary } = getTaskStrategy(type);
    const workflowTemplate = compliedInfo![nodeId];

    const helper = await createChainHelper(
      chainId,
      workflowTemplate.availableAliases,
      adapter,
    );
    const result = await summary(
      { detail, info, requestBody: body },
      helper,
      client,
    );

    if (alias) helper.__internal.add(alias, result);
    const nodeStore = compliedInfo;
    const [addedTasks, notifies, skips, skippedLevesCount] = compliedInfo[
      nodeId
    ].childIds.reduce(
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
              chainId,
              workflowId,
              nodeId: nId,
              type: childType,
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
      const { updateChainResults, updateTaskResult, createTasks } = a;
      const resultPointer = await updateTaskResult(
        taskId,
        result,
        'RUNNING',
        'END',
      );
      const addedChainResults = skips.reduce(
        (acc, alias) => ({
          ...acc,
          [alias]: null,
        }),
        {},
      );
      if (alias) addedChainResults[alias] = resultPointer;
      await updateChainResults(
        chainId,
        addedTasks.length === 0 ? 1 : skippedLevesCount,
        addedChainResults,
      );
      const rows = await createTasks(addedTasks);
      if (rows !== addedTasks.length) throw new Error('');
    });
    await Promise.all(notifies.map((f) => f()));
  };
}
