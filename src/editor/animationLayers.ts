import type { AnimationLayerDef, BoneGroupDef, TimelineTrackId } from '../types';
import {
  TIMELINE_TRACK_IDS,
  evaluateTimelineAtFrame,
  buildDefaultsFromLive,
  type TimelineEvaluated,
  type TimelineLiveValues,
} from '../components/TimelineLogic';
import type { TimelineKeyframe } from '../types';

/** Map timeline bone tracks → PMX bone name candidates (same as TimelineLogic bindings). */
const TRACK_BONE_NAMES: Record<
  Exclude<TimelineTrackId, 'morph_eyes' | 'morph_mouth' | 'morph_brow'>,
  string[]
> = {
  bone_head_y: ['頭', 'head'],
  bone_neck_x: ['首', 'neck'],
  bone_spine_y: ['上半身', 'spine', 'upper body'],
  bone_spine_z: ['上半身', 'spine'],
  bone_waist_y: ['下半身', 'waist', 'pelvis'],
  bone_l_arm_x: ['左肩', 'left shoulder'],
  bone_l_arm_z: ['左腕', 'left arm'],
  bone_r_arm_x: ['右肩', 'right shoulder'],
  bone_r_arm_z: ['右腕', 'right arm'],
};

function trackMatchesBoneMask(track: TimelineTrackId, boneMask: string[] | null): boolean {
  if (!boneMask || boneMask.length === 0) return true;
  if (track.startsWith('morph_')) return true;
  const names = TRACK_BONE_NAMES[track as keyof typeof TRACK_BONE_NAMES];
  if (!names) return false;
  return boneMask.some((mask) =>
    names.some(
      (n) =>
        mask === n ||
        mask.toLowerCase() === n.toLowerCase() ||
        mask.toLowerCase().includes(n.toLowerCase()) ||
        n.toLowerCase().includes(mask.toLowerCase())
    )
  );
}

function trackAllowedBySolo(
  track: TimelineTrackId,
  boneGroups: BoneGroupDef[] | undefined
): boolean {
  const solo = boneGroups?.find((g) => g.solo);
  if (!solo) return true;
  return trackMatchesBoneMask(track, solo.boneNames);
}

function trackMutedByGroup(
  track: TimelineTrackId,
  boneGroups: BoneGroupDef[] | undefined
): boolean {
  if (!boneGroups?.length) return false;
  const muted = boneGroups.filter((g) => g.muted);
  if (muted.length === 0) return false;
  return muted.every((g) => !trackMatchesBoneMask(track, g.boneNames));
}

/**
 * Base clip + weighted additive layers (reze-style stack).
 * Each layer contributes (layerValue - default) * weight on allowed tracks.
 */
export function evaluateTimelineWithLayers(
  baseKeyframes: TimelineKeyframe[],
  layers: AnimationLayerDef[] | undefined,
  frame: number,
  live: TimelineLiveValues,
  boneGroups?: BoneGroupDef[]
): TimelineEvaluated {
  const defaults = buildDefaultsFromLive(live);
  let result = evaluateTimelineAtFrame(baseKeyframes, frame, live);

  for (const track of TIMELINE_TRACK_IDS) {
    if (trackMutedByGroup(track, boneGroups)) {
      result[track] = defaults[track];
    }
  }

  if (!layers?.length) return result;

  for (const layer of layers) {
    if (layer.muted || layer.weight <= 0.001) continue;
    if (!layer.keyframes.length) continue;

    const layerEval = evaluateTimelineAtFrame(layer.keyframes, frame, live);
    const w = Math.min(1, Math.max(0, layer.weight));

    for (const track of TIMELINE_TRACK_IDS) {
      if (!trackMatchesBoneMask(track, layer.boneMask)) continue;
      if (!trackAllowedBySolo(track, boneGroups)) continue;

      const delta = layerEval[track] - defaults[track];
      result = { ...result, [track]: result[track] + delta * w };
    }
  }

  return result;
}

/** Overlay layers only — base motion stays in `model.keyframes`. */
export function createDefaultLayers(_baseKeyframes: TimelineKeyframe[]): AnimationLayerDef[] {
  return [
    {
      id: `layer_${Date.now()}`,
      name: 'Overlay 1',
      weight: 0.5,
      keyframes: [],
      muted: false,
      boneMask: null,
    },
  ];
}
