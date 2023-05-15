# useDerivedValue

> 提供类似于`React.useState`相似作用的同时，在传入value发生变化的时候，返回当前传入的
> 最新value。通常在以下场景中使用，从而同时提供受控和非受控的能力
>
> ```ts
> const [state,useState] = useDevivedValue(value??initialValue,onChange); 
> ```

## 类型
```ts
declare const useDerivedValue = <T>(
  value: T,
  _onChange: React.Dispatch<React.SetStateAction<T>> = () => {},
)=>[T, React.Dispatch<React.SetStateAction<T>>];
```
