import React from 'react';
import type { ViewportFormat } from '../types';
import { VIEWPORT_916_HEIGHT, VIEWPORT_916_WIDTH } from '../utils/viewportFormat';

interface ViewportCanvasShellProps {
  format: ViewportFormat;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps the R3F canvas: full-bleed in 16:9, fixed portrait frame centered in 9:16.
 */
export default function ViewportCanvasShell({
  format,
  children,
  className = '',
}: ViewportCanvasShellProps) {
  if (format === '9:16') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#060608] min-h-0 overflow-hidden">
        <div
          className={`relative shrink-0 shadow-[0_0_60px_rgba(57,197,187,0.08)] ring-1 ring-zinc-800/80 overflow-hidden ${className}`}
          style={{
            width: VIEWPORT_916_WIDTH,
            height: VIEWPORT_916_HEIGHT,
          }}
          data-viewport-format="9:16"
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 relative min-h-0 overflow-hidden ${className}`} data-viewport-format="16:9">
      {children}
    </div>
  );
}
