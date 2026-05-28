import * as THREE from 'three';
import { Bone } from 'three';
import { applyJoltFloatsToBone } from './joltSharedWorld';
import { JOLT_POSE_STRIDE } from './joltWorkerProtocol';
import {
  MMD_BODY_DYNAMIC_ROT,
  MMD_BODY_KINEMATIC,
  type MMDRigidBodyDef,
} from './mmdTypes';
import { boneWorldMatrix } from './joltSharedWorld';

const _worldMat = new THREE.Matrix4();

export interface MmdDynamicBodySlot {
  bone: Bone;
  boneOffsetInverse: THREE.Matrix4;
  mmdType: number;
}

export interface MmdPhysicsBodyMapping {
  params: MMDRigidBodyDef;
  bone: Bone;
  boneOffsetInverse: THREE.Matrix4;
  isKinematic: boolean;
  /** Index in dynamic output buffer (× {@link JOLT_POSE_STRIDE}), or -1 */
  dynamicSlot: number;
  /** Index in kinematic input pack (× {@link JOLT_POSE_STRIDE}), or -1 */
  kinematicSlot: number;
}

/** Build main-thread body mappings (no Jolt WASM bodies required for worker mode). */
export function buildMmdPhysicsBodyMappings(
  mesh: THREE.SkinnedMesh,
  rigidBodyParams: MMDRigidBodyDef[]
): MmdPhysicsBodyMapping[] {
  const bones = mesh.skeleton.bones;
  const mappings: MmdPhysicsBodyMapping[] = [];
  let kinematicSlot = 0;
  let dynamicSlot = 0;

  for (const params of rigidBodyParams) {
    const bone = params.boneIndex === -1 ? new Bone() : bones[params.boneIndex];
    const boneOffset = new THREE.Matrix4();
    boneOffset.makeRotationFromEuler(
      new THREE.Euler(params.rotation[0], params.rotation[1], params.rotation[2], 'XYZ')
    );
    boneOffset.setPosition(params.position[0], params.position[1], params.position[2]);
    const boneOffsetInverse = boneOffset.clone().invert();

    const isKinematic = params.type === MMD_BODY_KINEMATIC;
    mappings.push({
      params,
      bone,
      boneOffsetInverse,
      isKinematic,
      kinematicSlot: isKinematic ? kinematicSlot++ : -1,
      dynamicSlot: isKinematic ? -1 : dynamicSlot++,
    });
  }

  return mappings;
}

/** Pack all body world COM poses into a flat buffer (for worker INIT / RESET). */
export function packAllBodyPoses(
  mappings: MmdPhysicsBodyMapping[],
  out: Float32Array,
  mesh: THREE.SkinnedMesh
): void {
  mesh.updateMatrixWorld(true);
  if (mesh.skeleton) {
    for (const bone of mesh.skeleton.bones) {
      bone.updateMatrixWorld(true);
    }
  }

  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i];
    const o = i * JOLT_POSE_STRIDE;
    if (m.params.boneIndex === -1) {
      out[o] = m.params.position[0];
      out[o + 1] = m.params.position[1];
      out[o + 2] = m.params.position[2];
      _decomposeQuat.setFromEuler(
        _decomposeEuler.set(m.params.rotation[0], m.params.rotation[1], m.params.rotation[2], 'XYZ')
      );
      out[o + 3] = _decomposeQuat.x;
      out[o + 4] = _decomposeQuat.y;
      out[o + 5] = _decomposeQuat.z;
      out[o + 6] = _decomposeQuat.w;
      continue;
    }
    boneWorldMatrix(m.bone, m.params, _worldMat);
    _worldMat.decompose(_decomposePos, _decomposeQuat, _decomposeScale);
    out[o] = _decomposePos.x;
    out[o + 1] = _decomposePos.y;
    out[o + 2] = _decomposePos.z;
    out[o + 3] = _decomposeQuat.x;
    out[o + 4] = _decomposeQuat.y;
    out[o + 5] = _decomposeQuat.z;
    out[o + 6] = _decomposeQuat.w;
  }
}

const _decomposePos = new THREE.Vector3();
const _decomposeQuat = new THREE.Quaternion();
const _decomposeScale = new THREE.Vector3(1, 1, 1);
const _decomposeEuler = new THREE.Euler();

/** Pack kinematic body poses for worker SYNC (zero new objects). */
export function packKinematicBodyPoses(
  mappings: MmdPhysicsBodyMapping[],
  out: Float32Array,
  mesh: THREE.SkinnedMesh
): void {
  mesh.updateMatrixWorld(true);

  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i];
    if (!m.isKinematic || m.params.boneIndex === -1) continue;
    m.bone.updateMatrixWorld(true);
    boneWorldMatrix(m.bone, m.params, _worldMat);
    _worldMat.decompose(_decomposePos, _decomposeQuat, _decomposeScale);
    const o = m.kinematicSlot * JOLT_POSE_STRIDE;
    out[o] = _decomposePos.x;
    out[o + 1] = _decomposePos.y;
    out[o + 2] = _decomposePos.z;
    out[o + 3] = _decomposeQuat.x;
    out[o + 4] = _decomposeQuat.y;
    out[o + 5] = _decomposeQuat.z;
    out[o + 6] = _decomposeQuat.w;
  }
}

/** Apply transferable worker buffer to dynamic bones — zero allocations. */
export function applyDynamicPhysicsBuffer(
  buffer: Float32Array,
  dynamicSlots: readonly MmdDynamicBodySlot[]
): void {
  const count = dynamicSlots.length;
  for (let i = 0; i < count; i++) {
    const slot = dynamicSlots[i];
    const offset = i * JOLT_POSE_STRIDE;
    applyJoltFloatsToBone(
      slot.bone,
      slot.boneOffsetInverse,
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      buffer[offset + 3],
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      slot.mmdType,
      true
    );
    if (slot.mmdType === MMD_BODY_DYNAMIC_ROT) {
      // Type-2: rotation from physics, position stays on bone — already on bone from bind/anim
    }
  }
}

export function buildDynamicBodySlots(mappings: MmdPhysicsBodyMapping[]): MmdDynamicBodySlot[] {
  const slots: MmdDynamicBodySlot[] = [];
  for (const m of mappings) {
    if (m.isKinematic || m.params.boneIndex === -1) continue;
    slots.push({
      bone: m.bone,
      boneOffsetInverse: m.boneOffsetInverse,
      mmdType: m.params.type,
    });
  }
  return slots;
}
