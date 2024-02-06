import {
  TreeNodeId,
  Plugin,
  TreeStore,
  PluginTransform,
  TreeNode,
} from '../type';

declare module '../type' {
  interface TreeTransform {
    traverse(
      nodeId: TreeNodeId,
      ancestors?: TreeNodeId[],
      visible?: boolean,
      isInitial?: boolean,
    ): {
      decendantIds: TreeNodeId[];
      visibleDecendantIds: TreeNodeId[];
    };
  }
}

const traverse: PluginTransform<'traverse'> =
  (store) =>
  (nodeId, ancestorIds = [], visible = true, isInitial = false) => {
    const { nodeMap } = store;

    const decendantIds = [];
    const visibleDecendantIds = [];

    let curr_ancestorIds = ancestorIds;
    let curr_nodeId = nodeId;
    let curr_visible = visible;
    let curr_parent: TreeNode | null = null;
    let flag = true;

    const siblingMap = new Map();
    const returnMap = new Map();

    while (curr_nodeId) {
      while (flag) {
        const _node = nodeMap[curr_nodeId];

        if (!_node) {
          throw new Error(); // exit with error node id
        }

        const node = store.fromParent(_node, curr_parent, {});

        decendantIds.push(curr_nodeId);
        if (curr_visible) visibleDecendantIds.push(curr_nodeId);

        const childIds = node.childIds || [];
        curr_ancestorIds = curr_ancestorIds.concat(curr_nodeId);
        curr_visible = curr_visible === false ? false : !node.collapsed;

        const children: TreeNode[] = [];

        let prevNodeId: TreeNodeId | undefined = undefined;
        childIds.forEach((nodeId) => {
          if (prevNodeId !== undefined) {
            siblingMap.set(prevNodeId, {
              nodeId,
              ancestorIds: curr_ancestorIds,
              visible: curr_visible,
            });
          }
          prevNodeId = nodeId;
          returnMap.set(nodeId, {
            nodeId: curr_nodeId,
            sibings: children,
            parent: node,
          });
        });

        const next = childIds[0];
        if (!next) {
          flag = false;
        } else {
          curr_nodeId = next;
          curr_parent = node;
        }
      }

      const hasSibling = siblingMap.has(curr_nodeId);
      if (hasSibling) {
        const tmp = siblingMap.get(curr_nodeId);

        curr_ancestorIds = tmp.curr_ancestorIds;
        curr_nodeId = tmp.curr_nodeId;
        curr_visible = tmp.curr_visible;

        flag = true;
      } else {
        curr_nodeId = returnMap.get(curr_nodeId);

        flag = false;
      }
    }

    siblingMap.clear();
    returnMap.clear();

    return {
      decendantIds,
      visibleDecendantIds,
    };
  };
