import type { TimelineKeyframe } from '../types';
import { bezierLerp } from './clipOperations';

/** Same easing as TimelineLogic.lerpTrackValue — single source for playback + UI. */
export function evaluateSegment(
  a: TimelineKeyframe,
  b: TimelineKeyframe,
  t: number
): number {
  const clamped = Math.max(0, Math.min(1, t));
  if (a.interpolation === 'bezier' || b.interpolation === 'bezier') {
    return bezierLerp(
      a.value,
      b.value,
      clamped,
      a.easeOut ?? 0.33,
      b.easeIn ?? 0.33
    );
  }
  return a.value + (b.value - a.value) * clamped;
}

export interface CurveHandle {
  frame: number;
  value: number;
}

export function getBezierHandles(
  a: TimelineKeyframe,
  b: TimelineKeyframe
): { out: CurveHandle; in: CurveHandle } {
  const span = Math.max(1, b.frame - a.frame);
  const dv = b.value - a.value;
  const outEase = Math.max(0, Math.min(1, a.easeOut ?? 0.33));
  const inEase = Math.max(0, Math.min(1, b.easeIn ?? 0.33));
  return {
    out: {
      frame: a.frame + span * (0.12 + outEase * 0.58),
      value: a.value + dv * outEase * 0.5,
    },
    in: {
      frame: b.frame - span * (0.12 + inEase * 0.58),
      value: b.value - dv * inEase * 0.5,
    },
  };
}

export function easeOutFromHandle(
  a: TimelineKeyframe,
  b: TimelineKeyframe,
  point: CurveHandle
): number {
  const span = Math.max(1, b.frame - a.frame);
  const dv = b.value - a.value;
  const tx = Math.max(0, Math.min(1, (point.frame - a.frame) / span));
  const ty =
    Math.abs(dv) < 1e-6 ? 0.5 : Math.max(0, Math.min(1, (point.value - a.value) / dv));
  return Math.max(0, Math.min(1, (tx - 0.12) / 0.58 * 0.65 + ty * 0.35));
}

export function easeInFromHandle(
  a: TimelineKeyframe,
  b: TimelineKeyframe,
  point: CurveHandle
): number {
  const span = Math.max(1, b.frame - a.frame);
  const dv = b.value - a.value;
  const tx = Math.max(0, Math.min(1, (b.frame - point.frame) / span));
  const ty =
    Math.abs(dv) < 1e-6 ? 0.5 : Math.max(0, Math.min(1, (b.value - point.value) / dv));
  return Math.max(0, Math.min(1, (tx - 0.12) / 0.58 * 0.65 + ty * 0.35));
}

export function sampleTrackCurve(
  sorted: TimelineKeyframe[],
  minFrame: number,
  maxFrame: number,
  steps: number
): Array<{ frame: number; value: number }> {
  if (sorted.length === 0) return [];
  const out: Array<{ frame: number; value: number }> = [];
  const span = Math.max(1, maxFrame - minFrame);

  for (let i = 0; i <= steps; i++) {
    const frame = minFrame + (span * i) / steps;
    let value = sorted[0].value;

    if (frame <= sorted[0].frame) {
      value = sorted[0].value;
    } else if (frame >= sorted[sorted.length - 1].frame) {
      value = sorted[sorted.length - 1].value;
    } else {
      for (let j = 0; j < sorted.length - 1; j++) {
        const a = sorted[j];
        const b = sorted[j + 1];
        if (frame >= a.frame && frame <= b.frame) {
          const local = (frame - a.frame) / Math.max(1, b.frame - a.frame);
          value = evaluateSegment(a, b, local);
          break;
        }
      }
    }
    out.push({ frame, value });
  }
  return out;
}

export function frameToCurveX(
  frame: number,
  minFrame: number,
  maxFrame: number,
  width: number,
  pad: number
): number {
  const span = Math.max(1, maxFrame - minFrame);
  return pad + ((frame - minFrame) / span) * (width - pad * 2);
}

export function valueToCurveY(
  value: number,
  minValue: number,
  maxValue: number,
  height: number,
  pad: number
): number {
  const span = maxValue - minValue || 1;
  return pad + (1 - (value - minValue) / span) * (height - pad * 2);
}

export function curveXToFrame(
  x: number,
  minFrame: number,
  maxFrame: number,
  width: number,
  pad: number
): number {
  const span = Math.max(1, maxFrame - minFrame);
  const t = Math.max(0, Math.min(1, (x - pad) / Math.max(1, width - pad * 2)));
  return Math.round(minFrame + t * span);
}

export function curveYToValue(
  y: number,
  minValue: number,
  maxValue: number,
  height: number,
  pad: number
): number {
  const span = maxValue - minValue || 1;
  const t = Math.max(0, Math.min(1, (y - pad) / Math.max(1, height - pad * 2)));
  return minValue + (1 - t) * span;
}
