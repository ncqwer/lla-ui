# useFSM & useFSMWithSignal

> 用来自定义FSM(final-state-automation).


## useFSM

### Usage

示例如下：
```ts
import { useFSM, FSMSchedule } from '@lla-ui/utils';


// 模拟Alert的弹出，Alert在一秒后自动关闭
const [status,setAlertOpen] = useFSM<'open' | 'close', boolean>(
  (input, prev) => {
    if (input && prev === 'close') return 'open';
    if (!input && prev === 'open') return 'close';
  },
  'close',
  {
    onClose: () => {
      console.log('close');
    },
    onOpen: () => {
      console.log('open');
			return [set=>set('open'),FSMSchedule.timeout(1000)]; // 在1s后关闭
    },
  },
);
```

### Type

```ts

export type DelayType =
  | {
      type: 'timeout';
      timeout: number;
    }
  | {
      type: 'raf';
    }
  | {
      type: 'micro';
    };

type OnEvents<T extends string> = Record<
  `on${Capitalize<T>}`,
  (
    prev?: T,
  ) =>
    | [(set: React.Dispatch<React.SetStateAction<T>>) => void, DelayType]
    | ((set: React.Dispatch<React.SetStateAction<T>>) => void)
    | void
>;

declare function useFSM<T extends string, S = any>(
  input: (signal: S, now: T) => T | undefined,
  initialState: T | (() => T),
  onEvents: Partial<OnEvents<T>>,
): [T, (v: T) => void];
```

具体参数说明:

**输入参数**： 
- input: 当前状态机的状态转换函数, 当返回`undefined`时，不做状态变更。
- initialState: 状态机的初始状态
- onEvents: 状态变化的监听函数
  
onEvent函数可以通过返回值来指定延后的行为.需要注意的是，onEvent不会在status变化的同一render周期内被唤起。
> 同一时间内，有且仅有一个`DelayedFunction`等待或正在运行。在一个新的`DelayedFunction`被创建后，之前等待的全部会被取消运行。

其参数类型为：
```ts
declare const onStatus: (
  prev: Status,
) =>
  | [(set: React.Dispatch<React.SetStateAction<T>>) => void, DelayType]
  | ((set: React.Dispatch<React.SetStateAction<T>>) => void)
  | void;

```
其中：
- prev: 进入当前status的上一个status
- 返回值可选以下三种类型：
  - `undefined`: 没有延后执行的动作
  - `DelayedFunction`: 延后执行的函数，默认使用`requestAnimationFrame`
  - `[DelayedFunction, DelayType]` : 使用指定的`DelayType`来执行

当前仅支持以下`DelayType`:

- `FSMSchedule.timeout(delayMs)`: `setTimeout(fn,delayms)`
- `FSMSchedule.raf()`: `requestAnimationFrame(fn)`
- `FSMSchedule.micro()`: `Promise.resolve(fn)`

## useFSMWithStatus

这是对`useFSM`的简单封装，它通过观测输入`signal`的变化来自动触发状态的变化。

> 在signal没有变化的时候，状态变化不会发生。这在某些场景中会不使用。例如
> $S_{1}\overset{a}{\rightarrow}S_{2}\overset{a}{\rightarrow}S_{3}$ 

### Type

```ts
declare function useFSMWithSignal<T extends string, S = any>(
	signal: S,
  input: (signal: S, now: T) => T | undefined,
  initialState: T | (() => T),
  onEvents: Partial<OnEvents<T>>,
): T;
```
其参数的和`useFSM`一致。




