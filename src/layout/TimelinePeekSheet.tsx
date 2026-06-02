import { useCallback, useRef, type ReactNode } from 'react';
import BottomSheet from '../components/UI/BottomSheet';

const SWIPE_UP_PX = 36;

export interface TimelinePeekSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  maxHeight?: string;
}

/** Timeline on mobile: hidden by default, peek bar + swipe up to open. */
export default function TimelinePeekSheet({
  open,
  onOpenChange,
  title = 'Timeline',
  children,
  maxHeight = 'min(50vh, 420px)',
}: TimelinePeekSheetProps) {
  const touchStartY = useRef(0);

  const onPeekTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? 0;
  }, []);

  const onPeekTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
      if (touchStartY.current - endY >= SWIPE_UP_PX) {
        onOpenChange(true);
      }
    },
    [onOpenChange]
  );

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="studio-timeline-peek shrink-0 z-30"
          aria-label="Open timeline — swipe up"
          onClick={() => onOpenChange(true)}
          onTouchStart={onPeekTouchStart}
          onTouchEnd={onPeekTouchEnd}
        >
          <span className="studio-timeline-drawer__handle" aria-hidden />
          <span className="studio-timeline-peek__label">{title}</span>
        </button>
      ) : null}
      <BottomSheet
        open={open}
        onClose={() => onOpenChange(false)}
        title={title}
        maxHeight={maxHeight}
      >
        {children}
      </BottomSheet>
    </>
  );
}
