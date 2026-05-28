import type { VideoRecordProgress } from '../video/mmdVideoRecorder';

interface RecordingHudProps {
  visible: boolean;
  progress: VideoRecordProgress;
  mode: 'idle' | 'offline' | 'live';
  onCancel?: () => void;
}

export default function RecordingHud({
  visible,
  progress,
  mode,
  onCancel,
}: RecordingHudProps) {
  if (!visible || progress.phase === 'idle') return null;

  const showBar =
    progress.phase === 'render' ||
    progress.phase === 'finalize' ||
    progress.phase === 'done';

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-[min(420px,90vw)] pointer-events-auto">
      <div className="bg-[#121418]/95 border border-[#39c5bb]/40 rounded-lg px-4 py-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#39c5bb]">
            {mode === 'live' ? 'Live recording' : 'MP4 render'}
          </span>
          {(mode === 'offline' || mode === 'live') && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[9px] font-bold px-2 py-0.5 rounded border border-red-500/50 text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
        {showBar && (
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#39c5bb] transition-[width] duration-150"
              style={{ width: `${Math.round(progress.progress * 100)}%` }}
            />
          </div>
        )}
        <p className="text-[10px] text-zinc-400 font-mono">{progress.message}</p>
      </div>
    </div>
  );
}
