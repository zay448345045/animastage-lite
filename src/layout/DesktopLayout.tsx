import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DesktopLayoutProps {
  showLeftSidebar: boolean;
  onToggleLeftSidebar: () => void;
  sidebar: ReactNode | null;
  viewportColumn: ReactNode;
}

/**
 * Desktop / tablet studio body (≥769px or non-mobile breakpoint).
 * Unchanged split: collapsible left sidebar + viewport column.
 */
export default function DesktopLayout({
  showLeftSidebar,
  onToggleLeftSidebar,
  sidebar,
  viewportColumn,
}: DesktopLayoutProps) {
  return (
    <div className="flex-1 flex flex-row min-h-0 min-w-0 w-full relative">
      <button
        type="button"
        onClick={onToggleLeftSidebar}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#1a1d24] border border-[#2c3240] p-1.5 text-zinc-400 hover:text-[#39c5bb] hover:border-[#39c5bb]/40 z-30 transition-all shadow-md cursor-pointer"
        title={showLeftSidebar ? 'Collapse panel' : 'Expand panel'}
      >
        {showLeftSidebar ? (
          <ChevronLeft className="w-4 h-4 font-bold" />
        ) : (
          <ChevronRight className="w-4 h-4 font-bold" />
        )}
      </button>

      {showLeftSidebar ? sidebar : null}
      {viewportColumn}
    </div>
  );
}
