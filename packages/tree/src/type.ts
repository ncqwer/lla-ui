export interface TreeQuery {}

export interface TreeTransform {
  fromParent: (node: TreeNode, parent?: TreeNode) => TreeNode;

  fromChildren: (node: TreeNode, children: TreeNode[]) => Partial<TreeNode>;
}

export type TreeNodeId = string | number;

export type TreeApi = TreeQuery & TreeTransform;

export type TreeStore = {
  nodeMap: Record<TreeNodeId, TreeNode>;
  rootIds: TreeNodeId[];

  decendantIds: TreeNodeId[];
  visibleDecendantIds: TreeNodeId[];
} & TreeApi;

export interface TreeNode {
  id: TreeNodeId;
  collapsed?: boolean;
  childIds?: TreeNodeId[];
}

export type TreeOperation = any;

export type TreeAction = {
  operation: TreeOperation;
  firedNode?: TreeNode;
};

export type Plugin = (store: TreeStore) => {
  fromParent?: (node: TreeNode, parent: TreeNode | null) => Partial<TreeNode>;
  fromChildren?: (node: TreeNode, children: TreeNode[]) => Partial<TreeNode>;
  queries?: Partial<TreeQuery>;
  transforms?: Partial<TreeTransform>;
};

export type PluginTransform<T extends keyof TreeTransform> = (
  store: TreeStore,
) => TreeTransform[T];

export declare function createTreeStore(...plugins: Plugin[]): TreeStore;
