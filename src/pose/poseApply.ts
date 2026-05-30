import * as THREE from 'three';
import type { BoneState, MorphState } from '../types';
import {
  findBoneByAlias,
  POSE_BONE_ALIASES,
  SIMPLIFIED_BONE_IDS,
  type SimplifiedBoneId,
} from './boneAliases';
import type { PoseBoneRotation, PoseSnapshotV1 } from './poseTypes';

const DEG2RAD = Math.PI / 180;

type RestPoseMap = Record<string, [number, number, number]>;

const MORPH_NAME_CANDIDATES: Record<'eyes' | 'mouth' | 'brow', string[]> = {
  eyes: ['まばたき', 'blink_l', 'blink_r', 'blink', 'eyesblink', 'eyes close'],
  mouth: ['あ', 'mouth_open', 'mouthopen', 'mouth smile', 'lips:a', 'open', 'a'],
  brow: ['困る', 'sad_brow', 'sad', 'browsad', 'troubled', 'brow raise'],
};

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

export interface ApplyPoseOptions {
  /** Skip skirt/hair physics bones (keeps cloth stable). */
  skipBoneNames?: ReadonlySet<string>;
}

function applyBoneRotation(
  bone: THREE.Bone,
  rest: RestPoseMap,
  rot: PoseBoneRotation
): void {
  const base = rest[bone.name] ?? [0, 0, 0];
  bone.rotation.set(
    base[0] + rot.x * DEG2RAD,
    base[1] + rot.y * DEG2RAD,
    base[2] + rot.z * DEG2RAD
  );
}

/**
 * Apply pose to skinned mesh — rest-pose offsets, same as timeline bone path.
 * Does not call physics.reset(); caller should syncSkeletonBeforePhysics after.
 */
export function applyPoseSnapshotToMesh(
  mesh: THREE.SkinnedMesh,
  pose: PoseSnapshotV1,
  options: ApplyPoseOptions = {}
): void {
  const skeleton = mesh.skeleton;
  if (!skeleton) return;

  const rest = (mesh.userData.mmdRestPose as RestPoseMap | undefined) ?? {};
  const skip = options.skipBoneNames;

  if (pose.pmxBones) {
    for (const bone of skeleton.bones) {
      if (skip?.has(bone.name)) continue;
      const rot = pose.pmxBones[bone.name];
      if (!rot) continue;
      applyBoneRotation(bone, rest, rot);
    }
  }

  for (const boneId of SIMPLIFIED_BONE_IDS) {
    const rot = pose.bones[boneId];
    if (!rot) continue;
    const bone = findBoneByAlias(skeleton, boneId);
    if (!bone || skip?.has(bone.name)) continue;
    applyBoneRotation(bone, rest, rot);
  }

  const dict = mesh.morphTargetDictionary;
  const influences = mesh.morphTargetInfluences;
  if (dict && influences) {
    const idxEyes = findMorphIndex(dict, MORPH_NAME_CANDIDATES.eyes);
    if (idxEyes !== -1) influences[idxEyes] = pose.morphs.eyes;

    const idxMouth = findMorphIndex(dict, MORPH_NAME_CANDIDATES.mouth);
    if (idxMouth !== -1) influences[idxMouth] = pose.morphs.mouth;

    const idxBrow = findMorphIndex(dict, MORPH_NAME_CANDIDATES.brow);
    if (idxBrow !== -1) influences[idxBrow] = pose.morphs.brow;
  }

  skeleton.update();
}

export function capturePoseFromModel(
  model: { morphs: MorphState; bones: BoneState[] },
  mesh?: THREE.SkinnedMesh | null,
  name = 'Custom pose'
): PoseSnapshotV1 {
  const bones: Record<string, PoseBoneRotation> = {};

  for (const id of SIMPLIFIED_BONE_IDS) {
    const b = model.bones.find((x) => x.id === id);
    bones[id] = {
      x: b?.rotationX ?? 0,
      y: b?.rotationY ?? 0,
      z: b?.rotationZ ?? 0,
    };
  }

  const pmxBones: Record<string, PoseBoneRotation> = {};
  if (mesh?.skeleton) {
    const rest = (mesh.userData.mmdRestPose as RestPoseMap | undefined) ?? {};
    for (const boneId of SIMPLIFIED_BONE_IDS) {
      const bone = findBoneByAlias(mesh.skeleton, boneId);
      if (!bone) continue;
      const base = rest[bone.name] ?? [0, 0, 0];
      pmxBones[bone.name] = {
        x: (bone.rotation.x - base[0]) / DEG2RAD,
        y: (bone.rotation.y - base[1]) / DEG2RAD,
        z: (bone.rotation.z - base[2]) / DEG2RAD,
      };
    }
  }

  return {
    version: 1,
    id: `pose_${Date.now()}`,
    name,
    thumbnail: '📌',
    morphs: { ...model.morphs },
    bones,
    pmxBones: Object.keys(pmxBones).length ? pmxBones : undefined,
  };
}

export function poseBonesToModelBones(
  poseBones: Record<string, PoseBoneRotation>,
  existing: BoneState[]
): BoneState[] {
  return SIMPLIFIED_BONE_IDS.map((id) => {
    const prev = existing.find((b) => b.id === id);
    const rot = poseBones[id] ?? { x: 0, y: 0, z: 0 };
    const labels: Record<SimplifiedBoneId, string> = {
      head: 'Head Rig',
      neck: 'Neck Rig',
      spine: 'Upper Body',
      waist: 'Hips / Waist',
      arm_L: 'Left Shoulder',
      arm_R: 'Right Shoulder',
    };
    return {
      id,
      name: prev?.name ?? labels[id as SimplifiedBoneId],
      rotationX: rot.x,
      rotationY: rot.y,
      rotationZ: rot.z,
    };
  });
}

/** Collect dynamic bone names from Jolt helper state when available. */
export function collectDynamicBoneNames(
  mesh: THREE.SkinnedMesh,
  getDynamicBoneNames?: () => Set<string>
): Set<string> {
  const out = new Set<string>();
  if (getDynamicBoneNames) {
    for (const n of getDynamicBoneNames()) out.add(n);
  }
  for (const bone of mesh.skeleton?.bones ?? []) {
    if (bone.userData?.hasPhysics) out.add(bone.name);
  }
  return out;
}

export { POSE_BONE_ALIASES };
