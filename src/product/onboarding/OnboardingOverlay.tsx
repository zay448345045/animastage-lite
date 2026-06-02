import { Play, Upload, Smartphone, X } from 'lucide-react';

interface OnboardingOverlayProps {
  onPlayDemo: () => void;
  onLoadModel: () => void;
  onGenerateShort: () => void;
  onDismiss: () => void;
}

/** UI-only first-run overlay — no engine coupling. */
export default function OnboardingOverlay({
  onPlayDemo,
  onLoadModel,
  onGenerateShort,
  onDismiss,
}: OnboardingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#121418] shadow-2xl p-6">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-zinc-200 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-zinc-100 mb-1">Welcome to AnimaStage</h2>
        <p className="text-xs text-zinc-500 mb-5">Create → save → share → watch. Pick a starting point:</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onPlayDemo}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm cursor-pointer transition-colors"
          >
            <Play className="w-5 h-5 shrink-0" />
            Play Demo
          </button>
          <button
            type="button"
            onClick={onLoadModel}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-zinc-700 hover:border-cyan-500/40 bg-[#0e1014] text-zinc-200 font-bold text-sm cursor-pointer transition-colors"
          >
            <Upload className="w-5 h-5 shrink-0 text-cyan-400" />
            Load Model
            <span className="ml-auto text-[10px] text-zinc-500 font-normal">PMX + VMD</span>
          </button>
          <button
            type="button"
            onClick={onGenerateShort}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#ff6ba8]/30 hover:border-[#ff6ba8]/60 bg-[#ff6ba8]/10 text-[#ff9ec4] font-bold text-sm cursor-pointer transition-colors"
          >
            <Smartphone className="w-5 h-5 shrink-0" />
            Generate Short
            <span className="ml-auto text-[10px] text-zinc-500 font-normal">9:16 · 12s</span>
          </button>
        </div>
      </div>
    </div>
  );
}
