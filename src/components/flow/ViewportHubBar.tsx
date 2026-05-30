import { Pause, Play, Upload, Video } from 'lucide-react';
import type { StudioUiMode } from '../../flow/types';

interface ViewportHubBarProps {
  uiMode: StudioUiMode;
  isPlaying: boolean;
  hasModel: boolean;
  isDemoActive: boolean;
  uploadHighlight?: boolean;
  onTogglePlay: () => void;
  onExport: () => void;
  onUpload: () => void;
}

export default function ViewportHubBar({
  uiMode,
  isPlaying,
  hasModel,
  isDemoActive,
  uploadHighlight = false,
  onTogglePlay,
  onExport,
  onUpload,
}: ViewportHubBarProps) {
  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-none">
      {isDemoActive && (
        <span className="pointer-events-none text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Demo playing
        </span>
      )}
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-[#121418]/90 backdrop-blur-md p-1 shadow-lg">
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={!hasModel}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        {uiMode === 'beginner' && (
          <button
            type="button"
            onClick={onUpload}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
              uploadHighlight
                ? 'bg-cyan-500 text-zinc-950 animate-pulse'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        )}
        <button
          type="button"
          onClick={onExport}
          disabled={!hasModel}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 cursor-pointer"
        >
          <Video className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
    </div>
  );
}
