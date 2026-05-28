import { useMemo } from 'react';
import type { TimelineKeyframe, TimelineTrackId } from '../../types';
import { getKeyframesForTrack } from '../TimelineLogic';
import { bezierLerp } from '../../editor/clipOperations';

interface CurveEditorPanelProps {
  keyframes: TimelineKeyframe[];
  track: TimelineTrackId | null;
  currentFrame: number;
  onPatchKeyframe: (
    track: TimelineTrackId,
    frame: number,
    patch: Partial<Pick<TimelineKeyframe, 'interpolation' | 'easeIn' | 'easeOut' | 'value'>>
  ) => void;
}

const W = 280;
const H = 100;

export default function CurveEditorPanel({
  keyframes,
  track,
  currentFrame,
  onPatchKeyframe,
}: CurveEditorPanelProps) {
  const trackKeys = useMemo(
    () => (track ? getKeyframesForTrack(keyframes, track) : []),
    [keyframes, track]
  );

  const selected = trackKeys.find((k) => k.frame === currentFrame) ?? trackKeys[0];

  const pathD = useMemo(() => {
    if (trackKeys.length < 2) return '';
    const sorted = [...trackKeys].sort((a, b) => a.frame - b.frame);
    const minF = sorted[0].frame;
    const maxF = sorted[sorted.length - 1].frame || 1;
    const vals = sorted.map((k) => k.value);
    const minV = Math.min(...vals, 0);
    const maxV = Math.max(...vals, 1);
    const rangeV = maxV - minV || 1;

    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const frame = minF + t * (maxF - minF);
      let v = sorted[0].value;
      for (let j = 0; j < sorted.length - 1; j++) {
        const a = sorted[j];
        const b = sorted[j + 1];
        if (frame >= a.frame && frame <= b.frame) {
          const local = (frame - a.frame) / (b.frame - a.frame || 1);
          v = bezierLerp(a.value, b.value, local, a.easeOut ?? 0.33, b.easeIn ?? 0.33);
          break;
        }
      }
      const x = (t * W).toFixed(1);
      const y = (H - ((v - minV) / rangeV) * (H - 8) - 4).toFixed(1);
      pts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
    }
    return pts.join(' ');
  }, [trackKeys]);

  if (!track) {
    return (
      <div className="h-full flex items-center justify-center text-[10px] text-zinc-500 p-4">
        Select a track in the dopesheet
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2 gap-2 bg-[#0e1014] border-t border-zinc-800 min-h-[140px]">
      <div className="text-[9px] font-bold uppercase text-violet-300">Curve · {track}</div>
      <svg width={W} height={H} className="bg-[#121418] rounded border border-zinc-800">
        {pathD && <path d={pathD} fill="none" stroke="#39c5bb" strokeWidth="1.5" />}
        {trackKeys.map((kf) => {
          const sorted = [...trackKeys].sort((a, b) => a.frame - b.frame);
          const minF = sorted[0]?.frame ?? 0;
          const maxF = sorted[sorted.length - 1]?.frame || 1;
          const minV = Math.min(...sorted.map((k) => k.value), 0);
          const maxV = Math.max(...sorted.map((k) => k.value), 1);
          const x = ((kf.frame - minF) / (maxF - minF || 1)) * W;
          const y = H - ((kf.value - minV) / (maxV - minV || 1)) * (H - 8) - 4;
          return (
            <circle
              key={kf.id}
              cx={x}
              cy={y}
              r={selected?.id === kf.id ? 4 : 3}
              fill={selected?.id === kf.id ? '#e879ff' : '#39c5bb'}
            />
          );
        })}
      </svg>
      {selected && (
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <label className="text-zinc-500">
            Interp
            <select
              className="w-full mt-0.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-200"
              value={selected.interpolation ?? 'linear'}
              onChange={(e) =>
                onPatchKeyframe(track, selected.frame, {
                  interpolation: e.target.value as 'linear' | 'bezier',
                })
              }
            >
              <option value="linear">Linear</option>
              <option value="bezier">Bézier</option>
            </select>
          </label>
          <label className="text-zinc-500">
            Ease out
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selected.easeOut ?? 0.33}
              className="w-full accent-violet-400"
              onChange={(e) =>
                onPatchKeyframe(track, selected.frame, { easeOut: Number(e.target.value) })
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
