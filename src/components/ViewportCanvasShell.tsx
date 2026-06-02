import React from 'react';
import type { ViewportFormat } from '../types';
import { VIEWPORT_916_HEIGHT, VIEWPORT_916_WIDTH } from '../utils/viewportFormat';
import { useStudioLayout } from '../hooks/useStudioLayout';

interface ViewportCanvasShellProps {
  format: ViewportFormat;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps the R3F canvas: full-bleed in 16:9, fixed portrait frame centered in 9:16.
 * On mobile column layout, height is capped via .studio-viewport-stage (CSS).
 */
export default function ViewportCanvasShell({
  format,
  children,
  className = '',
}: ViewportCanvasShellProps) {
  const { isMobileColumn, isProMobile } = useStudioLayout();
  const mobileFill = isProMobile;

  if (format === '9:16') {
    return (
      <div
        className={`flex-1 flex items-center justify-center min-h-0 overflow-hidden w-full ${
          mobileFill ? 'absolute inset-0 bg-[#0d0e11]' : 'bg-[#060608]'
        }`}
        data-viewport-format="9:16"
      >
        <div
          className={`relative overflow-hidden ${mobileFill ? 'h-full w-auto max-w-full shadow-none ring-0' : 'shrink-0 shadow-[0_0_60px_rgba(57,197,187,0.08)] ring-1 ring-zinc-800/80'} ${className}`}
          style={
            mobileFill || isMobileColumn
              ? { height: '100%', width: 'auto', aspectRatio: '9 / 16', maxHeight: '100%' }
              : { width: VIEWPORT_916_WIDTH, height: VIEWPORT_916_HEIGHT }
          }
        >
          {children}
        </div>
      </div>
    );
  }

  if (mobileFill) {
    return (
      <div
        className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
        data-viewport-format="16:9"
      >
        <div className="absolute inset-0 w-full h-full">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 relative min-h-0 overflow-hidden w-full ${isMobileColumn ? 'flex items-center justify-center' : ''} ${className}`}
      data-viewport-format="16:9"
    >
      <div className={isMobileColumn ? 'w-full max-h-full aspect-video' : 'absolute inset-0'}>
        {children}
      </div>
    </div>
  );
}
