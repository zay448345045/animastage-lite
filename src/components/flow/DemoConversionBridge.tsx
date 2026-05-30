import { Upload, X } from 'lucide-react';

interface DemoConversionBridgeProps {
  visible: boolean;
  onUpload: () => void;
  onDismiss: () => void;
}

export default function DemoConversionBridge({
  visible,
  onUpload,
  onDismiss,
}: DemoConversionBridgeProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(100%,22rem)] px-3 pointer-events-none"
      role="status"
    >
      <div className="pointer-events-auto rounded-xl border border-orange-500/40 bg-[#1a1410]/95 backdrop-blur-md shadow-xl shadow-black/50 px-4 py-3 flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5" aria-hidden>
          🔥
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-orange-100">Your turn — try your own model</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
            Drop PMX + VMD on the viewport. Playback keeps running.
          </p>
          <button
            type="button"
            onClick={onUpload}
            className="mt-2.5 inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer w-full justify-center"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PMX / VMD
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
