import type { ReactNode } from 'react';

/** Control sheet: timeline-first, fills snap sheet on Android. */
export default function ProMobileControlPanel({ timeline }: { timeline: ReactNode }) {
  return (
    <div className="pro-control-sheet flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="pro-control-sheet__timeline flex-1 min-h-0 flex flex-col overflow-hidden">
        {timeline}
      </div>
    </div>
  );
}
