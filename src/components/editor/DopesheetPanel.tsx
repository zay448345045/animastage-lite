import { useMemo, useRef, useState, useCallback } from 'react';
import type { TimelineKeyframe, TimelineTrackId } from '../../types';
import { TIMELINE_TRACK_IDS, TIMELINE_TRACK_LABELS } from '../TimelineLogic';
import { playheadRef } from '../../utils/playhead';

const FRAME_W = 20;
const ROW_H = 22;

interface DopesheetPanelProps {
  keyframes: TimelineKeyframe[];
  maxFrames: number;
  currentFrame: number;
  activeTrack: TimelineTrackId | null;
  onSelectTrack: (track: TimelineTrackId) => void;
  onSelectKeyframe: (track: TimelineTrackId, frame: number) => void;
  onMoveKeyframe: (track: TimelineTrackId, fromFrame: number, toFrame: number) => void;
  onDeleteKeyframe: (track: TimelineTrackId, frame: number) => void;
}

export default function DopesheetPanel({
  keyframes,
  maxFrames,
  currentFrame,
  activeTrack,
  onSelectTrack,
  onSelectKeyframe,
  onMoveKeyframe,
  onDeleteKeyframe,
}: DopesheetPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ track: TimelineTrackId; frame: number } | null>(null);

  const width = Math.max(maxFrames * FRAME_W, 400);

  const keysByTrack = useMemo(() => {
    const map = new Map<TimelineTrackId, TimelineKeyframe[]>();
    for (const id of TIMELINE_TRACK_IDS) {
      map.set(id, keyframes.filter((k) => k.track === id));
    }
    return map;
  }, [keyframes]);

  const handlePointerDown = useCallback(
    (track: TimelineTrackId, frame: number, e: React.PointerEvent) => {
      e.stopPropagation();
      onSelectTrack(track);
      onSelectKeyframe(track, frame);
      setDrag({ track, frame });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [onSelectTrack, onSelectKeyframe]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag || !scrollRef.current) return;
      const rect = scrollRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollRef.current.scrollLeft - 120;
      const frame = Math.max(0, Math.min(maxFrames, Math.round(x / FRAME_W)));
      if (frame !== drag.frame) {
        onMoveKeyframe(drag.track, drag.frame, frame);
        setDrag({ track: drag.track, frame });
      }
    },
    [drag, maxFrames, onMoveKeyframe]
  );

  const handlePointerUp = useCallback(() => setDrag(null), []);

  return (
    <div className="flex flex-col h-full min-h-[140px] bg-[#0e1014] border-t border-zinc-800">
      <div className="px-2 py-1 text-[9px] font-bold uppercase text-zinc-500 border-b border-zinc-800">
        Dopesheet — drag ◆ to retime · click row to select track
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div style={{ width: width + 120, minHeight: TIMELINE_TRACK_IDS.length * ROW_H }}>
          {TIMELINE_TRACK_IDS.map((track) => {
            const keys = keysByTrack.get(track) ?? [];
            const selected = activeTrack === track;
            return (
              <div
                key={track}
                className={`flex items-center border-b border-zinc-900/80 ${selected ? 'bg-teal-950/30' : ''}`}
                style={{ height: ROW_H }}
              >
                <button
                  type="button"
                  className="w-[120px] shrink-0 text-left px-2 text-[9px] truncate text-zinc-400 hover:text-[#39c5bb] cursor-pointer"
                  onClick={() => onSelectTrack(track)}
                >
                  {TIMELINE_TRACK_LABELS[track]}
                </button>
                <div className="relative flex-1 h-full">
                  {keys.map((kf) => (
                    <button
                      key={kf.id}
                      type="button"
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-[#39c5bb] border border-zinc-900 hover:bg-[#5eead4] cursor-grab active:cursor-grabbing z-10"
                      style={{ left: kf.frame * FRAME_W }}
                      title={`Frame ${kf.frame} = ${kf.value.toFixed(2)}`}
                      onPointerDown={(e) => handlePointerDown(track, kf.frame, e)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onDeleteKeyframe(track, kf.frame);
                      }}
                    />
                  ))}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-500/80 pointer-events-none z-20"
                    style={{ left: (drag ? drag.frame : currentFrame) * FRAME_W }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
