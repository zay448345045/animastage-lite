import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../components/UI/cn';
import type { ProSnapLevel } from './types';
import { PRO_SNAP_VH } from './types';

export interface ProSnapBottomSheetProps {
  open: boolean;
  title: string;
  snapLevel: ProSnapLevel;
  onSnapChange: (level: ProSnapLevel) => void;
  onClose: () => void;
  children: ReactNode;
  /**
   * timeline — fills snap height (tracks + ruler use remaining space)
   * content — height fits children (no empty void below short panels)
   */
  sheetMode?: 'timeline' | 'content';
}

const SNAP_ORDER: ProSnapLevel[] = [1, 2, 3];

export default function ProSnapBottomSheet({
  open,
  title,
  snapLevel,
  onSnapChange,
  onClose,
  children,
  sheetMode = 'content',
}: ProSnapBottomSheetProps) {
  const dragStartY = useRef(0);
  const dragStartSnap = useRef<ProSnapLevel>(2);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const onHandleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      dragStartY.current = e.touches[0]?.clientY ?? 0;
      dragStartSnap.current = snapLevel > 0 ? snapLevel : 2;
    },
    [snapLevel]
  );

  const onHandleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? dragStartY.current;
      const dy = endY - dragStartY.current;
      const idx = SNAP_ORDER.indexOf(dragStartSnap.current);

      if (dy > 48) {
        if (idx <= 0) onClose();
        else onSnapChange(SNAP_ORDER[idx - 1]!);
      } else if (dy < -48) {
        if (idx >= SNAP_ORDER.length - 1) onSnapChange(3);
        else onSnapChange(SNAP_ORDER[idx + 1]!);
      }
    },
    [onClose, onSnapChange]
  );

  const maxVh = open && snapLevel > 0 ? PRO_SNAP_VH[snapLevel] : 0;
  const isTimeline = sheetMode === 'timeline';

  return (
    <>
      <div
        className={cn(
          'pro-sheet-backdrop fixed inset-0 z-[52] transition-opacity duration-250',
          open && snapLevel > 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!open || snapLevel === 0}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'pro-sheet fixed inset-x-0 bottom-0 z-[53] flex flex-col rounded-t-2xl',
          'transition-[transform,max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          open && snapLevel > 0 ? 'pro-sheet--open' : 'pro-sheet--closed',
          isTimeline ? 'pro-sheet--timeline' : 'pro-sheet--content'
        )}
        style={{
          ...(maxVh > 0
            ? isTimeline
              ? { height: `${maxVh}dvh`, maxHeight: `${maxVh}dvh` }
              : {
                  height: 'auto',
                  maxHeight: `min(${maxVh}dvh, calc(100dvh - 3.5rem - env(safe-area-inset-bottom)))`,
                }
            : { height: '0', maxHeight: '0' }),
          paddingBottom: 'env(safe-area-inset-bottom)',
          ['--pro-sheet-max' as string]: maxVh > 0 ? `${maxVh}dvh` : '0',
        }}
      >
        <div
          className="pro-sheet__handle shrink-0 touch-none"
          onTouchStart={onHandleTouchStart}
          onTouchEnd={onHandleTouchEnd}
        >
          <span className="pro-sheet__grab" />
          <div className="pro-sheet__header">
            <span className="pro-sheet__title">{title}</span>
            <div className="pro-sheet__snaps">
              {SNAP_ORDER.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={cn('pro-sheet__snap-dot', snapLevel === lvl && 'pro-sheet__snap-dot--on')}
                  onClick={() => onSnapChange(lvl)}
                  aria-label={`${PRO_SNAP_VH[lvl]}% height`}
                />
              ))}
            </div>
            <button type="button" className="pro-sheet__close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div
          className={cn(
            isTimeline
              ? 'pro-sheet__body pro-sheet__body--timeline flex-1 min-h-0 flex flex-col overflow-hidden'
              : 'pro-sheet__body pro-sheet__body--content shrink-0 overflow-y-auto overscroll-contain max-h-[var(--pro-sheet-max)]'
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
