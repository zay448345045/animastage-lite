import { useCallback, useMemo, useRef, useState } from 'react';
import type { TimelineKeyframe, TimelineTrackId } from '../../types';
import { TIMELINE_TRACK_LABELS, getKeyframesForTrack } from '../TimelineLogic';
import {
  curveXToFrame,
  curveYToValue,
  easeInFromHandle,
  easeOutFromHandle,
  frameToCurveX,
  getBezierHandles,
  sampleTrackCurve,
  valueToCurveY,
} from '../../editor/curveMath';

const PAD = 12;
const W = 520;
const H = 160;

type DragKind =
  | { type: 'key'; frame: number; startX: number; startY: number; startValue: number }
  | { type: 'out'; frame: number }
  | { type: 'in'; frame: number }
  | { type: 'scrub' };

interface CurveEditorViewProps {
  keyframes: TimelineKeyframe[];
  track: TimelineTrackId;
  maxFrames: number;
  currentFrame: number;
  onScrubFrame: (frame: number) => void;
  onMoveKeyframe: (fromFrame: number, toFrame: number) => void;
  onPatchKeyframe: (
    frame: number,
    patch: Partial<Pick<TimelineKeyframe, 'interpolation' | 'easeIn' | 'easeOut' | 'value'>>,
    commit?: boolean
  ) => void;
}

export default function CurveEditorView({
  keyframes,
  track,
  maxFrames,
  currentFrame,
  onScrubFrame,
  onMoveKeyframe,
  onPatchKeyframe,
}: CurveEditorViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragKind | null>(null);

  const trackKeys = useMemo(
    () => getKeyframesForTrack(keyframes, track),
    [keyframes, track]
  );

  const selected =
    trackKeys.find((k) => k.frame === currentFrame) ?? trackKeys[0] ?? null;

  const segment = useMemo(() => {
    if (!selected || trackKeys.length < 2) return null;
    const sorted = trackKeys;
    const idx = sorted.findIndex((k) => k.id === selected.id);
    if (idx < sorted.length - 1) {
      return { a: sorted[idx], b: sorted[idx + 1] };
    }
    if (idx > 0) {
      return { a: sorted[idx - 1], b: sorted[idx] };
    }
    return null;
  }, [selected, trackKeys]);

  const viewRange = useMemo(() => {
    if (trackKeys.length === 0) {
      return {
        minF: 0,
        maxF: Math.max(60, maxFrames),
        minV: 0,
        maxV: 1,
      };
    }
    const frames = trackKeys.map((k) => k.frame);
    const vals = trackKeys.map((k) => k.value);
    const padF = Math.max(8, Math.round((Math.max(...frames) - Math.min(...frames)) * 0.15));
    const minF = Math.max(0, Math.min(...frames) - padF);
    const maxF = Math.min(maxFrames, Math.max(...frames) + padF);
    const minV = Math.min(...vals, 0);
    const maxV = Math.max(...vals, 1);
    const padV = Math.max(0.05, (maxV - minV) * 0.2);
    return {
      minF,
      maxF: Math.max(minF + 1, maxF),
      minV: minV - padV,
      maxV: maxV + padV,
    };
  }, [trackKeys, maxFrames]);

  const clientToLocal = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    };
  }, []);

  const pathD = useMemo(() => {
    if (trackKeys.length < 1) return '';
    const samples = sampleTrackCurve(
      trackKeys,
      viewRange.minF,
      viewRange.maxF,
      64
    );
    return samples
      .map((p, i) => {
        const x = frameToCurveX(p.frame, viewRange.minF, viewRange.maxF, W, PAD);
        const y = valueToCurveY(p.value, viewRange.minV, viewRange.maxV, H, PAD);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [trackKeys, viewRange]);

  const handles = segment ? getBezierHandles(segment.a, segment.b) : null;

  const finishDrag = useCallback(() => setDrag(null), []);

  const onPointerDownSvg = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const { x, y } = clientToLocal(e.clientX, e.clientY);
      const frame = curveXToFrame(x, viewRange.minF, viewRange.maxF, W, PAD);
      onScrubFrame(frame);
      setDrag({ type: 'scrub' });
      (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    },
    [clientToLocal, onScrubFrame, viewRange]
  );

  const onPointerMoveSvg = useCallback(
    (e: React.PointerEvent) => {
      if (!drag) return;
      const { x, y } = clientToLocal(e.clientX, e.clientY);

      if (drag.type === 'scrub') {
        onScrubFrame(
          curveXToFrame(x, viewRange.minF, viewRange.maxF, W, PAD)
        );
        return;
      }

      if (drag.type === 'key') {
        const newFrame = Math.max(
          0,
          Math.min(
            maxFrames,
            curveXToFrame(x, viewRange.minF, viewRange.maxF, W, PAD)
          )
        );
        const newValue = curveYToValue(
          y,
          viewRange.minV,
          viewRange.maxV,
          H,
          PAD
        );
        if (newFrame !== drag.frame) {
          onMoveKeyframe(drag.frame, newFrame);
          onPatchKeyframe(newFrame, { value: newValue }, false);
          setDrag({ ...drag, frame: newFrame });
        } else {
          onPatchKeyframe(drag.frame, { value: newValue }, false);
        }
        return;
      }

      if (drag.type === 'out' && segment) {
        const point = {
          frame: curveXToFrame(x, viewRange.minF, viewRange.maxF, W, PAD),
          value: curveYToValue(y, viewRange.minV, viewRange.maxV, H, PAD),
        };
        onPatchKeyframe(
          segment.a.frame,
          {
            interpolation: 'bezier',
            easeOut: easeOutFromHandle(segment.a, segment.b, point),
          },
          false
        );
        return;
      }

      if (drag.type === 'in' && segment) {
        const point = {
          frame: curveXToFrame(x, viewRange.minF, viewRange.maxF, W, PAD),
          value: curveYToValue(y, viewRange.minV, viewRange.maxV, H, PAD),
        };
        onPatchKeyframe(
          segment.b.frame,
          {
            interpolation: 'bezier',
            easeIn: easeInFromHandle(segment.a, segment.b, point),
          },
          false
        );
      }
    },
    [
      drag,
      clientToLocal,
      viewRange,
      maxFrames,
      onScrubFrame,
      onMoveKeyframe,
      onPatchKeyframe,
      segment,
    ]
  );

  const onPointerUpSvg = useCallback(
    (e: React.PointerEvent) => {
      if (drag && drag.type !== 'scrub' && selected) {
        onPatchKeyframe(selected.frame, {}, true);
      }
      finishDrag();
      try {
        (e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [drag, finishDrag, onPatchKeyframe, selected]
  );

  const playheadX = frameToCurveX(
    currentFrame,
    viewRange.minF,
    viewRange.maxF,
    W,
    PAD
  );

  return (
    <div className="flex flex-col gap-2 min-h-[200px]">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-[9px] font-bold uppercase text-violet-300 truncate">
          {TIMELINE_TRACK_LABELS[track]}
        </div>
        <div className="flex gap-1 shrink-0">
          {(['linear', 'bezier'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded border ${
                selected?.interpolation === mode ||
                (mode === 'linear' && !selected?.interpolation)
                  ? 'border-violet-400/50 text-violet-200 bg-violet-500/15'
                  : 'border-zinc-700 text-zinc-500'
              }`}
              disabled={!selected}
              onClick={() =>
                selected &&
                onPatchKeyframe(selected.frame, {
                  interpolation: mode,
                  easeOut: mode === 'bezier' ? 0.33 : undefined,
                  easeIn: mode === 'bezier' ? 0.33 : undefined,
                })
              }
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[160px] bg-[#121418] rounded border border-zinc-800 touch-none select-none"
        onPointerDown={onPointerDownSvg}
        onPointerMove={onPointerMoveSvg}
        onPointerUp={onPointerUpSvg}
        onPointerLeave={finishDrag}
      >
        {/* grid */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + t * (H - PAD * 2)}
            y2={PAD + t * (H - PAD * 2)}
            stroke="#1e2228"
            strokeWidth={1}
          />
        ))}

        {pathD && (
          <path d={pathD} fill="none" stroke="#39c5bb" strokeWidth={2} />
        )}

        {segment && handles && (
          <>
            <line
              x1={frameToCurveX(segment.a.frame, viewRange.minF, viewRange.maxF, W, PAD)}
              y1={valueToCurveY(segment.a.value, viewRange.minV, viewRange.maxV, H, PAD)}
              x2={frameToCurveX(handles.out.frame, viewRange.minF, viewRange.maxF, W, PAD)}
              y2={valueToCurveY(handles.out.value, viewRange.minV, viewRange.maxV, H, PAD)}
              stroke="#e879ff"
              strokeWidth={1}
              strokeDasharray="3 2"
            />
            <line
              x1={frameToCurveX(handles.in.frame, viewRange.minF, viewRange.maxF, W, PAD)}
              y1={valueToCurveY(handles.in.value, viewRange.minV, viewRange.maxV, H, PAD)}
              x2={frameToCurveX(segment.b.frame, viewRange.minF, viewRange.maxF, W, PAD)}
              y2={valueToCurveY(segment.b.value, viewRange.minV, viewRange.maxV, H, PAD)}
              stroke="#e879ff"
              strokeWidth={1}
              strokeDasharray="3 2"
            />
            <circle
              cx={frameToCurveX(handles.out.frame, viewRange.minF, viewRange.maxF, W, PAD)}
              cy={valueToCurveY(handles.out.value, viewRange.minV, viewRange.maxV, H, PAD)}
              r={5}
              fill="#a855f7"
              stroke="#fff"
              strokeWidth={1}
              className="cursor-grab"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDrag({ type: 'out', frame: segment.a.frame });
                (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
              }}
            />
            <circle
              cx={frameToCurveX(handles.in.frame, viewRange.minF, viewRange.maxF, W, PAD)}
              cy={valueToCurveY(handles.in.value, viewRange.minV, viewRange.maxV, H, PAD)}
              r={5}
              fill="#a855f7"
              stroke="#fff"
              strokeWidth={1}
              className="cursor-grab"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDrag({ type: 'in', frame: segment.b.frame });
                (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
              }}
            />
          </>
        )}

        <line
          x1={playheadX}
          x2={playheadX}
          y1={PAD}
          y2={H - PAD}
          stroke="#f59e0b"
          strokeWidth={1.5}
          opacity={0.85}
        />

        {trackKeys.map((kf) => {
          const cx = frameToCurveX(kf.frame, viewRange.minF, viewRange.maxF, W, PAD);
          const cy = valueToCurveY(kf.value, viewRange.minV, viewRange.maxV, H, PAD);
          const isSel = selected?.id === kf.id;
          return (
            <circle
              key={kf.id}
              cx={cx}
              cy={cy}
              r={isSel ? 6 : 4.5}
              fill={isSel ? '#e879ff' : '#39c5bb'}
              stroke="#0a0a0c"
              strokeWidth={1.5}
              className="cursor-grab"
              onPointerDown={(e) => {
                e.stopPropagation();
                onScrubFrame(kf.frame);
                setDrag({
                  type: 'key',
                  frame: kf.frame,
                  startX: cx,
                  startY: cy,
                  startValue: kf.value,
                });
                (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
              }}
            />
          );
        })}
      </svg>

      {selected && (
        <div className="grid grid-cols-3 gap-2 text-[9px] px-1">
          <label className="text-zinc-500">
            Frame
            <div className="text-zinc-200 font-mono mt-0.5">{selected.frame}</div>
          </label>
          <label className="text-zinc-500">
            Value
            <input
              type="number"
              step={0.01}
              className="w-full mt-0.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-200 px-1"
              value={Number(selected.value.toFixed(3))}
              onChange={(e) =>
                onPatchKeyframe(selected.frame, { value: Number(e.target.value) })
              }
            />
          </label>
          <label className="text-zinc-500">
            Ease out / in
            <div className="flex gap-1 mt-0.5">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                title="Ease out"
                value={selected.easeOut ?? 0.33}
                className="w-full accent-violet-400"
                onChange={(e) =>
                  onPatchKeyframe(selected.frame, {
                    interpolation: 'bezier',
                    easeOut: Number(e.target.value),
                  })
                }
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                title="Ease in"
                value={selected.easeIn ?? 0.33}
                className="w-full accent-fuchsia-400"
                onChange={(e) =>
                  onPatchKeyframe(selected.frame, {
                    interpolation: 'bezier',
                    easeIn: Number(e.target.value),
                  })
                }
              />
            </div>
          </label>
        </div>
      )}

      <p className="text-[8px] text-zinc-600 px-1">
        Drag ◆ value/time · purple handles = Bézier · orange = playhead · uses same math as playback
      </p>
    </div>
  );
}
