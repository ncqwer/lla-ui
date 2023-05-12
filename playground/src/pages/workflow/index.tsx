import { NodeTypeProvider } from '@lla-ui/workflow-ui';
import React from 'react';
import { Inspector } from 'react-inspector';
import { IfNode, WorkflowNode } from './components/builtInNodes';
import { NormalNodeUI } from './components/NormalNode';
import {
  DatabaseInfo,
  useWorkflowClient,
  WorkflowClientProvider,
} from './components/workflowStore';
import { WorkflowUI, WorkflowUIHanlder } from './components/WorkflowUI';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  return <div>{title}</div>;
};

const Impl = () => {
  const mainWorkflowRef = React.useRef<WorkflowUIHanlder>(null);
  const subWorkflowRef = React.useRef<WorkflowUIHanlder>(null);
  return (
    <div className="w-screen">
      <div className="flex">
        <div className="flex-1">
          <Header title="Main Workflow"></Header>
          <WorkflowUI
            workflowId="mainWorkflow"
            ref={mainWorkflowRef}
          ></WorkflowUI>
        </div>
        <div className="flex-1">
          <Header title="Sub Workflow"></Header>
          <WorkflowUI
            workflowId="subWorkflow"
            ref={subWorkflowRef}
          ></WorkflowUI>
        </div>
      </div>
      <div>
        <Header title="Database"></Header>
        <DatabaseUI></DatabaseUI>
      </div>
    </div>
  );
};

const DatabaseUI = () => {
  const store = DatabaseInfo.useGetting(DatabaseInfo.storeLens);
  const client = useWorkflowClient();
  return (
    <div>
      <button
        className="px-4 py-2 rounded bg-green-400"
        onClick={async () => {
          client.setStage('running');

          client.startWorkflow('mainWorkflow', { hello: 'world' });
        }}
      >
        开启
      </button>
      <Inspector table={false} data={store}></Inspector>
    </div>
  );
};

const WorkflowNodeStore = {
  if: IfNode,
  workflow: WorkflowNode,
  normal: NormalNodeUI,
};

export default () => {
  return (
    <WorkflowClientProvider>
      <NodeTypeProvider nodeComponents={WorkflowNodeStore}>
        <Impl></Impl>
      </NodeTypeProvider>
    </WorkflowClientProvider>
  );
};
