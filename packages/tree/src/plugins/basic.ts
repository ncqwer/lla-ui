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
      parent?: TreeNode,
      visible?: boolean,
      isInitial?: boolean,
    ): {
      decendantIds: TreeNodeId[];
      visibleDecendantIds: TreeNodeId[];
    };

    insertNode(
      nodes: TreeNode[],
      rootId: TreeNodeId,
      targetId: TreeNodeId,
      position: 'before' | 'after',
    ): void;

    moveNode(
      rootId: TreeNodeId,
      targetId: TreeNodeId,
      position: 'before' | 'after',
    ): void;

    removeNode(rootId: TreeNodeId): void;
  }

  interface TreeNode {
    count: number;
    idx: number;
    parentId?: TreeNodeId;
  }
}

const traverse: PluginTransform<'traverse'> = (store) => (nodeId, parent) => {
  const { nodeMap } = store;

  const decendantIds = [];

  let curr_nodeId = nodeId;
  let curr_parent = parent;
  let flag = true;

  const siblingMap = new Map();
  const returnMap = new Map();

  let realNodeData: TreeNode | null = null;

  while (curr_nodeId) {
    while (flag) {
      const _node = nodeMap[curr_nodeId];

      if (!_node) {
        throw new Error(); // exit with error node id
      }

      decendantIds.push(curr_nodeId);

      const nodeWithAncestors = {
        ..._node,
        ...store.fromParent(_node, curr_parent),
      };

      const childIds = nodeWithAncestors.childIds || [];

      const children: TreeNode[] = [];

      let prevNodeId: TreeNodeId | undefined = undefined;
      childIds.forEach((nodeId) => {
        if (prevNodeId !== undefined) {
          siblingMap.set(prevNodeId, {
            nodeId,
            parent: nodeWithAncestors,
          });
        }
        prevNodeId = nodeId;
        returnMap.set(nodeId, {
          nodeId: curr_nodeId,
          children,
          parent: nodeWithAncestors,
        });
      });

      const next = childIds[0];
      if (!next) {
        realNodeData = Object.assign(
          {},
          nodeWithAncestors,
          store.fromChildren(nodeWithAncestors, []),
        ) as TreeNode;
        nodeMap[curr_nodeId] = realNodeData;

        flag = false;
      } else {
        curr_nodeId = next;
        curr_parent = nodeWithAncestors;
      }
    }

    const parentTmp = returnMap.get(curr_nodeId);
    if (parentTmp) parentTmp.children.push(realNodeData);

    const hasSibling = siblingMap.has(curr_nodeId);
    if (hasSibling) {
      const tmp = siblingMap.get(curr_nodeId);

      curr_nodeId = tmp.curr_nodeId;
      curr_parent = tmp.parent;

      flag = true;
    } else {
      const parentTmp = returnMap.get(curr_nodeId);

      const tmp = store.fromChildren(parentTmp.parent, parentTmp.children);
      realNodeData = { ...parentTmp.parent, ...tmp };
      nodeMap[parentTmp.nodeId] = realNodeData!;

      curr_nodeId = parentTmp.nodeId;
      flag = false;
    }
  }

  siblingMap.clear();
  returnMap.clear();

  return {
    decendantIds,
  };
};

const insertNode: PluginTransform<'insertNode'> =
  (store) => (nodes, rootId, targetId, position) => {
    mergeNodesToStore(store, nodes);
    _insertNode(store, rootId, targetId, position);
    store.traverse();
  };

const mergeNodesToStore = (store: TreeStore, nodes: TreeNode[]) => {
  const { nodeMap } = store;
  nodes.forEach((node) => {
    nodeMap[node.id] = node;
  });
};

const _insertNode = (
  store: TreeStore,
  rootId: TreeNodeId,
  targetId: TreeNodeId,
  position: 'before' | 'after',
) => {
  const { nodeMap, rootIds } = store;
  const target = nodeMap[targetId];
  const parentId = target.parentId;
  if (parentId) {
    const parent = nodeMap[parentId];
    const idx = parent.childIds?.findIndex((v) => v === targetId)!;
    parent.childIds!.splice(position === 'before' ? idx : idx + 1, 0, rootId);
    nodeMap[parentId] = {
      ...parent,
      childIds: [...parent.childIds!],
    };
  } else {
    const idx = rootIds?.findIndex((v) => v === targetId)!;
    rootIds!.splice(position === 'before' ? idx : idx + 1, 0, rootId);
    store.rootIds = [...rootIds];
  }
};

const _removeNode = (store: TreeStore, rootId: TreeNodeId) => {
  const { nodeMap, rootIds } = store;
  const target = nodeMap[rootId];
  const parentId = target.parentId;
  if (parentId) {
    const parent = nodeMap[parentId];
    const idx = parent.childIds?.findIndex((v) => v === rootId)!;
    parent.childIds!.splice(idx, 1);
    nodeMap[parentId] = {
      ...parent,
      childIds: [...parent.childIds!],
    };
  } else {
    const idx = rootIds?.findIndex((v) => v === rootId)!;
    rootIds!.splice(idx, 1);
    store.rootIds = [...rootIds];
  }
};

const removeNodeFromStore = (store: TreeStore, rootId: TreeNodeId) => {
  const { nodeMap, decendantIds } = store;
  const root = nodeMap[rootId];
  decendantIds.slice(root.idx, root.count).forEach((id) => {
    delete nodeMap[id];
  });
};
