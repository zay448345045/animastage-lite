import { Pencil } from 'lucide-react';

interface ViewerForkBarProps {
  onEditThis: () => void;
}

/** Minimal viewer CTA — fork scene into editor (viral loop). */
export default function ViewerForkBar({ onEditThis }: ViewerForkBarProps) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <button
        type="button"
        onClick={onEditThis}
        className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121418]/95 border border-cyan-500/30 text-sm font-bold text-zinc-100 shadow-xl backdrop-blur-md hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        <Pencil className="w-4 h-4 text-cyan-400" />
        Edit this
      </button>
    </div>
  );
}
