import type { CompliedInfo, NodeId } from '@lla-ui/workflow-core';
import type { Edge } from 'reactflow';
import { getOutgoers } from 'reactflow';
import { WorkflowNodeType } from '../components';

export function compliedWorkflow(nodes: WorkflowNodeType[], edges: Edge[]) {
  const cache: CompliedInfo = {};

  function recursive(
    root: WorkflowNodeType,
    ancestorIds: NodeId[],
    availableAliases: string[],
  ): [number, string[]] {
    if (root.id === 'END') return [1, []];
    const children = getOutgoers(root, nodes, edges);
    let count = 0;
    let skipAliases: string[] = [];
    const newAncestorIds = ancestorIds.concat(root.id);
    const newAvailableAliases = root.data.alias
      ? availableAliases.concat(root.data.alias)
      : availableAliases;

    children.forEach((childNode) => {
      const [_count, _skip] = recursive(
        childNode,
        newAncestorIds,
        newAvailableAliases,
      );
      count += _count;
      skipAliases = skipAliases.concat(_skip);
    });
    cache[root.id] = {
      childIds: children
        .map((v) => (v.id === 'END' ? null : v.id))
        .filter(Boolean) as any,
      availableAliases,
      ancestorIds,
      maybeSkipAliases: skipAliases,
      endLeavesCount: count,
      templateInfo: Object.assign(
        { ...root.data.templateInfo },
        root.data.templateInfo?.code &&
          transformCode(root.data.templateInfo.code),
      ),
      type: root.data.type,
      alias: root.data.alias,
    };
    return [count, skipAliases];
  }
  const startNode = nodes.find((v) => v.id === 'START')!;
  recursive(startNode, [], []);
  return cache;
}

const REG = /@(([^\x00-\xff]|[a-zA-Z0-9_$])+\s*)/g;

const transformCode = (code: string): { code: string; aliases: string[] } => {
  // const transformCode = (code) => {
  const codeTrimmed = code.trim().replace(/;$/, '');
  const aliases: string[] = [];
  // const aliases = [];
  const newCode = codeTrimmed.replaceAll(REG, (_, name) => {
    // const name = pattern[1];
    aliases.push(name);
    return `CHAININFO['${name}']`;
  });

  // NOTE: Workaround for classes and arrow functions.
  const transformed = `return (${newCode})`.trim();
  return { code: transformed, aliases };
};

transformCode('@test1');
