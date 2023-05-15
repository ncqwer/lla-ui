import { useCollapseStyles } from '@lla-ui/utils';
import React from 'react';

export default () => {
  const [open, setOpen] = React.useState(false);

  const { styles, ref, isMount } = useCollapseStyles(open, {
    timeout: 300,
    unMountOnExit: false,
  });
  return (
    <div>
      <button onClick={() => setOpen((prev) => !prev)}>toggle</button>
      <div style={styles}>
        {isMount && (
          <div ref={ref} contentEditable>
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
