import type { ReactNode } from 'react';

export interface MobileLayoutProps {
  /** Compact header (TopMenu mobile / flow bar already above in App). */
  toolsDrawer: ReactNode;
  viewport: ReactNode;
  timeline: ReactNode;
  overlays?: ReactNode;
  bottomBar: ReactNode;
}

/**
 * Mobile-only studio shell (≤768px): single column, viewport-first,
 * no persistent sidebars — tools in drawer, timeline in bottom sheet.
 */
export default function MobileLayout({
  toolsDrawer,
  viewport,
  timeline,
  overlays,
  bottomBar,
}: MobileLayoutProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {toolsDrawer}
      <div className="studio-viewport-column flex-1 flex flex-col overflow-hidden relative min-h-0 w-full">
        {viewport}
        {timeline}
        {overlays}
      </div>
      {bottomBar}
    </div>
  );
}
