import type { BoneState, MorphState, TimelineTrackId } from '../types';

export const TIMELINE_TRACK_IDS = [
  'morph_eyes',
  'morph_mouth',
  'morph_brow',
  'bone_head_y',
  'bone_neck_x',
  'bone_spine_y',
  'bone_spine_z',
  'bone_waist_y',
  'bone_l_arm_x',
  'bone_l_arm_z',
  'bone_r_arm_x',
  'bone_r_arm_z',
] as const satisfies readonly TimelineTrackId[];

export type TimelineEvaluated = Record<TimelineTrackId, number>;

export interface TimelineLiveValues {
  morphs: MorphState;
  boneHeadY: number;
  boneNeckX: number;
  boneSpineY: number;
  boneSpineZ: number;
  boneWaistY: number;
  boneArmLX: number;
  boneArmLZ: number;
  boneArmRX: number;
  boneArmRZ: number;
}

export const MORPH_NAME_CANDIDATES: Record<'eyes' | 'mouth' | 'brow', string[]> = {
  eyes: ['まばたき', 'blink_l', 'blink_r', 'blink', 'eyesblink', 'eyes close'],
  mouth: ['あ', 'mouth_open', 'mouthopen', 'mouth smile', 'lips:a', 'open', 'a'],
  brow: ['困る', 'sad_brow', 'sad', 'browsad', 'troubled', 'brow raise'],
};

export const BONE_TRACK_BINDINGS: Record<
  Exclude<TimelineTrackId, 'morph_eyes' | 'morph_mouth' | 'morph_brow'>,
  { axis: 'x' | 'y' | 'z'; candidates: string[] }
> = {
  bone_head_y: { axis: 'y', candidates: ['頭', 'head', 'Head', 'HEAD'] },
  bone_neck_x: { axis: 'x', candidates: ['首', 'neck', 'Neck', 'NECK'] },
  bone_spine_y: { axis: 'y', candidates: ['上半身', 'upper body', 'upperbody', 'spine'] },
  bone_spine_z: { axis: 'z', candidates: ['上半身', 'upper body', 'upperbody', 'spine'] },
  bone_waist_y: { axis: 'y', candidates: ['下半身', 'lower body', 'lowerbody', 'waist', 'pelvis'] },
  bone_l_arm_x: { axis: 'x', candidates: ['左肩', 'left shoulder', 'leftshoulder'] },
  bone_l_arm_z: { axis: 'z', candidates: ['左腕', 'leftarm', 'left arm'] },
  bone_r_arm_x: { axis: 'x', candidates: ['右肩', 'right shoulder', 'rightshoulder'] },
  bone_r_arm_z: { axis: 'z', candidates: ['右腕', 'rightarm', 'right arm'] },
};

function findBoneInList(bones: BoneState[], id: string): BoneState | undefined {
  return bones.find((b) => b.id === id);
}

export function buildDefaultsFromLive(live: TimelineLiveValues): TimelineEvaluated {
  return {
    morph_eyes: live.morphs.eyes,
    morph_mouth: live.morphs.mouth,
    morph_brow: live.morphs.brow,
    bone_head_y: live.boneHeadY,
    bone_neck_x: live.boneNeckX,
    bone_spine_y: live.boneSpineY,
    bone_spine_z: live.boneSpineZ,
    bone_waist_y: live.boneWaistY,
    bone_l_arm_x: live.boneArmLX,
    bone_l_arm_z: live.boneArmLZ,
    bone_r_arm_x: live.boneArmRX,
    bone_r_arm_z: live.boneArmRZ,
  };
}

export function getDefaultLiveValues(bones: BoneState[], morphs: MorphState): TimelineLiveValues {
  const head = findBoneInList(bones, 'head');
  const neck = findBoneInList(bones, 'neck');
  const spine = findBoneInList(bones, 'spine');
  const waist = findBoneInList(bones, 'waist');
  const armL = findBoneInList(bones, 'arm_L');
  const armR = findBoneInList(bones, 'arm_R');

  return {
    morphs: { ...morphs },
    boneHeadY: head?.rotationY ?? 0,
    boneNeckX: neck?.rotationX ?? 0,
    boneSpineY: spine?.rotationY ?? 0,
    boneSpineZ: spine?.rotationZ ?? 0,
    boneWaistY: waist?.rotationY ?? 0,
    boneArmLX: armL?.rotationX ?? 0,
    boneArmLZ: armL?.rotationZ ?? 0,
    boneArmRX: armR?.rotationX ?? 0,
    boneArmRZ: armR?.rotationZ ?? 0,
  };
}
