import { Save, FolderOpen } from 'lucide-react';
import type { StudioUiMode } from '../../flow/types';

interface StudioFlowBarProps {
  uiMode: StudioUiMode;
  onUiModeChange: (mode: StudioUiMode) => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  hasSavedProject: boolean;
}

export default function StudioFlowBar({
  uiMode,
  onUiModeChange,
  onSaveProject,
  onLoadProject,
  hasSavedProject,
}: StudioFlowBarProps) {
  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#0e1014] border-b border-zinc-800/80 text-[10px]">
      <div className="flex items-center gap-1 rounded-lg border border-zinc-700 p-0.5 bg-[#121418]">
        {(['beginner', 'pro'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onUiModeChange(mode)}
            className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wide cursor-pointer transition-colors ${
              uiMode === mode
                ? mode === 'beginner'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-violet-600 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {mode === 'beginner' ? 'Beginner' : 'Pro'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-zinc-500">
        <button
          type="button"
          onClick={onSaveProject}
          className="inline-flex items-center gap-1 hover:text-cyan-300 cursor-pointer font-semibold"
        >
          <Save className="w-3 h-3" />
          Save project
        </button>
        <button
          type="button"
          onClick={onLoadProject}
          disabled={!hasSavedProject}
          className="inline-flex items-center gap-1 hover:text-cyan-300 disabled:opacity-40 cursor-pointer font-semibold"
        >
          <FolderOpen className="w-3 h-3" />
          Load
        </button>
        <span className="hidden sm:inline text-zinc-600">|</span>
        <span className="hidden sm:inline">
          {uiMode === 'beginner' ? 'Pose · Play · Export' : 'Timeline · Curves · Full tools'}
        </span>
      </div>
    </div>
  );
}
