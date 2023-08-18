import { useCollapseStyles } from '@lla-ui/utils';
import React from 'react';

const Parent = ({ children }) => {
  React.useEffect(() => {
    console.log(
      '%c [ Parent ]-5',
      'font-size:13px; background:pink; color:#bf2c9f;',
    );
  });
  return children;
};

const Child = ({ hsjKey }) => {
  React.useEffect(() => {
    console.log(
      '%c [ Child ]-5',
      'font-size:13px; background:pink; color:#bf2c9f;',
      hsjKey,
    );
  });
  return null;
};

export default () => {
  const [open, setOpen] = React.useState(false);

  const { styles, ref, isMount } = useCollapseStyles(open, {
    timeout: 300,
    unMountOnExit: false,
  });
  return (
    <div>
      <Parent>
        <Child hsjKey={1}></Child>
        <Child hsjKey={2}></Child>
      </Parent>
      <button onClick={() => setOpen((prev) => !prev)}>toggle</button>
      <div style={styles}>
        {isMount && (
          <div ref={ref}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus
            neque velit tenetur ducimus quaerat necessitatibus dolores assumenda
            sint quod adipisci corporis consectetur, veritatis qui quasi,
            voluptatem, officia perspiciatis cum. Ex!
          </div>
        )}
      </div>
    </div>
  );
};
