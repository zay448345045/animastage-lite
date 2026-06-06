import type { ReactNode } from 'react';
import { cn } from './cn';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Max height CSS value */
  maxHeight?: string;
}

/** Swipe-friendly bottom panel (timeline, FX). */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  maxHeight = 'min(58dvh, 480px)',
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[54] bg-black/50 cursor-pointer"
        aria-label="Close sheet"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[55] flex flex-col rounded-t-[var(--radius-lg)] border-t border-[var(--color-border)] bg-[var(--color-panel)] shadow-[0_-8px_32px_rgba(0,0,0,0.45)] pb-[env(safe-area-inset-bottom)]',
          className
        )}
        style={{ maxHeight }}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Sheet'}
      >
        <div className="studio-timeline-drawer__handle shrink-0" aria-hidden />
        {title ? (
          <div
            className="flex items-center justify-between shrink-0 px-[var(--space-md)] pb-[var(--space-sm)]"
          >
            <span className="text-[var(--font-size-md)] font-semibold text-[var(--color-text-main)]">
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[var(--touch-min,44px)] px-3 text-[var(--color-text-muted)] font-semibold text-sm"
            >
              Close
            </button>
          </div>
        ) : null}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>
      </div>
    </>
  );
}
