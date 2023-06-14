# useSlideTrack

> 在构建走马灯的 headless ui。

## Usage

示例如下：

```tsx
import { useSlideTrack, SlideEvents } from '@lla-ui/utils';
import { cx, css } from '@emotion/css';

const Track = ({ children }: React.PropsWithChildren) => {
  const [size, ref] = useSize(100);
  const marginPerSlide = 10;
  const widthPerSlide = size?.width ?? 200;
  const {
    trackProps,
    children: _children,

    count,
    slide,
    isLast,
    isFirst,
  } = useSlideTrack(children, {
    slideUnit: widthPerSlide,
    slideGap: marginPerSlide,
    infinity: true,
    direction: 'horization',
    speedPerUnit: 100,
  });

  // to next
  // slide(SlideEvents.next)

  // to previous
  // slide(SlideEvents.pre)

  // to target
  // Slide(SlideEvents.ix(targetIndex))

  return (
    <div
      ref={ref}
      className={cx('slide-container overflow-hidden w-full h-full')}
    >
      <div
        className={cx(
          'relative slide-track flex flex-shrink-0 flex-grow-0',

          css`
            slide {
              margin: ${marginPerSlide}px;
              background: green;
              width: ${widthPerSlide}px;
              height: ${size?.height ?? 200}px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
          `,
        )}
        {...trackProps}
      >
        {_children}
      </div>
    </div>
  );
};
```

具体参数说明:

**输入参数**：

- children: 子组件数组。
- slideUnit(px): 每个 slide 的宽（长）度,
- slideGap(px): slide 之间的间隔
- infinity: 是否构成圆环,
- direction: 方向,
- speedPerUnit(ms): 穿越单个 slide 所用的时间,

**输出参数**

- children: 实际 render 的 react 自组件
- count: 实际上 slide 的数量
- isFirst：当前是否是第一个
- isLast: 当前是否是最后一个
- trackProps: 传递给 slide-track 的属性
- slide: 操作函数，具体类型为

```ts
declare function slide(event: SlideEvent): void;
```
