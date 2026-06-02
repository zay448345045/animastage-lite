import type { ReactNode } from 'react';
import { cn } from './cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'left' | 'right';
  children: ReactNode;
  className?: string;
}

/** Slide-in panel for mobile / tablet. */
export default function Drawer({
  open,
  onClose,
  title,
  side = 'left',
  children,
  className,
}: DrawerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[55] bg-black/60 cursor-pointer"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 z-[56] flex flex-col w-[min(100vw,20rem)] max-w-full bg-[var(--color-panel)] shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
          side === 'left' ? 'left-0' : 'right-0',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Panel'}
      >
        {title ? (
          <div
            className="flex items-center justify-between shrink-0 border-b border-[var(--color-border)]"
            style={{ padding: 'var(--space-sm) var(--space-md)' }}
          >
            <span className="text-[var(--font-size-md)] font-semibold text-[var(--color-text-main)]">
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[var(--touch-min,44px)] min-w-[var(--touch-min,44px)] text-[var(--color-text-muted)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </aside>
    </>
  );
}
