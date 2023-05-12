import { NodeId } from '@lla-ui/workflow-core';
import React from 'react';
import { Database, DatabaseInfo } from '../workflowStore';
import { ChainIdContext } from '../WorkflowUI';
// eslint-disable-next-line import/no-extraneous-dependencies
import { to } from '@zhujianshi/lens';

export * from './ifNode';
export * from './workflowNode';

export const useTask = (id: NodeId) => {
  const chainId = React.useContext(ChainIdContext);
  console.log(
    '%c [ chainId ]-13',
    'font-size:13px; background:pink; color:#bf2c9f;',
    chainId,
  );
  return DatabaseInfo.useGetting(
    React.useMemo(
      () =>
        to((v: Database) => {
          return Object.values(v.taskMap).find(
            (v) => v.chainId === chainId && v.nodeId === id,
          )!;
        }),
      [chainId, id],
    ),
  );
};
