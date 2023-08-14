import type { TreeStore } from './type';

export const createTreeStoreQuery = <T extends TreeStore>(_store: T) => {
  // for type alias
  type Node = T['_nodeType'];
  type NodeStore = T['nodes'];
  type ID = Node['id'];
  type Path = number[];

  function getNode(id: ID, nodeStore: NodeStore): Node {
    return nodeStore[id];
  }

  function getNodes(ids: ID[], nodeStore: NodeStore) {
    return ids.map((id) => getNode(id, nodeStore));
  }

  function getChildren(node: Node, nodeStore: NodeStore) {
    if (node.isLeaf || !Array.isArray(node.children)) return [];
    return getNodes(node.children, nodeStore);
  }

  function getAncestorIDs(node: Node, nodeStore: NodeStore) {
    const ancestorIDs = [];
    let parentID = node.parentID;
    while (parentID) {
      const parentNode = nodeStore[parentID];
      if (parentNode) {
        ancestorIDs.push(parentID);
        parentID = parentNode.parentID;
      }
    }
    return ancestorIDs.reverse();
  }

  function getPath(node: Node, rootChildren: ID[], nodeStore: NodeStore) {
    const ancestorIDs = getAncestorIDs(node, nodeStore);
    let targetChildrenIDs: ID[] | undefined = rootChildren;
    return ancestorIDs.map((id) => {
      if (!Array.isArray(targetChildrenIDs)) throw new Error(); // todo: better error
      const idx = targetChildrenIDs.findIndex((v) => v === id);
      if (!~idx) throw new Error(); // todo: better error
      targetChildrenIDs = getNode(id, nodeStore).children;
      return idx;
    });
  }

  function comparePath(
    lhs: Node,
    rhs: Node,
    rootChildren: ID[],
    nodeStore: NodeStore,
  ) {
    const lPath = getPath(lhs, rootChildren, nodeStore);
    const rPath = getPath(rhs, rootChildren, nodeStore);
    for (let idx = 0; idx < lPath.length && idx < rPath.length; ++idx) {
      if (lPath[idx] < rPath[idx]) return -1;
      if (lPath[idx] > rPath[idx]) return 1;
    }
    return lPath.length < rPath.length
      ? -1
      : lPath.length > rPath.length
      ? 1
      : 0;
  }

  function commonAncestors(
    lhs: Node,
    rhs: Node,
    rootChildren: ID[],
    nodeStore: NodeStore,
  ) {}
};
