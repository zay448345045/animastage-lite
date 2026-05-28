import type { TimelineKeyframe, TimelineTrackId } from '../types';
import { addKeyframe, deleteKeyframe, getKeyframesForTrack } from '../components/TimelineLogic';

const MIRROR_TRACK: Partial<Record<TimelineTrackId, TimelineTrackId>> = {
  bone_l_arm_x: 'bone_r_arm_x',
  bone_l_arm_z: 'bone_r_arm_z',
  bone_r_arm_x: 'bone_l_arm_x',
  bone_r_arm_z: 'bone_l_arm_z',
};

function newId(): string {
  return `kf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clearTrack(
  keyframes: TimelineKeyframe[],
  track: TimelineTrackId
): TimelineKeyframe[] {
  return keyframes.filter((kf) => kf.track !== track);
}

export function clearAllKeyframes(): TimelineKeyframe[] {
  return [];
}

export function copyKeyframesAtFrame(
  keyframes: TimelineKeyframe[],
  frame: number
): TimelineKeyframe[] {
  return keyframes
    .filter((kf) => kf.frame === frame)
    .map((kf) => ({ ...kf, id: newId() }));
}

export function pasteKeyframes(
  keyframes: TimelineKeyframe[],
  clipboard: TimelineKeyframe[],
  targetFrame: number,
  sourceFrame: number
): TimelineKeyframe[] {
  const delta = targetFrame - sourceFrame;
  let next = [...keyframes];
  for (const kf of clipboard) {
    const frame = kf.frame + delta;
    next = next.filter((x) => !(x.track === kf.track && x.frame === frame));
    next.push({
      ...kf,
      id: newId(),
      frame,
    });
  }
  return next.sort((a, b) => a.frame - b.frame || a.track.localeCompare(b.track));
}

export function mirrorPasteKeyframes(
  keyframes: TimelineKeyframe[],
  clipboard: TimelineKeyframe[],
  targetFrame: number,
  sourceFrame: number
): TimelineKeyframe[] {
  const delta = targetFrame - sourceFrame;
  let next = [...keyframes];
  for (const kf of clipboard) {
    const mirroredTrack = MIRROR_TRACK[kf.track] ?? kf.track;
    const frame = kf.frame + delta;
    next = next.filter((x) => !(x.track === mirroredTrack && x.frame === frame));
    next.push({
      ...kf,
      id: newId(),
      track: mirroredTrack,
      frame,
      value: kf.value,
    });
  }
  return next.sort((a, b) => a.frame - b.frame || a.track.localeCompare(b.track));
}

export function timeStretchKeyframes(
  keyframes: TimelineKeyframe[],
  factor: number,
  maxFrame: number
): TimelineKeyframe[] {
  if (factor <= 0) return keyframes;
  const map = new Map<string, TimelineKeyframe>();
  for (const kf of keyframes) {
    const frame = Math.min(maxFrame, Math.max(0, Math.round(kf.frame * factor)));
    map.set(`${kf.track}:${frame}`, { ...kf, id: newId(), frame });
  }
  return Array.from(map.values()).sort((a, b) => a.frame - b.frame || a.track.localeCompare(b.track));
}

export function moveKeyframe(
  keyframes: TimelineKeyframe[],
  track: TimelineTrackId,
  fromFrame: number,
  toFrame: number
): TimelineKeyframe[] {
  const kf = keyframes.find((k) => k.track === track && k.frame === fromFrame);
  if (!kf) return keyframes;
  let next = deleteKeyframe(keyframes, track, fromFrame);
  next = addKeyframe(next, toFrame, track, kf.value);
  const added = next.find((k) => k.track === track && k.frame === toFrame);
  if (added) {
    added.interpolation = kf.interpolation;
    added.easeIn = kf.easeIn;
    added.easeOut = kf.easeOut;
  }
  return next;
}

export function simplifyTrack(
  keyframes: TimelineKeyframe[],
  track: TimelineTrackId,
  tolerance = 0.5
): TimelineKeyframe[] {
  const trackKeys = getKeyframesForTrack(keyframes, track);
  if (trackKeys.length <= 2) return keyframes;

  const keep = new Set<string>([trackKeys[0].id, trackKeys[trackKeys.length - 1].id]);

  for (let i = 1; i < trackKeys.length - 1; i++) {
    const prev = trackKeys[i - 1];
    const curr = trackKeys[i];
    const next = trackKeys[i + 1];
    const t = (curr.frame - prev.frame) / (next.frame - prev.frame);
    const lerp = prev.value + (next.value - prev.value) * t;
    if (Math.abs(lerp - curr.value) > tolerance) {
      keep.add(curr.id);
    }
  }

  return keyframes.filter((kf) => kf.track !== track || keep.has(kf.id));
}

export function insertKeyframeAtPlayhead(
  keyframes: TimelineKeyframe[],
  frame: number,
  track: TimelineTrackId,
  value: number
): TimelineKeyframe[] {
  return addKeyframe(keyframes, frame, track, value);
}

export function deleteKeyframeAt(
  keyframes: TimelineKeyframe[],
  track: TimelineTrackId,
  frame: number
): TimelineKeyframe[] {
  return deleteKeyframe(keyframes, track, frame);
}

export function bezierLerp(a: number, b: number, t: number, easeOut = 0.33, easeIn = 0.33): number {
  const u = t;
  const v = 1 - t;
  const w1 = easeOut;
  const w2 = easeIn;
  const blend = (u * u * u) * (1 + w1) + (v * v * v) * w2 + 3 * u * u * v * (0.5 + w1 * 0.5);
  const t2 = blend / (blend + (1 - blend) + 1e-6);
  return a + (b - a) * Math.max(0, Math.min(1, t2));
}
