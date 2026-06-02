import * as THREE from 'three';
import type { TimelineKeyframe, TimelineTrackId } from '../types';
import { evaluateSegment } from './curveMath';
import {
  TIMELINE_TRACK_IDS,
  BONE_TRACK_BINDINGS,
  MORPH_NAME_CANDIDATES,
  buildDefaultsFromLive,
  type TimelineEvaluated,
  type TimelineLiveValues,
} from './timelineTrackData';

/** Pre-sorted keyframes per track — avoids filter+sort every frame. */
export class KeyframeTrackIndex {
  private readonly byTrack = new Map<TimelineTrackId, TimelineKeyframe[]>();

  constructor(keyframes: TimelineKeyframe[]) {
    for (const track of TIMELINE_TRACK_IDS) {
      this.byTrack.set(track, []);
    }
    for (const kf of keyframes) {
      this.byTrack.get(kf.track)?.push(kf);
    }
    for (const track of TIMELINE_TRACK_IDS) {
      const arr = this.byTrack.get(track)!;
      if (arr.length > 1) {
        arr.sort((a, b) => a.frame - b.frame);
      }
    }
  }

  getTrack(track: TimelineTrackId): readonly TimelineKeyframe[] {
    return this.byTrack.get(track) ?? [];
  }
}

export function buildKeyframeTrackIndex(keyframes: TimelineKeyframe[]): KeyframeTrackIndex {
  return new KeyframeTrackIndex(keyframes);
}

function lerpSortedTrack(
  sorted: readonly TimelineKeyframe[],
  frame: number,
  defaultValue: number
): number {
  if (sorted.length === 0) return defaultValue;

  const exact = sorted.find((kf) => kf.frame === frame);
  if (exact) return exact.value;

  if (frame <= sorted[0].frame) return sorted[0].value;
  if (frame >= sorted[sorted.length - 1].frame) return sorted[sorted.length - 1].value;

  let prev = sorted[0];
  let next = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  const range = next.frame - prev.frame;
  if (range === 0) return prev.value;
  const t = (frame - prev.frame) / range;
  return evaluateSegment(prev, next, t);
}

export function evaluateTimelineAtFrameIndexed(
  index: KeyframeTrackIndex,
  frame: number,
  live: TimelineLiveValues
): TimelineEvaluated {
  const defaults = buildDefaultsFromLive(live);
  const result = { ...defaults };

  for (const track of TIMELINE_TRACK_IDS) {
    const trackKeys = index.getTrack(track);
    if (trackKeys.length === 0) continue;
    result[track] = lerpSortedTrack(trackKeys, frame, defaults[track]);
  }

  return result;
}

/** Alias used by mmdFrameLoop. */
export class TimelineTrackCache extends KeyframeTrackIndex {
  rebuild(keyframes: TimelineKeyframe[]): void {
    const next = buildKeyframeTrackIndex(keyframes);
    for (const track of TIMELINE_TRACK_IDS) {
      const arr = next.getTrack(track);
      const dest = this.getTrack(track) as TimelineKeyframe[];
      dest.length = 0;
      for (const kf of arr) dest.push(kf);
    }
  }
}

export function buildDefaultsInto(live: TimelineLiveValues, out: TimelineEvaluated): void {
  const d = buildDefaultsFromLive(live);
  for (const track of TIMELINE_TRACK_IDS) {
    out[track] = d[track];
  }
}

export function evaluateTimelineInto(
  index: KeyframeTrackIndex,
  live: TimelineLiveValues,
  frame: number,
  out: TimelineEvaluated
): void {
  const evaluated = evaluateTimelineAtFrameIndexed(index, frame, live);
  for (const track of TIMELINE_TRACK_IDS) {
    out[track] = evaluated[track];
  }
}

type BoneTrack = Exclude<TimelineTrackId, 'morph_eyes' | 'morph_mouth' | 'morph_brow'>;

export interface MmdTimelineApplyCache {
  morphEyes: number;
  morphMouth: number;
  morphBrow: number;
  /** One resolved bone + axis per bone track (parallel to bone track order). */
  boneSlots: Array<{ bone: THREE.Bone; axis: 'x' | 'y' | 'z' } | null>;
}

const BONE_TRACK_ORDER = TIMELINE_TRACK_IDS.filter(
  (t): t is BoneTrack => !t.startsWith('morph_')
);

function findMorphIndex(dict: Record<string, number>, candidates: string[]): number {
  for (const candidate of candidates) {
    const found = Object.keys(dict).find(
      (name) =>
        name.toLowerCase() === candidate.toLowerCase() ||
        name.toLowerCase().includes(candidate.toLowerCase())
    );
    if (found !== undefined) return dict[found];
  }
  return -1;
}

function findBoneCached(
  skeleton: THREE.Skeleton,
  boneByName: Map<string, THREE.Bone>,
  candidates: string[]
): THREE.Bone | null {
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    const exact = boneByName.get(candidate) ?? boneByName.get(lower);
    if (exact) return exact;
  }
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    for (const bone of skeleton.bones) {
      if (bone.name.toLowerCase().includes(lower)) return bone;
    }
  }
  return null;
}

export function buildMmdTimelineApplyCache(mesh: THREE.SkinnedMesh): MmdTimelineApplyCache {
  const dict = mesh.morphTargetDictionary ?? {};
  const boneByName = new Map<string, THREE.Bone>();
  if (mesh.skeleton) {
    for (const bone of mesh.skeleton.bones) {
      boneByName.set(bone.name, bone);
      boneByName.set(bone.name.toLowerCase(), bone);
    }
  }

  const boneSlots: MmdTimelineApplyCache['boneSlots'] = [];
  for (const track of BONE_TRACK_ORDER) {
    const binding = BONE_TRACK_BINDINGS[track];
    const bone =
      mesh.skeleton && binding
        ? findBoneCached(mesh.skeleton, boneByName, binding.candidates)
        : null;
    boneSlots.push(bone && binding ? { bone, axis: binding.axis } : null);
  }

  return {
    morphEyes: findMorphIndex(dict, MORPH_NAME_CANDIDATES.eyes),
    morphMouth: findMorphIndex(dict, MORPH_NAME_CANDIDATES.mouth),
    morphBrow: findMorphIndex(dict, MORPH_NAME_CANDIDATES.brow),
    boneSlots,
  };
}

const DEG2RAD = Math.PI / 180;

export function applyTimelineEvaluatedFast(
  mesh: THREE.SkinnedMesh,
  evaluated: TimelineEvaluated,
  cache: MmdTimelineApplyCache
): void {
  const influences = mesh.morphTargetInfluences;
  if (influences) {
    if (cache.morphEyes >= 0) influences[cache.morphEyes] = evaluated.morph_eyes;
    if (cache.morphMouth >= 0) influences[cache.morphMouth] = evaluated.morph_mouth;
    if (cache.morphBrow >= 0) influences[cache.morphBrow] = evaluated.morph_brow;
  }

  if (!mesh.skeleton) return;

  const rest = (mesh.userData.mmdRestPose as Record<string, [number, number, number]> | undefined) ?? {};
  let bonesDirty = false;

  for (let i = 0; i < BONE_TRACK_ORDER.length; i++) {
    const slot = cache.boneSlots[i];
    if (!slot) continue;
    const track = BONE_TRACK_ORDER[i]!;
    const bone = slot.bone;
    const base = rest[bone.name] ?? [0, 0, 0];
    const deg = evaluated[track];
    const rad = deg * DEG2RAD;

    if (slot.axis === 'x') {
      bone.rotation.x = base[0] + rad;
    } else if (slot.axis === 'y') {
      bone.rotation.y = base[1] + rad;
    } else {
      bone.rotation.z = base[2] + rad;
    }
    bonesDirty = true;
  }

  if (bonesDirty) {
    mesh.skeleton.update();
  }
}
