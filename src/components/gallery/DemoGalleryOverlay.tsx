import { X } from 'lucide-react';
import DemoGalleryPanel from './DemoGalleryPanel';

interface DemoGalleryOverlayProps {
  open: boolean;
  onClose: () => void;
  onLoadDemo: (demoId: string) => void;
  loadingDemoId?: string | null;
  activeDemoId?: string | null;
}

export default function DemoGalleryOverlay({
  open,
  onClose,
  onLoadDemo,
  loadingDemoId,
  activeDemoId,
}: DemoGalleryOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Demo gallery"
    >
      <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-xl border border-[#2a2f38] bg-[#16181d] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#22252c] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white">Pick a demo scene</h2>
            <p className="text-[11px] text-zinc-500">Animation starts in about 2 seconds</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#22252c] cursor-pointer"
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <DemoGalleryPanel
            onLoadDemo={onLoadDemo}
            loadingDemoId={loadingDemoId}
            activeDemoId={activeDemoId}
            compact
          />
        </div>
      </div>
    </div>
  );
}
