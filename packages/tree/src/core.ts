import { Plugin, TreeNode, TreeNodeId, TreeStore } from './type';

export const createTreeStore = (...plugins: Plugin[]): TreeStore => {
  const plugin = composePlugin(...plugins);
  const store = makeBasicTreeStore();
  const api = plugin(store);
  Object.assign(store, api);
  return store;
};

function makeBasicTreeStore() {
  const nodeMap: Record<TreeNodeId, TreeNode> = {};
  return {
    nodeMap,
    rootIds: [],
  } as unknown as TreeStore;
}

function composePlugin(...plugins: Plugin[]): Plugin {
  type PluginRet = ReturnType<Plugin>;
  type Api = Required<Pick<PluginRet, 'queries' | 'transforms'>>;
  type LifetimeArrTmp = Required<
    Pick<PluginRet, 'fromChildren' | 'fromParent'>
  >;
  type LifetimeArr = {
    [k in keyof LifetimeArrTmp]: LifetimeArrTmp[k][];
  };
  return (store: TreeStore) => {
    const { fromParent, fromChildren, queries, transforms } = plugins
      .map((fn) => fn(store))
      .reduce(
        ({ fromParent, fromChildren, queries, transforms }, plugin) => {
          if (plugin.fromParent) fromParent.push(plugin.fromParent);
          if (plugin.fromChildren) fromChildren.push(plugin.fromChildren);
          if (plugin.queries) Object.assign(queries, plugin.queries);
          if (plugin.transforms) Object.assign(transforms, plugin.transfroms);
          return {
            fromParent,
            fromChildren,
            queries,
            transforms,
          };
        },
        {
          fromParent: [],
          fromChildren: [],
          queries: {},
          transforms: {},
        } as LifetimeArr & Api,
      );
    return {
      queries,
      transforms,
      fromChildren(...args) {
        const res = {};
        for (const fn of fromChildren) {
          Object.assign(res, fn(...args));
        }
        return res;
      },
      fromParent(...args) {
        const res = {};
        for (const fn of fromParent) {
          Object.assign(res, fn(...args));
        }
        return res;
      },
    } as PluginRet;
  };
}

const basic: Plugin = (store) => {
  function fromParent() {}
  function fromChildren() {}

  // queries

  // transfroms
  function traverse() {}
};

// 一次traverse必定伴随着fromeParent的调用，至于fromChildren的调用，在非初始化外是没有意义的。因为更新不来自底部。
