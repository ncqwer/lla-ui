import React from 'react';
import { Modal } from '@lla-ui/floating';

export default () => {
  const [isOpen, setIsOpen] = React.useState(false);
  console.log(
    '%c [ __DEV__ ]-7',
    'font-size:13px; background:pink; color:#bf2c9f;',
    __DEV__,
  );
  return (
    <div className="bg-neutral-surface w-screen h-screen">
      <button className="px-4 py-2" onClick={() => setIsOpen(true)}>
        open
      </button>
      <Modal open={isOpen} onOpenChange={setIsOpen} forceRender>
        <div className="bg-primary-container p-4 opacity-[79] max-w-2xl">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quasi
          deserunt nihil earum mollitia minima. Recusandae, minima corporis qui
          accusamus, officiis commodi laboriosam voluptates aut assumenda illum
          neque. Nemo, consequatur magni.
        </div>
        <input type="file" />
      </Modal>
    </div>
  );
};
