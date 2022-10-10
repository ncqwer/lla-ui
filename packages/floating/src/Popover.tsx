import React from 'react';

import {
  useFloating,
  useClick,
  useHover,
  flip,
  shift,
  useDismiss,
  useRole,
  offset,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  arrow as arrowMiddleware,
} from '@floating-ui/react-dom-interactions';
import type {
  Placement,
  UseFloatingReturn,
} from '@floating-ui/react-dom-interactions';

import { Func, useEventStable, useMergeRefs } from '@lla-ui/utils';
import { useDerivedValue } from '@lla-ui/utils';

const Context = React.createContext<
  | (Pick<
      UseFloatingReturn,
      | 'x'
      | 'y'
      | 'strategy'
      | 'floating'
      | 'reference'
      | 'context'
      | 'middlewareData'
      | 'placement'
    > & {
      // eslint-disable-next-line no-unused-vars
      arrow: (node: HTMLElement | null) => void;
      open: boolean;
      getReferenceProps: (
        // eslint-disable-next-line no-unused-vars
        userProps?: React.HTMLProps<Element> | undefined,
      ) => Record<string, unknown>;
      getFloatingProps: (
        // eslint-disable-next-line no-unused-vars
        userProps?: React.HTMLProps<HTMLElement> | undefined,
      ) => Record<string, unknown>;
    })
  | null
>(null);

type PopoverContextProps = {
  enableClick?: boolean;
  enableHover?: boolean;
  placement: Placement;
  open?: boolean;
  onOpenChange?: Func<[React.SetStateAction<boolean>]>;
  offset?: number;
  children: React.ReactNode;
};

const createPopoverContext =
  ({
    enableClick,
    enableHover,
  }: {
    enableClick: boolean;
    enableHover: boolean;
  }): React.FC<Omit<PopoverContextProps, 'enableClick' | 'enableHover'>> =>
  ({
    placement: _placement,
    offset: _offset = 8,
    open: _open,
    onOpenChange: _onOpenChange,
    children,
  }) => {
    const [open, onOpenChange] = useDerivedValue(_open || false, _onOpenChange);
    const arrowRef = React.useRef<any>(null);
    // const [open, onOpenChange] = React.useState(_open || false);

    const {
      x,
      y,
      reference,
      floating,
      strategy,
      context,
      update,
      placement,
      middlewareData,
    } = useFloating({
      open,
      onOpenChange,
      placement: _placement,
      middleware: [
        offset(_offset),
        flip(),
        shift(),
        arrowMiddleware({ element: arrowRef }),
      ],
    });
    const arrow = React.useCallback(
      (node: any) => {
        arrowRef.current = node;
        update();
      },
      [update],
    );

    const {
      getFloatingProps: _getFloatingProps,
      getReferenceProps: _getReferenceProps,
      // getFloatingProps,
      // getReferenceProps,
    } = useInteractions(
      [
        enableHover ? useHover(context) : null,
        enableClick ? useClick(context) : null,
        useRole(context),
        useDismiss(context),
        // eslint-disable-next-line prefer-arrow-callback
      ].filter(function <T>(v: T): v is NonNullable<T> {
        return !!v;
      }),
    );
    const getFloatingProps = useEventStable(_getFloatingProps);
    const getReferenceProps = useEventStable(_getReferenceProps);

    // React.useEffect(() => {
    //   if (refs.reference.current && refs.floating.current && open) {
    //     autoUpdate(refs.reference.current, refs.floating.current, update);
    //   }
    // }, [refs.reference, refs.floating, update]);

    return (
      <Context.Provider
        value={React.useMemo(
          () => ({
            x,
            y,
            open,
            reference,
            floating,
            strategy,
            getReferenceProps,
            getFloatingProps,
            context,
            arrow,
            middlewareData,
            placement,
          }),
          [
            open,
            x,
            y,
            reference,
            floating,
            strategy,
            getReferenceProps,
            getFloatingProps,
            context,
            arrow,
            middlewareData,
            placement,
          ],
        )}
      >
        {children}
      </Context.Provider>
    );
  };

const PopoverContext: React.FC<PopoverContextProps> = ({
  enableClick = false,
  enableHover = false,
  ...others
}) => {
  const Comp = React.useMemo(
    () => createPopoverContext({ enableClick, enableHover }),
    [enableClick, enableHover],
  );
  return <Comp {...others}></Comp>;
};

const PopoverHandler = React.forwardRef<
  HTMLElement,
  {
    children: React.ReactNode;
  }
>(({ children }, ref) => {
  const { getReferenceProps, reference } = React.useContext(Context)!;
  const mergedRef = useMergeRefs(ref, reference);
  return React.cloneElement(children as any, {
    ...getReferenceProps({
      ref: mergedRef,
    }),
  });
});

type PopoverContentProps = {
  children: React.ReactNode;
  showArrow?: boolean;
  wrapper?: any;
} & Omit<React.ComponentProps<'div'>, 'ref'>;

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, showArrow = false, wrapper = 'div', ...others }, ref) => {
    const {
      getFloatingProps,
      floating,
      open,
      strategy,
      x,
      y,
      context,
      arrow,
      middlewareData,
      placement,
    } = React.useContext(Context)!;
    const mergedRef = useMergeRefs(floating, ref);
    const content = React.createElement(
      wrapper,
      getFloatingProps({
        ...others,
        ref: mergedRef,
        style: {
          position: strategy,
          top: y ?? '',
          left: x ?? '',
        },
      }),
      children,
      showArrow && renderArrow(),
    );
    return (
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context}>
            {content}
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    );

    function renderArrow() {
      if (!middlewareData.arrow) return null;
      const { x: arrowX, y: arrowY } = middlewareData.arrow;

      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[placement.split('-')[0]];

      return (
        <div
          className="rvt-popover__arrow"
          ref={arrow}
          style={{
            left: arrowX != null ? `${arrowX}px` : '',
            top: arrowY != null ? `${arrowY}px` : '',
            right: '',
            bottom: '',
            [staticSide!]: '-4px',
          }}
        ></div>
      );
    }
  },
);

const Popover = ({
  children,
  content,
  trigger = 'click',
  contentProps,
  ...others
}: Omit<PopoverContextProps, 'enableClick' | 'enableHover'> & {
  children: React.ReactNode;
  content: React.ReactNode;
  contentProps?: Omit<PopoverContentProps, 'children'>;
  trigger?: 'click' | 'hover';
}) => {
  return (
    <PopoverContext
      enableClick={trigger === 'click'}
      enableHover={trigger === 'hover'}
      {...others}
    >
      <PopoverHandler>{children}</PopoverHandler>
      <PopoverContent {...contentProps}>{content}</PopoverContent>
    </PopoverContext>
  );
};

Popover.PopoverContext = PopoverContext;
Popover.PopoverContent = PopoverContent;
Popover.PopoverHandler = PopoverHandler;

export { Popover };
