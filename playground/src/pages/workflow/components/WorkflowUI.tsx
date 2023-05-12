/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import type { WorkflowId, ChainId } from '@lla-ui/workflow-core';
import { Database, DatabaseInfo } from './workflowStore';
import { Header } from '..';
import { FlowChart, compliedWorkflow } from '@lla-ui/workflow-ui';
import { to } from '@zhujianshi/lens';
import { Inspector } from 'react-inspector';

export const ChainIdContext = React.createContext<ChainId | undefined>(
  undefined,
);

export type WorkflowUIHanlder = {
  setChainId: (chainId: ChainId | undefined) => void;
};
export const WorkflowUI = React.forwardRef<
  WorkflowUIHanlder,
  { workflowId: WorkflowId }
>(({ workflowId }, ref) => {
  const [workflow, setWorkflow] = DatabaseInfo.useLens([workflowId]);
  const [chainId, setChainId] = React.useState<ChainId | undefined>();
  React.useImperativeHandle(
    ref,
    () => ({
      setChainId,
    }),
    [setChainId],
  );
  return (
    <div className="w-full h-full">
      <ChainIdContext.Provider value={chainId}>
        <FlowChart
          nodes={workflow.nodes}
          edges={workflow.edges}
          onLock={(nodes, edges) => {
            setWorkflow({
              id: workflowId,
              nodes,
              edges,
              compliedInfo: compliedWorkflow(nodes, edges),
            });
          }}
        ></FlowChart>
      </ChainIdContext.Provider>

      <div>
        <Header title="current chain"></Header>
        <ChainInfo
          workflowId={workflowId}
          chainId={chainId}
          onChainIdChange={setChainId}
        ></ChainInfo>
      </div>
      <div>
        <Header title="flow"></Header>
        <Inspector table={false} data={workflow}></Inspector>
      </div>
    </div>
  );
});

export const ChainInfo: React.FC<{
  workflowId: WorkflowId;
  chainId: ChainId | undefined;
  onChainIdChange: React.Dispatch<React.SetStateAction<ChainId | undefined>>;
}> = ({ workflowId, chainId, onChainIdChange }) => {
  // const availableChain = DatabaseInfo.useGetting(
  //   React.useMemo(
  //     () =>
  //       to((v: Database) =>
  //        ,
  //       ),
  //     [workflowId],
  //   ),
  // );
  const chainMap = DatabaseInfo.useGetting(['chainMap']);
  const availableChain = React.useMemo(
    () => Object.values(chainMap).filter((v) => v.workflowId === workflowId),
    [workflowId, chainMap],
  );
  console.log(
    '%c [ availableChain ]-58',
    'font-size:13px; background:pink; color:#bf2c9f;',
    availableChain,
  );

  return (
    <div>
      <div>
        <label>chainId</label>
        <select
          value={chainId}
          onChange={(e) => {
            console.log(
              '%c [ e ]-95',
              'font-size:13px; background:pink; color:#bf2c9f;',
              e,
            );
            onChainIdChange(e.target.value);
          }}
        >
          <option value={undefined}>请选择</option>
          {availableChain.map((v) => (
            <option value={v.id} key={v.id}>
              {v.id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
