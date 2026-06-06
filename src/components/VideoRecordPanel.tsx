import { Film, Circle } from 'lucide-react';
import { MMD_FPS } from '../utils/playhead';

interface VideoRecordPanelProps {
  busy: boolean;
  mode: 'idle' | 'offline' | 'live';
  exportDurationSec: number;
  maxDurationSec: number;
  onExportDurationSecChange: (sec: number) => void;
  onRenderMp4: () => void;
  onLiveRecord: () => void;
  vertical?: boolean;
}

export default function VideoRecordPanel({
  busy,
  mode,
  exportDurationSec,
  maxDurationSec,
  onExportDurationSecChange,
  onRenderMp4,
  onLiveRecord,
  vertical = false,
}: VideoRecordPanelProps) {
  const liveActive = mode === 'live';
  const clamped = Math.min(maxDurationSec, Math.max(1, exportDurationSec));
  const frameEstimate = Math.min(
    Math.ceil(maxDurationSec * MMD_FPS),
    Math.max(1, Math.ceil(clamped * MMD_FPS))
  );

  return (
    <div className="border border-violet-500/25 rounded-md p-2 space-y-2 bg-violet-950/15">
      <div className="text-[10px] font-bold text-violet-300 flex items-center gap-1">
        <Film className="w-3 h-3" />
        Video recording
      </div>
      <label className="block space-y-1">
        <div className="flex justify-between text-[9px] font-bold text-zinc-400">
          <span>Export length</span>
          <span className="text-zinc-500 font-mono">
            {clamped}s · ~{frameEstimate} fr
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={maxDurationSec}
          step={1}
          value={clamped}
          disabled={busy}
          onChange={(e) => onExportDurationSecChange(parseInt(e.target.value, 10) || 1)}
          className="w-full accent-violet-400"
        />
        <input
          type="number"
          min={1}
          max={maxDurationSec}
          value={clamped}
          disabled={busy}
          onChange={(e) =>
            onExportDurationSecChange(
              Math.min(maxDurationSec, Math.max(1, parseInt(e.target.value, 10) || 1))
            )
          }
          className="w-full mt-1 px-2 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-[11px] font-mono text-zinc-200"
        />
      </label>
      {vertical && (
        <p className="text-[8px] text-zinc-500 leading-relaxed">
          MP4 HQ — offline render. Live — real-time while playing. On the Android app, after export
          use the <strong className="text-zinc-400">Share</strong> menu to save to Files or Gallery.
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy && mode !== 'offline'}
          onClick={onRenderMp4}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-bold rounded border cursor-pointer transition-colors ${
            busy && mode === 'offline'
              ? 'border-red-500/50 text-red-400 bg-red-500/10'
              : 'border-violet-500/40 text-violet-200 hover:bg-violet-500/15'
          }`}
        >
          <Film className="w-3 h-3" />
          {busy && mode === 'offline' ? '⏹ Cancel' : 'MP4 HQ'}
        </button>
        <button
          type="button"
          disabled={busy && mode !== 'live'}
          onClick={onLiveRecord}
          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-bold rounded border cursor-pointer transition-colors ${
            liveActive
              ? 'border-red-500/50 text-red-400 bg-red-500/10'
              : 'border-zinc-600 text-zinc-300 hover:border-violet-500/40'
          }`}
        >
          <Circle className={`w-3 h-3 ${liveActive ? 'fill-red-500 text-red-500' : ''}`} />
          {liveActive ? '⏹ Stop' : 'Live'}
        </button>
      </div>
    </div>
  );
}
