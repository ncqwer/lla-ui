export type TreeNode<ID extends string | number, NodeMeta, RootMeta> = {
  _raw: any; // 存放原始节点，使其保持首次获取的状态

  id: ID;

  isLeaf: boolean;

  parentID?: ID;

  nodeMeta: NodeMeta;

  children?: ID[];

  rootMeta?: RootMeta;
};

export type TreeStore<
  ID extends string | number = any,
  NodeMeta = any,
  RootMeta = any,
> = {
  nodes: Record<ID, TreeNode<ID, NodeMeta, RootMeta>>;
  children: ID[];
  _nodeType: TreeNode<ID, NodeMeta, RootMeta>; // for type PhantomData
};

export type NodeData = any;

export type ID = any;

export type ParentRelatedData = any;

export type ChildRelatedData = any;

export type ComputedDataType = 'from_parent' | 'self' | 'from_child';

export declare function addNode(node: TreeNode<ID>, parentId: ID): void;
export declare function removeNode(id: ID): void;
export declare function traverse(): void;
export declare function normalize(id: ID): void;
