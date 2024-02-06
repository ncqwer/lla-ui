大数据量的情况下树型数据的渲染，操作与维护。

树自身的结构：

```ts
interface Node {
  childIds: ID[];
  meta: any;
}

type;
```

按照操作来完成操作的拓展

基础的操作

mount/initial (初次加载状态)

traverse

mutate/update (更新状态)

move
remove
expand

有一个快速的预检功能，用来判断当前流程是否可以跳过。

同时允许拓展实际的操作

最为基础的功能

startDown nodeId void

startUp nodeId void

提供最为基础的缓存功能

祖先节点

子孙节点

在这种破坏缓存的情况下，

基于缓存，快速计算

针对不同的属性，在不同的操作路径下存在不同的操作路径（可简化

考虑先序属性 后序属性 构建缓存

先序属性 parent node operationType -> result
后序属性 node children operationType -> result
