/* eslint spaced-comment: ["error", "always", { "markers": ["/"] }] */

import { Client } from '.';

/// Use Interface to support some atomic type determined by adapter.
/// To extend it, use following style
/// ```
/// interface AtomicHelper {
///   (): {
///     WorkflowId: YourType;
///     ChainId: YourType;
///     TaskId: YourType;
///     NodeId: YourType; // NodeId should be subtype of string | number;
///     ResultPointer: YourType;
///   };
/// }
/// ```
export interface AtomicHelper {
  (): {
    WorkflowId: unknown;
    ChainId: unknown;
    TaskId: unknown;
    NodeId: string | number;
    ResultPointer: unknown;
  };
}

export type WorkflowId = ReturnType<AtomicHelper>['WorkflowId'];
export type ChainId = ReturnType<AtomicHelper>['ChainId'];
export type ResultPointer = ReturnType<AtomicHelper>['ResultPointer'];
export type NodeId = ReturnType<AtomicHelper>['NodeId'];
export type TaskId = ReturnType<AtomicHelper>['TaskId'];

export type CompliedInfo = Record<
  NodeId,
  {
    ancestorIds: NodeId[];
    childIds: NodeId[];
    templateInfo: any;
    availableAliases: string[];
    maybeSkipAliases: string[];
    endLeavesCount: number;
    alias?: string;
    type: Task['type'];
  }
>;

export type Workflow = {
  id: WorkflowId;

  // 由前端workflow的编辑页面使用
  nodes: any[]; // 节点

  edges: any[];

  // aliases: Record<string, NodeId>; // 别名对照

  // 在workflow锁定后自动生成，用于任务链的流转阶段。
  compliedInfo: CompliedInfo | null;
};

export type Chain = {
  id: ChainId;
  workflowId: WorkflowId;
  body: any;
  count: number;
};

export type ChainHelper = {
  getTaskResult: (alias: string) => Promise<unknown>;
  chainBody: unknown;
};

export type TaskStrategy<
  Type extends string = any,
  Info = unknown,
  Detail = unknown,
  Result = unknown,
  TP_Info = unknown,
> = {
  type: Type;

  beforeStart: (
    v: {
      templateInfo: TP_Info;
    },
    helper: ChainHelper,
    needSkip: () => void,
  ) => Info;

  notifyStart: (
    v: {
      chainId: ChainId;
      nodeId: NodeId;
      workflowId: WorkflowId;
      info: Info;
    },
    helper: ChainHelper,
    client: Client,
  ) => Promise<void>;

  summary: (
    v: {
      info: Info;
      detail: Detail;
      requestBody: any;
    },
    helper: ChainHelper,
    client: Client,
  ) => Promise<Result>;

  notifyEnd: (
    v: { info: Info; detail: Detail; id: TaskId },
    helper: ChainHelper,
    client: Client,
  ) => Promise<void>;
};

export interface CustomTaskStrategy {}

export type ExtractTaskFromStrategy<T> = T extends TaskStrategy<
  infer Type,
  infer Info,
  infer Detail,
  infer Result,
  infer TP_INFO
>
  ? {
      id: TaskId;

      chainId: ChainId;
      workflowId: WorkflowId;
      nodeId: NodeId;

      info?: Info;
      detail?: Detail;
      result?: Result;

      type: Type;

      alias: string;

      status: 'RUNNING' | 'SKIP' | 'END';

      __phantomData?: TP_INFO; // 用作类型提示
    }
  : never;

export type Task = ExtractTaskFromStrategy<
  CustomTaskStrategy[keyof CustomTaskStrategy]
>;

// export type Task1 = CustomTaskStrategy[keyof CustomTaskStrategy];

export type DataAdapter = {
  findTask: (
    uniqueKey: TaskId | { chainId: ChainId; nodeId: NodeId },
  ) => Promise<Task | null>;
  createTasks: (tasks: Omit<Task, 'id'>[]) => Promise<number>;
  updateTaskResult: (
    uniqueKey: TaskId | { chainId: ChainId; nodeId: NodeId },
    result: any,
    fromStatus: Task['status'],
    toStatus: Task['status'],
  ) => Promise<ResultPointer | null>;
  findTaskResults: (
    info: Record<string, ResultPointer>,
  ) => Promise<Record<string, unknown>>;

  findWorkflow: (id: WorkflowId) => Promise<Workflow | null>;

  transaction: (f: (a: DataAdapter) => Promise<void>) => Promise<void>;

  findChain: (id: ChainId) => Promise<Chain | null>;
  createChain: (v: {
    workflowId: WorkflowId;
    count: number;
    chainBody: any;
  }) => Promise<ChainId | null>;
  findChainResults: (
    chainId: ChainId,
    aliases: string[],
  ) => Promise<Record<string, ResultPointer>>;
  updateChainResults: (
    id: ChainId,
    completedNumber: number,
    addedResults: Record<string, ResultPointer>,
  ) => Promise<void>; // 当前函数需要自己处理数据竞态问题,类似的逻辑是prev=>({...prev,...added})
};
