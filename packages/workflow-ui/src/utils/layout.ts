import * as d3 from 'd3-hierarchy';
import type { Node, Edge } from 'reactflow';

export function layoutCharts(
  nodes: Node[],
  edges: Edge[],
  {
    // nodeSize = [330, 230],

    nodeSize: _nodeSize = [200, 150],
    gap = 30,
    getBoundRect,
    endNodeSize = [150, 40],
  }: {
    gap?: number;
    nodeSize?: [number, number];
    endNodeSize?: [number, number];
    getBoundRect?: () => [number, number];
  } = {},
): Node[] {
  const nodeSize = _nodeSize.map((v) => v + gap);
  const root = d3
    .stratify<Edge>()
    .id((v) => v.target)
    .parentId((v) => v.source)(
    [{ id: 'START', target: 'START', source: '' }, ...edges]
      .map((e) => {
        if (e.target === 'END') return null as any;
        return {
          id: e.id,
          target: e.target,
          source: e.source,
        };
      })
      .filter(Boolean),
  );
  root.sort(({ id: lhs }, { id: rhs }) => {
    if (lhs === rhs) return 0;
    if (lhs === 'START') return -1;
    if (rhs === 'START') return 1;
    return lhs! < rhs! ? -1 : 1;
  });
  const layout = d3.cluster<Edge>();

  if (getBoundRect) {
    layout.size(getBoundRect());
  } else if (nodeSize) layout.nodeSize(nodeSize as any);

  layout(root);

  const cache = new Map();
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  root.each((node: any) => {
    const xCurrent = node.x;
    const yCurrent = node.y;
    if (xMin > xCurrent) xMin = xCurrent;
    if (xMax < xCurrent) xMax = xCurrent;
    if (yMin > yCurrent) yMin = yCurrent;
    if (yMax < yCurrent) yMax = yCurrent;
    cache.set(node.id, { x: xCurrent, y: yCurrent });
  });

  const perHeight =
    (root as any).y - ((root as any)?.children?.[0]?.y || nodeSize[1]);
  cache.set('END', {
    x: _nodeSize[0] / 2 - endNodeSize[0] / 2,
    y: yMax - perHeight + _nodeSize[1] / 2 - endNodeSize[1] / 2,
  });
  cache.set('START', {
    x: _nodeSize[0] / 2 - endNodeSize[0] / 2,
    y: _nodeSize[1] / 2 - endNodeSize[1] / 2,
  });

  return nodes
    .map((node) => {
      const pos = cache.get(node.id);
      if (!pos) return null as any;
      return {
        ...node,
        position: pos,
      };
    })
    .filter(Boolean);
}
