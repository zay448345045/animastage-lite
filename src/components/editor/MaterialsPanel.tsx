import type { PmxMaterialInfo } from '../../types';

interface MaterialsPanelProps {
  materials: PmxMaterialInfo[];
  selectedMaterial: string | null;
  onSelectMaterial: (name: string | null) => void;
}

export default function MaterialsPanel({
  materials,
  selectedMaterial,
  onSelectMaterial,
}: MaterialsPanelProps) {
  if (materials.length === 0) {
    return <p className="text-[10px] text-zinc-500 p-2">Materials appear after loading a PMX</p>;
  }

  return (
    <div className="max-h-40 overflow-y-auto space-y-0.5 p-1">
      {materials.map((m) => {
        const active = selectedMaterial === m.name;
        return (
          <button
            key={m.name}
            type="button"
            onClick={() => onSelectMaterial(active ? null : m.name)}
            className={`w-full text-left px-2 py-1 text-[10px] rounded cursor-pointer truncate ${
              active
                ? 'bg-violet-950/60 text-violet-200 border border-violet-500/40'
                : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {m.name}
          </button>
        );
      })}
    </div>
  );
}
