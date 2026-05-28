import { Film, Circle } from 'lucide-react';

interface VideoRecordPanelProps {
  busy: boolean;
  mode: 'idle' | 'offline' | 'live';
  onRenderMp4: () => void;
  onLiveRecord: () => void;
  vertical?: boolean;
}

export default function VideoRecordPanel({
  busy,
  mode,
  onRenderMp4,
  onLiveRecord,
  vertical = false,
}: VideoRecordPanelProps) {
  const liveActive = mode === 'live';

  return (
    <div className="border border-violet-500/25 rounded-md p-2 space-y-2 bg-violet-950/15">
      <div className="text-[10px] font-bold text-violet-300 flex items-center gap-1">
        <Film className="w-3 h-3" />
        Video recording
      </div>
      {vertical && (
        <p className="text-[8px] text-zinc-500 leading-relaxed">
          9:16: HQ render scales to 1080×1920. Live — real-time (WebM/MP4).
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
