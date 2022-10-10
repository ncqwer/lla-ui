import React from 'react';
import { FloatingPortal } from '@floating-ui/react-dom-interactions';

import { CSSTransition } from 'react-transition-group';
import { useDerivedValue } from '@lla-ui/utils';
import classnames from 'classnames';

const CLS = {
  appear: 'rvt-modal-appear',
  appearActive: 'rvt-modal-appear-active',
  appearDone: 'rvt-modal-appear-done',
  enter: 'rvt-modal-enter',
  enterActive: 'rvt-modal-enter-active',
  enterDone: 'rvt-modal-enter-done',
  exit: 'rvt-modal-exit',
  exitActive: 'rvt-modal-exit-active',
  exitDone: 'rvt-modal-exit-done',
};

export const Modal: React.FC<{
  open?: boolean;
  onOpenChange?: React.Dispatch<React.SetStateAction<boolean>>;
  noMaskClose?: boolean;
  children: React.ReactNode;
  forceRender?: boolean;
  noMask?: boolean;
  className?: string;
}> = ({
  open: _open = false,
  onOpenChange: _onOpenChange = () => {},
  children,
  noMask = false,
  noMaskClose = false,
  forceRender = false,
  className,
}) => {
  const [open, onOpenChange] = useDerivedValue(_open, _onOpenChange);
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <FloatingPortal>
      <CSSTransition
        in={open}
        mountOnEnter
        unmountOnExit={!forceRender}
        classNames={CLS}
        timeout={300}
        nodeRef={ref}
      >
        <div ref={ref} className="rvt-modal">
          {!noMask && (
            <div
              className={classnames('rvt-modal__mask', className)}
              onClick={(e) => {
                e.stopPropagation();
                if (noMaskClose) return;
                if (e.target === e.currentTarget) onOpenChange(false);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            ></div>
          )}
          <div className="rvt-modal__content">{children}</div>
        </div>
      </CSSTransition>
    </FloatingPortal>
  );
};
