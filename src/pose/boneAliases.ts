import * as THREE from 'three';

/** Shared with timeline / gizmo — maps editor bone ids to PMX names. */
export const POSE_BONE_ALIASES: Record<string, string[]> = {
  head: ['頭', 'head', 'Head', 'HEAD', '頭点'],
  neck: ['首', 'neck', 'Neck', 'NECK'],
  spine: ['上半身', '上半身2', 'spine', 'センター', 'center', 'Center'],
  waist: ['下半身', 'hip', 'Hips', 'hips', 'waist', 'pelvis'],
  arm_L: ['左肩', '左腕', 'left shoulder', 'LeftShoulder', '左ひじ', '左肘'],
  arm_R: ['右肩', '右腕', 'right shoulder', 'RightShoulder', '右ひじ', '右肘'],
};

export const SIMPLIFIED_BONE_IDS = [
  'head',
  'neck',
  'spine',
  'waist',
  'arm_L',
  'arm_R',
] as const;

export type SimplifiedBoneId = (typeof SIMPLIFIED_BONE_IDS)[number];

export function findBoneByAlias(
  skeleton: THREE.Skeleton,
  boneId: string
): THREE.Bone | null {
  if (!boneId) return null;

  const direct = skeleton.bones.find(
    (b) => b.name === boneId || b.name.toLowerCase() === boneId.toLowerCase()
  );
  if (direct) return direct;

  const aliases = POSE_BONE_ALIASES[boneId];
  if (aliases) {
    for (const alias of aliases) {
      const found = skeleton.bones.find(
        (b) =>
          b.name === alias ||
          b.name.toLowerCase() === alias.toLowerCase() ||
          b.name.includes(alias)
      );
      if (found) return found;
    }
  }

  return (
    skeleton.bones.find(
      (b) =>
        b.name.toLowerCase().includes(boneId.toLowerCase()) ||
        boneId.toLowerCase().includes(b.name.toLowerCase())
    ) ?? null
  );
}
