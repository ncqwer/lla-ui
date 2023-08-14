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
