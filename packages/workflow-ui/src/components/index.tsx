import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import type { Edge, Node } from 'reactflow';
import {
  applyEdgeChanges,
  applyNodeChanges,
  getIncomers,
  getOutgoers,
  ReactFlow,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import { layoutCharts } from '../utils';
import type { WorkflowNodeType } from './NodeStore';
import { WorkflowEdge } from './edge';
import { WorkflowNode } from './node';

const initialNodes: Node[] = [
  {
    id: 'START',
    type: 'input',
    data: { label: 'START' },
    position: { x: 50, y: 0 },
  },
  {
    id: 'END',
    type: 'output',
    data: { label: 'END' },
    position: { x: 50, y: 100 },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'edge-START-END',
    source: 'START',
    target: 'END',
    type: 'WorkflowEdge',
  },
];

const customEdgeTypes = {
  WorkflowEdge,
};

const customNodeTypes = {
  WorkflowNode,
};

const FlowChartImpl: React.FC<{
  nodes: WorkflowNodeType[];
  edges: Edge[];
  onLock: (nodes: WorkflowNodeType[], edges: Edge[]) => void;
}> = ({
  nodes: _nodes = initialNodes as WorkflowNodeType[],
  edges: _edges = initialEdges,
  onLock,
}) => {
  const [nodes, setNodes] = React.useState(() => layoutCharts(_nodes, _edges));
  const [edges, setEdges] = React.useState(_edges);
  const instance = useReactFlow();
  return (
    <div className="w-[fill-available] h-[fill-available] relative min-h-[500px]">
      <div className="absolute top-0 right-0 -translate-y-full">
        <button
          onClick={() => {
            onLock(nodes, edges);
          }}
        >
          stash
        </button>
      </div>
      <div className="w-full h-[500px]">
        <ReactFlow
          edgeTypes={customEdgeTypes}
          nodeTypes={customNodeTypes}
          nodes={nodes}
          edges={edges}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodesChange={(changes) => {
            let needFitView = true;
            if (changes.length === 0) return;
            if (changes.some(({ type }) => type === 'remove')) {
              const { id } = changes[0]! as any;
              if (id === 'START' || id === 'END') {
                return; // 无法删除
              }
              const targetNode = nodes.find((v) => v.id === id)!;
              const incomers = getIncomers(targetNode, nodes, edges);
              if (incomers.length !== 1) return;
              const incomer = incomers[0]!;
              const outgoers = getOutgoers(targetNode, nodes, edges);
              const parentOutgoers = getOutgoers(incomer, nodes, edges);
              const cache = new Set();
              const newEdges = [
                ...edges.filter((v) => {
                  cache.add(v.id);
                  if (v.source === incomer.id && v.target === id) return false;
                  if (v.source === id) return false;
                  return true;
                }),
                ...outgoers
                  .map((v) => {
                    const edgeId = `edge-${incomer.id}-${v.id}`;
                    if (cache.has(edgeId)) return null as any;
                    if (
                      parentOutgoers.length > 1 &&
                      v.id === 'END' &&
                      edges.length !== 2
                    )
                      return null;
                    return {
                      id: edgeId,
                      source: incomer.id,
                      target: v.id,
                      type: 'WorkflowEdge',
                    };
                  })
                  .filter(Boolean),
              ];
              const newNodes = layoutCharts(
                nodes.filter((v) => v.id !== id),
                newEdges,
              );

              setNodes(newNodes);
              setEdges(newEdges);
              // instance.fitView({ duration: 1000 });
            } else {
              setNodes((prev) => {
                if (prev.length === changes.length) needFitView = false;
                return applyNodeChanges(changes, prev);
              });
            }
            if (changes.some(({ type }) => type === 'select')) return;
            if (needFitView) instance.fitView({ duration: 1000 });
          }}
          onEdgesChange={(changes) => {
            if (changes.some(({ type }) => type === 'remove')) return;
            setEdges((prev) => applyEdgeChanges(changes, prev));
            // instance.fitView({ duration: 1000 });
          }}
          elementsSelectable
          fitView
          maxZoom={10}
        >
          <Background></Background>
          <Controls></Controls>
          <MiniMap></MiniMap>
        </ReactFlow>
      </div>
    </div>
  );
};

// const GetTaskContext = React.createContext<null | ((nodeId: NodeId) => Task)>(
//   null,
// );

export const FlowChart: React.FC<{
  nodes: WorkflowNodeType[];
  edges: Edge[];
  onLock: (nodes: WorkflowNodeType[], edges: Edge[]) => void;
  // getTask: (nodeId: NodeId) => Task;
}> = function ({
  // getTask,
  ...props
}) {
  return (
    <ReactFlowProvider>
      <FlowChartImpl {...props}></FlowChartImpl>
      {/* <GetTaskContext.Provider value={getTask}>
      </GetTaskContext.Provider> */}
    </ReactFlowProvider>
  );
};

export * from './NodeStore';
export * from './mode';
