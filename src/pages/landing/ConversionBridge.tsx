import { Upload, ChevronRight } from 'lucide-react';

interface ConversionBridgeProps {
  onUpload: () => void;
  variant?: 'prominent' | 'compact';
}

/** Demo → Upload conversion block */
export default function ConversionBridge({ onUpload, variant = 'prominent' }: ConversionBridgeProps) {
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onUpload}
        className="w-full text-left glass-panel rounded-xl p-4 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-950/10 transition-all cursor-pointer group"
      >
        <p className="text-sm font-semibold text-zinc-100 group-hover:text-amber-100">
          Enjoyed the demo? <span className="text-amber-400">Try your own model</span>
        </p>
        <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-cyan-400">
          Upload PMX/VMD
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </button>
    );
  }

  return (
    <div className="relative rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/40 via-zinc-900/80 to-cyan-950/30 p-6 sm:p-8 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="max-w-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-2">
            Your turn
          </p>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-white mb-2">
            Enjoyed the demo? Now try with your own model
          </h3>
          <p className="text-sm text-zinc-400">
            Drop PMX + VMD on the viewport — same studio, your character, your dance. Files stay in your browser.
          </p>
        </div>
        <button
          type="button"
          onClick={onUpload}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-base px-6 py-3.5 shadow-lg shadow-amber-900/30 transition-all cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          Upload PMX/VMD
        </button>
      </div>
    </div>
  );
}
