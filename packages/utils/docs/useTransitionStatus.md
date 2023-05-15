# useTranstionStatus & useTransitionComputedValue  & useTransitionGroup

## useTransitionStatus

### Usage
```ts
const status = useTransitionStatus(show,{timeout:300}); 
const isMount = status !== 'unmount';
```

### 类型
```ts
type TransitionStatus =
  | 'unmount'
  | 'enter'
  | 'entering'
  | 'entered'
  | 'exit'
  | 'exiting'
  | 'exited';

type UseTransitionStageOptions = Partial<
  Omit<OnEvents<TransitionStatus>, 'onUnmount'>
> & {
  appear?: boolean;
  unMountOnExit?: boolean;
  timeout?: number | { enter: number; exit: number };
  animation?: boolean | { enter: boolean; exit: boolean };
  mountBeforeEnter?: boolean;
};

declare function useTransitionStatus(
  show = false,
  {
    onEnter,
    onEntering,
    onEntered,
    onExit,
    onExiting,
    onExited,
    appear = false,
    unMountOnExit = true,
    timeout: _timeout = 0,
    animation: _animation = true,
  }: UseTransitionStageOptions = {},
):TransitionStatus;
```
参数详情如下：

- show: 是否进入enter
- unMountOnExit: 当`exited`后是否自动进入`unmount`
- timeout: `transition`时间
- animation: 是否开启动画，默认开启
- appear: 在首次render过程`show=true`的时候，是否开启动画
- onEvents: 同[useFSM](./useFSM.md#usefsm)定义一致

> 由于`useTransitionStatus`接管了`transition`变化中所有的
> 状态转移，故`onEvents`所对应的所有状态监听函数的返回值都将被舍
> 弃，不起任何作用。如果你需要自定义`transition`的状态变化行为，
> 你应该使用`useFSM`自定义特定的`useTransitionStatus`.


## useTransitionComputedValue

### Usage
在实际使用过程中过，在直接使用`status`之外，我们往往会根据`status`的不同而计算不同的值。`useTransitionComputedValue`通过简单包装`useTransitionStatus`来提供这一功能

```ts
export const useTransitionClassNames = (
  show = false,
  {
    classNames,
    classNamesDeps = [],
    ...others
  }: UseTransitionStageOptions & {
    classNames: string | ((status: TransitionStatus) => string);
    classNamesDeps?: React.DependencyList;
  } = {
    classNames: '',
  },
) => {
  const { value, isMount } = useTransitionComputedValue(show, {
    ...others,
    valueFn: (status) => {
      const cls = classNames;

      if (typeof cls === 'function') return cls(status);
      if (status === 'enter') return `${cls}-enter`;
      if (status === 'entering') return `${cls}-enter-active`;
      if (status === 'entered') return `${cls}-enter-done`;
      if (status === 'exit') return `${cls}-exit`;
      if (status === 'exiting') return `${cls}-exit-active`;
      if (status === 'exited') return `${cls}-exit-done`;
      return '';
    },
    valueFnDeps: classNamesDeps,
  });
  return { classNames: value, isMount };
};
```

> 由于`useTransitionClassNames`的使用场景太多。事实上，`@lla-ui/utils`默认导出了该函数。

### Type

```ts
declare function useTransitionComputedValue<Value>(
  show = false,
  {
    valueFn,
    valueFnDeps = [],
    ...others
  }: UseTransitionStageOptions & {
    valueFn: (status: TransitionStatus) => Value;
    valueFnDeps?: React.DependencyList;
  },
): { value: Value; isMount: boolean };
```

具体参数解释：

- valueFn: 基于status计算特定值的函数
- valueFnDeps: value的计算出了依赖status外，可能依赖的其他值。
- `...others`: 同`useTransitionStatus`一致。

## useTransitionGroup

当一个组件的`children`是一个组件List并且动态变更的时候。为了提供渐入渐出的动画效果，需要手动维护子组件是否显示的状态。`useTransitionGroup`简化了这一流程

### Usage

```tsx
// in Container
const children = useTransitionGroup(_children);

// old
<Container>
  <A key="A"></A>
  <B key="B"></B>
</Container>

// new
<Container>
  <A key="A"></A>
  <C key="C"></C>
</Container>


// in reality old
<Container>
  <A key="A" show></A>
  <B key="B" show={false}></B>
  <C key="C" show></C>
</Container>


// in reality new
<Container>
  <A key="A" show></A>
  <C key="C" show></C>
</Container>
```

### Type

```ts
declare const useTransitionGroup = (_children: React.ReactNode):React.ReactElemnt;
```

> `useTransitionGroup`内部使用了
> `TransitionGroupContext`与`useTransitionStatus`
> 进行交互，在嵌套使用的过程中，注意使用`<TransitionGroupContext.Provider value=-{null}><TransitionGroupContext.Provider>`消除其影响。



