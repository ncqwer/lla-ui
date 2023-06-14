import React from 'react';
import { cx, css } from '@emotion/css';
import { useSlideTrack, useSize } from '@lla-ui/utils';
// import { flushSync } from 'react-dom';

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
            slide,
            & > div {
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

const Track1 = ({ children }: React.PropsWithChildren) => {
  const {
    slide,
    trackProps,
    children: _children,
  } = useSlideTrack(children, {
    slideUnit: 200,
    slideGap: 10,
    direction: 'vertical',
  });
  const [, setState] = React.useState({});
  return (
    <>
      <div className={cx('overflow-hidden w-[220px] h-[220px]')}>
        <div
          className={cx(
            'relative',
            css`
              & > div {
                margin: 10px;
                background: green;
                width: 200px;
                height: 200px;
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
      <div>
        <button
          onClick={() => {
            slide({ type: 'pre' });
            setState(() => {
              console.log(Date.now());
            });
          }}
        >
          {' '}
          prev
        </button>
        <button
          onClick={() => {
            slide({ type: 'next' });
            setState(() => {
              const now = Date.now();
              console.log(
                '%c [ now ]-203',
                'font-size:13px; background:pink; color:#bf2c9f;',
                now,
              );
            });
          }}
        >
          {' '}
          next
        </button>
      </div>
    </>
  );
};

export default () => {
  return (
    <div className="w-screen h-screen">
      <div className="justify-center w-full mx-auto">
        <div className="w-[220px] h-[220px]">
          <Track>
            <div>
              <h3>1</h3>
            </div>
            <div>
              <h3>2</h3>
            </div>
            <div>
              <h3>3</h3>
            </div>
            <div>
              <h3>4</h3>
            </div>
            <div>
              <h3>5</h3>
            </div>
            <div>
              <h3>6</h3>
            </div>
          </Track>
        </div>
      </div>
    </div>
  );
};
