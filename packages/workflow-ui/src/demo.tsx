// import React from 'react';
// import {
//   Background,
//   Controls,
//   useEdgesState,
//   useNodesState,
//   ReactFlow,
//   useReactFlow,
//   getIncomers,
//   getOutgoers,
//   ReactFlowProvider,
// } from 'reactflow';

// import type { Node, Edge } from 'reactflow';

// import { WorkflowEdge } from './components';
// import { layoutCharts } from './utils';

// const initialNodes: Node[] = [
//   {
//     id: 'start',
//     type: 'input',
//     data: [{ label: 'START' }],
//     position: { x: 50, y: 0 },
//   },
//   {
//     id: 'node:1',
//     data: [{ label: 'node:1' }],
//     position: { x: 50, y: 0 },
//   },
//   {
//     id: 'node:2',
//     data: [{ label: 'node:2' }],
//     position: { x: 50, y: 0 },
//   },
//   {
//     id: 'end',
//     type: 'output',
//     data: [{ label: 'END' }],
//     position: { x: 50, y: 100 },
//   },
// ];

// const initialEdges: Edge[] = [
//   {
//     id: 'edge-start-node:1',
//     source: 'start',
//     target: 'node:1',
//     type: 'EdgeWithAddButton',
//   },
//   {
//     id: 'edge-start-node:2',
//     source: 'start',
//     target: 'node:2',
//     type: 'EdgeWithAddButton',
//   },
//   {
//     id: 'edge-node:1-end',
//     source: 'node:1',
//     target: 'end',
//     type: 'EdgeWithAddButton',
//   },
//   {
//     id: 'edge-node:2-end',
//     source: 'node:2',
//     target: 'end',
//     type: 'EdgeWithAddButton',
//   },
// ];

// const customEdgeTypes = {
//   WorkflowEdge,
// };

// export const Demo = () => {
//   return (
//     <ReactFlowProvider>
//       <Impl></Impl>
//     </ReactFlowProvider>
//   );
// };

// const Impl = () => {
//   const instance = useReactFlow();
//   const [nodes, setNodes, _onNodesChange] = useNodesState(
//     React.useMemo(() => layoutCharts(initialNodes, initialEdges), []),
//   );
//   const [edges, setEdges, _onEdgeChange] = useEdgesState(initialEdges);
//   return (
//     <div className="w-[50vw] h-[50vh]">
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         nodesDraggable={false}
//         nodesConnectable={false}
//         onNodesChange={(changes) => {
//           if (changes.length === 0) return;
//           if (changes.some(({ type }) => type === 'remove')) {
//             const { id } = changes[0]! as any;
//             if (id === 'start' || id === 'end') {
//               return; // 无法删除
//             }
//             const targetNode = nodes.find((v) => v.id === id)!;
//             const incomers = getIncomers(targetNode, nodes, edges);
//             if (incomers.length !== 1) return;
//             const incomer = incomers[0]!;
//             const outgoers = getOutgoers(targetNode, nodes, edges);
//             const cache = new Set();
//             const newEdges = [
//               ...edges.filter((v) => {
//                 cache.add(v.id);
//                 if (v.source === incomer.id && v.target === id) return false;
//                 if (v.source === id) return false;
//                 return true;
//               }),
//               ...outgoers
//                 .map((v) => {
//                   const edgeId = `edge-${incomer.id}-${v.id}`;
//                   if (cache.has(edgeId)) return null as any;
//                   if (
//                     incomer.id === 'start' &&
//                     v.id === 'end' &&
//                     edges.length !== 2
//                   )
//                     return null;
//                   return {
//                     id: edgeId,
//                     source: incomer.id,
//                     target: v.id,
//                     type: 'EdgeWithAddButton',
//                   };
//                 })
//                 .filter(Boolean),
//             ];
//             const newNodes = layoutCharts(
//               nodes.filter((v) => v.id !== id),
//               newEdges,
//             );

//             setNodes(newNodes);
//             setEdges(newEdges);
//             instance.fitView({ duration: 1000 });
//             return;
//           }
//           onNodesChange(changes);
//         }}
//         onEdgesChange={(changes) => {
//           if (changes.some(({ type }) => type === 'remove')) return;
//           onEdgeChange(changes);
//         }}
//         elementsSelectable
//         fitView
//         edgeTypes={customEdgeTypes}
//       >
//         <Background></Background>
//         <Controls></Controls>
//       </ReactFlow>
//     </div>
//   );
// };

export const _placeholder = 'hhh';
