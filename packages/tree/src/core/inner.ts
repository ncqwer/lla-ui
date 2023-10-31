export type Store = {
  raw: any;

  nodes: any;

  arrangedIds: any;

  viewportIds: any;
};

export type Node = {
  id: any;

  metaData: any;
  childrenRelatedData: any;
  parentRelatedData: any;
};

type MetaData = any;
type ParentRelatedData = any;
type ChildrenRelatedData = any;

export type calcChildrenRelatedData = (
  childRelatedDatas: ChildrenRelatedData[],
  metaData: MetaData,
  parentRelatedData: ParentRelatedData,
) => ChildrenRelatedData;
export type calcParentRelatedData = (
  parentRelatedData: ParentRelatedData,
  parentMetaData: MetaData,
  metaData: MetaData,
) => ParentRelatedData;
