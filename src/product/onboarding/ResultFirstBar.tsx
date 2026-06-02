import { Pencil, Smartphone, X } from 'lucide-react';

interface ResultFirstBarProps {
  visible: boolean;
  onEdit: () => void;
  onGenerateShort: () => void;
  onDismiss?: () => void;
}

/** Result-first CTA — shown when demo/scene is already playing. UI only. */
export default function ResultFirstBar({
  visible,
  onEdit,
  onGenerateShort,
  onDismiss,
}: ResultFirstBarProps) {
  if (!visible) return null;

  return (
    <div className="result-first-bar absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none max-w-[min(100%,20rem)] w-full px-3">
      <div className="pointer-events-auto relative flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#121418]/90 border border-cyan-500/20 shadow-lg backdrop-blur-sm">
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute -top-2 -right-1 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <span className="w-full text-center text-[10px] text-zinc-400 font-semibold sm:hidden">
          Scene ready — edit or export
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold cursor-pointer transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={onGenerateShort}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff6ba8] hover:bg-[#ff5a9a] text-white text-xs font-bold cursor-pointer transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Short
        </button>
      </div>
    </div>
  );
}
