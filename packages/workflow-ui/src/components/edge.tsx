import React from 'react';

import type { EdgeProps } from 'reactflow';
import { getBezierPath, useReactFlow } from 'reactflow';
import { v4 as uuid } from 'uuid';
import { Popover } from '@lla-ui/floating';
import { layoutCharts } from '../utils';
import { useNodeComponentStore } from './NodeStore';

export function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const foreignObjectSize = 40;
  const instances = useReactFlow();
  const [open, setOpen] = React.useState(false);
  const store = useNodeComponentStore();
  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={labelX - foreignObjectSize / 2}
        y={labelY - foreignObjectSize / 2}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div>
          <Popover
            open={open}
            onOpenChange={setOpen}
            trigger="click"
            placement="right"
            contentProps={{
              showArrow: true,
              className: 'bg-white p-4 rounded shadow-xl',
            }}
            content={
              <div className="">
                <div
                  className="cursor-pointer p-2 "
                  onClick={(event) => {
                    const workflowType = Object.keys(store)[0];
                    event.stopPropagation();
                    const { getEdges, getNodes, setNodes, setEdges } =
                      instances;
                    const newNodeId = `node:${uuid()}`; // 这里要判定一下方便去重复
                    const newNode = {
                      id: newNodeId,
                      data: {
                        type: workflowType,
                        templateInfo: store[workflowType].initialValue,
                      },
                      type: 'WorkflowNode',
                      position: { x: 50, y: 0 },
                    };
                    const newEdges = getEdges()
                      .filter((e) => e.id !== `edge-${source}-${target}`)
                      .concat(
                        {
                          id: `edge-${source}-${newNodeId}`,
                          source,
                          target: newNodeId,
                          type: 'WorkflowEdge',
                        },
                        {
                          id: `edge-${newNodeId}-${target}`,
                          source: newNodeId,
                          target,
                          type: 'WorkflowEdge',
                        },
                      );
                    const newNodes = layoutCharts(
                      [...getNodes(), newNode],
                      newEdges,
                    );
                    setNodes(newNodes);
                    setEdges(newEdges);
                    setOpen(false);
                  }}
                >
                  增加子步骤
                </div>
                {target !== 'END' && (
                  <div
                    className="cursor-pointer p-2 border-t-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      const workflowType = Object.keys(store)[0];
                      const { getEdges, getNodes, setNodes, setEdges } =
                        instances;
                      const newNodeId = `node:${uuid()}`;
                      const newNode = {
                        id: newNodeId,
                        data: {
                          type: workflowType,
                          templateInfo: store[workflowType].initialValue,
                        },
                        position: { x: 50, y: 0 },
                        type: 'WorkflowNode',
                      };
                      const newEdges = getEdges().concat(
                        {
                          id: `edge-${source}-${newNodeId}`,
                          source,
                          target: newNodeId,
                          type: 'WorkflowEdge',
                        },
                        {
                          id: `edge-${newNodeId}-END`,
                          source: newNodeId,
                          target: 'END',
                          type: 'WorkflowEdge',
                        },
                      );
                      const newNodes = layoutCharts(
                        [...getNodes(), newNode],
                        newEdges,
                      );
                      setNodes(newNodes);
                      setEdges(newEdges);
                      // fitView({ duration: 700 });
                      setOpen(false);
                    }}
                  >
                    增加兄弟步骤
                  </div>
                )}
              </div>
            }
          >
            <button className="edgebutton">+</button>
          </Popover>
        </div>
      </foreignObject>
    </>
  );
}
