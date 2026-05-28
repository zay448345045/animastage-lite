import type { CharacterQuality } from '../types';
import { CHARACTER_QUALITY_PRESETS } from '../utils/characterQuality';

interface CharacterQualityToggleProps {
  quality: CharacterQuality;
  onChange: (quality: CharacterQuality) => void;
  disabled?: boolean;
}

const ORDER: CharacterQuality[] = ['standard', 'hd', 'uhd4k'];

export default function CharacterQualityToggle({
  quality,
  onChange,
  disabled = false,
}: CharacterQualityToggleProps) {
  return (
    <div
      className="flex flex-col gap-1 bg-[#121418]/90 border border-zinc-800 rounded-md p-1.5 shadow-md backdrop-blur-sm pointer-events-auto"
      title="Character render quality"
    >
      <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 px-1">
        Quality
      </span>
      <div className="flex items-center gap-0.5">
        {ORDER.map((id) => {
          const preset = CHARACTER_QUALITY_PRESETS[id];
          const active = quality === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(id)}
              title={`${preset.label} — ${preset.subtitle}`}
              className={`min-w-[2.25rem] px-2 py-1 text-[9px] font-bold rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                active
                  ? id === 'uhd4k'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : id === 'hd'
                      ? 'bg-[#39c5bb]/20 text-[#39c5bb] border border-[#39c5bb]/40'
                      : 'bg-zinc-700/50 text-zinc-200 border border-zinc-600'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 border border-transparent'
              }`}
            >
              {preset.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
