import type { TimelineKeyframe, TimelineTrackId } from '../../types';
import CurveEditorView from './CurveEditorView';

interface CurveEditorPanelProps {
  keyframes: TimelineKeyframe[];
  track: TimelineTrackId | null;
  maxFrames: number;
  currentFrame: number;
  onScrubFrame: (frame: number) => void;
  onMoveKeyframe: (track: TimelineTrackId, fromFrame: number, toFrame: number) => void;
  onPatchKeyframe: (
    track: TimelineTrackId,
    frame: number,
    patch: Partial<Pick<TimelineKeyframe, 'interpolation' | 'easeIn' | 'easeOut' | 'value'>>,
    commit?: boolean
  ) => void;
}

export default function CurveEditorPanel({
  keyframes,
  track,
  maxFrames,
  currentFrame,
  onScrubFrame,
  onMoveKeyframe,
  onPatchKeyframe,
}: CurveEditorPanelProps) {
  if (!track) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] text-zinc-500 p-4">
        Select a track in Timeline or Dopesheet, then open Curves
      </div>
    );
  }

  if (keyframes.filter((k) => k.track === track).length < 1) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[10px] text-zinc-500 p-4 gap-2">
        <span>No keyframes on this track.</span>
        <span className="text-zinc-600">Register keys on Timeline, then edit curves here.</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2 bg-[#0e1014] border-t border-zinc-800 min-h-[200px]">
      <CurveEditorView
        keyframes={keyframes}
        track={track}
        maxFrames={maxFrames}
        currentFrame={currentFrame}
        onScrubFrame={onScrubFrame}
        onMoveKeyframe={(from, to) => onMoveKeyframe(track, from, to)}
        onPatchKeyframe={(frame, patch, commit) =>
          onPatchKeyframe(track, frame, patch, commit)
        }
      />
    </div>
  );
}
