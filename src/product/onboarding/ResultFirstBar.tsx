import { Pencil, Smartphone } from 'lucide-react';

interface ResultFirstBarProps {
  visible: boolean;
  onEdit: () => void;
  onGenerateShort: () => void;
}

/** Result-first CTA — shown when demo/scene is already playing. UI only. */
export default function ResultFirstBar({ visible, onEdit, onGenerateShort }: ResultFirstBarProps) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#121418]/95 border border-cyan-500/25 shadow-xl backdrop-blur-md">
        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide mr-1 hidden sm:inline">
          Scene playing
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold cursor-pointer transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit this
        </button>
        <button
          type="button"
          onClick={onGenerateShort}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff6ba8] hover:bg-[#ff5a9a] text-white text-xs font-bold cursor-pointer transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Generate Short
        </button>
      </div>
    </div>
  );
}
