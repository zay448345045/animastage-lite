import * as THREE from 'three';
import { Bone } from 'three';
import type { JoltModule } from './joltLoader';
import type { SharedJoltWorld } from './joltSharedWorld';
import {
  applyJoltTransformToBone,
  boneWorldMatrix,
  decomposeToJolt,
  makeBoneOffsetMatrix,
  type JoltSyncBuffers,
} from './joltSharedWorld';
import {
  MMD_BODY_DYNAMIC,
  MMD_BODY_DYNAMIC_ROT,
  MMD_BODY_KINEMATIC,
  MMD_SHAPE_BOX,
  MMD_SHAPE_CAPSULE,
  MMD_SHAPE_SPHERE,
  type MMDRigidBodyDef,
} from './mmdTypes';
import { objectLayerForMmdBody } from './joltCollisionLayers';

const _boneOffset = new THREE.Matrix4();
const _boneOffsetInverse = new THREE.Matrix4();
const _worldMat = new THREE.Matrix4();
const _debugPos = new THREE.Vector3();
const _debugQuat = new THREE.Quaternion();
const _debugScale = new THREE.Vector3(1, 1, 1);
const _savedLocalPos = new THREE.Vector3();
const _savedLocalQuat = new THREE.Quaternion();

export class MMDRigidBodyJolt {
  readonly params: MMDRigidBodyDef;
  readonly bone: Bone;
  readonly bodyId: JoltModule['BodyID'];
  /** Inverse of PMX bone-local rigid-body offset (constant, not tied to world pose). */
  readonly boneOffsetInverse: THREE.Matrix4;

  /** @deprecated Legacy alias for debug helper compatibility */
  get body(): { getCenterOfMassTransform?: () => unknown } {
    return { getCenterOfMassTransform: () => null };
  }

  constructor(
    private readonly mesh: THREE.SkinnedMesh,
    private readonly world: SharedJoltWorld,
    params: MMDRigidBodyDef
  ) {
    this.params = params;
    const bones = mesh.skeleton.bones;
    this.bone = params.boneIndex === -1 ? new Bone() : bones[params.boneIndex];

    const { Jolt, bodyInterface } = world;

    makeBoneOffsetMatrix(params, _boneOffset);
    this.boneOffsetInverse = _boneOffset.clone().invert();

    boneWorldMatrix(this.bone, params, _worldMat);

    const shape = createMmdShape(Jolt, params);
    const pos = new Jolt.RVec3(0, 0, 0);
    const rot = new Jolt.Quat(0, 0, 0, 1);
    decomposeToJolt(Jolt, _worldMat, pos, rot);

    const motionType =
      params.type === MMD_BODY_KINEMATIC
        ? Jolt.EMotionType_Kinematic
        : Jolt.EMotionType_Dynamic;

    const layer = objectLayerForMmdBody(params.type);
    const creation = new Jolt.BodyCreationSettings(shape, pos, rot, motionType, layer);
    Jolt.destroy(pos);
    Jolt.destroy(rot);

    creation.mFriction = params.friction;
    creation.mRestitution = params.restitution;
    creation.mLinearDamping = params.positionDamping;
    creation.mAngularDamping = params.rotationDamping;

    if (params.type !== MMD_BODY_KINEMATIC) {
      creation.mMass = Math.max(params.weight, 0.001);
    } else {
      creation.mMass = 0;
    }

    const body = bodyInterface.CreateBody(creation);
    Jolt.destroy(creation);

    this.bodyId = body.GetID();
    bodyInterface.AddBody(this.bodyId, Jolt.EActivation_Activate);
  }

  reset(): this {
    return this.syncBodyFromBone();
  }

  /** Push current bone pose into Jolt (all body types — matches three-stdlib MMDPhysics.reset). */
  syncBodyFromBone(buffers?: JoltSyncBuffers): this {
    if (this.params.boneIndex === -1) return this;

    const { Jolt, bodyInterface } = this.world;
    if (buffers) {
      boneWorldMatrix(this.bone, this.params, _worldMat);
      decomposeToJolt(Jolt, _worldMat, buffers.pos, buffers.rot);
      bodyInterface.SetPositionAndRotation(
        this.bodyId,
        buffers.pos,
        buffers.rot,
        this.params.type === MMD_BODY_KINEMATIC
          ? Jolt.EActivation_DontActivate
          : Jolt.EActivation_Activate
      );
      return this;
    }

    boneWorldMatrix(this.bone, this.params, _worldMat);
    const pos = new Jolt.RVec3(0, 0, 0);
    const rot = new Jolt.Quat(0, 0, 0, 1);
    decomposeToJolt(Jolt, _worldMat, pos, rot);
    bodyInterface.SetPositionAndRotation(
      this.bodyId,
      pos,
      rot,
      this.params.type === MMD_BODY_KINEMATIC
        ? Jolt.EActivation_DontActivate
        : Jolt.EActivation_Activate
    );
    Jolt.destroy(pos);
    Jolt.destroy(rot);
    return this;
  }

  /** Phase 1: kinematic bodies only. */
  syncKinematicToJolt(buffers: JoltSyncBuffers): this {
    if (this.params.boneIndex === -1 || this.params.type !== MMD_BODY_KINEMATIC) {
      return this;
    }
    return this.syncBodyFromBone(buffers);
  }

  /** Phase 3: Jolt dynamic body -> bone local transform. */
  syncDynamicFromJolt(buffers: JoltSyncBuffers): this {
    if (this.params.type === MMD_BODY_KINEMATIC || this.params.boneIndex === -1) {
      return this;
    }

    const { Jolt, bodyInterface } = this.world;
    bodyInterface.GetPositionAndRotation(this.bodyId, buffers.pos, buffers.rot);

    if (!isValidJoltTransform(buffers.pos, buffers.rot)) {
      return this;
    }

    _savedLocalPos.copy(this.bone.position);
    _savedLocalQuat.copy(this.bone.quaternion);

    applyJoltTransformToBone(
      this.bone,
      this.boneOffsetInverse,
      buffers.pos,
      buffers.rot,
      this.params.type,
      true
    );

    if (!isValidBoneLocalTransform(this.bone)) {
      this.bone.position.copy(_savedLocalPos);
      this.bone.quaternion.copy(_savedLocalQuat);
      return this;
    }

    if (this.params.type === MMD_BODY_DYNAMIC_ROT) {
      this.syncPositionFromBone(buffers);
    }

    this.bone.updateMatrixWorld(true);
    return this;
  }

  updateFromBone(): this {
    return this.syncBodyFromBone();
  }

  updateBone(): this {
    if (this.params.type === MMD_BODY_KINEMATIC || this.params.boneIndex === -1) {
      return this;
    }

    const { Jolt, bodyInterface } = this.world;
    const pos = new Jolt.RVec3(0, 0, 0);
    const rot = new Jolt.Quat(0, 0, 0, 1);
    bodyInterface.GetPositionAndRotation(this.bodyId, pos, rot);

    applyJoltTransformToBone(
      this.bone,
      this.boneOffsetInverse,
      pos,
      rot,
      this.params.type
    );

    if (this.params.type === MMD_BODY_DYNAMIC_ROT) {
      bodyInterface.GetPositionAndRotation(this.bodyId, pos, rot);
      boneWorldMatrix(this.bone, this.params, _worldMat);
      _worldMat.decompose(_debugPos, _debugQuat, _debugScale);
      pos.Set(_debugPos.x, _debugPos.y, _debugPos.z);
      bodyInterface.SetPositionAndRotation(
        this.bodyId,
        pos,
        rot,
        Jolt.EActivation_Activate
      );
    }

    this.bone.updateMatrixWorld(true);
    Jolt.destroy(pos);
    Jolt.destroy(rot);
    return this;
  }

  /** Type-2 bodies: keep physics rotation, snap position to bone. */
  syncPositionFromBone(buffers: JoltSyncBuffers): this {
    if (this.params.boneIndex === -1) return this;

    const { Jolt, bodyInterface } = this.world;
    bodyInterface.GetPositionAndRotation(this.bodyId, buffers.pos, buffers.rot);

    boneWorldMatrix(this.bone, this.params, _worldMat);
    _worldMat.decompose(_debugPos, _debugQuat, _debugScale);
    buffers.pos.Set(_debugPos.x, _debugPos.y, _debugPos.z);

    bodyInterface.SetPositionAndRotation(
      this.bodyId,
      buffers.pos,
      buffers.rot,
      Jolt.EActivation_Activate
    );
    return this;
  }

  dispose(): void {
    const { Jolt, bodyInterface } = this.world;
    if (bodyInterface.IsAdded(this.bodyId)) {
      bodyInterface.RemoveBody(this.bodyId);
    }
    bodyInterface.DestroyBody(this.bodyId);
  }

  getDebugMatrix(target: THREE.Matrix4, buffers: JoltSyncBuffers): THREE.Matrix4 {
    const { bodyInterface } = this.world;
    bodyInterface.GetPositionAndRotation(this.bodyId, buffers.pos, buffers.rot);
    _debugPos.set(buffers.pos.GetX(), buffers.pos.GetY(), buffers.pos.GetZ());
    _debugQuat.set(
      buffers.rot.GetX(),
      buffers.rot.GetY(),
      buffers.rot.GetZ(),
      buffers.rot.GetW()
    );
    return target.compose(_debugPos, _debugQuat, _debugScale);
  }

  /** Read current center-of-mass world position for this body into a THREE.Vector3. */
  getCenterOfMass(buffers: JoltSyncBuffers, out: THREE.Vector3): THREE.Vector3 {
    const { bodyInterface } = this.world;
    bodyInterface.GetPositionAndRotation(this.bodyId, buffers.pos, buffers.rot);
    out.set(buffers.pos.GetX(), buffers.pos.GetY(), buffers.pos.GetZ());
    return out;
  }
}

function createMmdShape(Jolt: JoltModule, params: MMDRigidBodyDef): JoltModule['Shape'] {
  switch (params.shapeType) {
    case MMD_SHAPE_SPHERE:
      return new Jolt.SphereShape(Math.max(params.width, 0.01), null);
    case MMD_SHAPE_BOX: {
      const he = new Jolt.Vec3(
        Math.max(params.width, 0.01),
        Math.max(params.height, 0.01),
        Math.max(params.depth, 0.01)
      );
      const shape = new Jolt.BoxShape(he, 0.05, null);
      Jolt.destroy(he);
      return shape;
    }
    case MMD_SHAPE_CAPSULE: {
      const radius = Math.max(params.width, 0.01);
      const halfHeight = Math.max(params.height * 0.5, 0.01);
      return new Jolt.CapsuleShape(halfHeight, radius, null);
    }
    default:
      return new Jolt.SphereShape(0.5, null);
  }
}

export function createMmdDebugGeometry(params: MMDRigidBodyDef): THREE.BufferGeometry {
  switch (params.shapeType) {
    case MMD_SHAPE_SPHERE:
      return new THREE.SphereGeometry(params.width, 8, 8);
    case MMD_SHAPE_BOX:
      return new THREE.BoxGeometry(params.width * 2, params.height * 2, params.depth * 2);
    case MMD_SHAPE_CAPSULE:
      return new THREE.CapsuleGeometry(params.width, params.height, 4, 8);
    default:
      return new THREE.SphereGeometry(0.5, 8, 8);
  }
}

/** @deprecated unused export guard */
export { MMD_BODY_DYNAMIC, MMD_BODY_DYNAMIC_ROT };

function isValidJoltTransform(
  position: { GetX(): number; GetY(): number; GetZ(): number },
  rotation: { GetX(): number; GetY(): number; GetZ(): number; GetW(): number }
): boolean {
  const values = [
    position.GetX(),
    position.GetY(),
    position.GetZ(),
    rotation.GetX(),
    rotation.GetY(),
    rotation.GetZ(),
    rotation.GetW(),
  ];
  for (const value of values) {
    if (!Number.isFinite(value) || Math.abs(value) > 1e5) {
      return false;
    }
  }
  return true;
}

function isValidBoneLocalTransform(bone: THREE.Bone): boolean {
  const values = [
    bone.position.x,
    bone.position.y,
    bone.position.z,
    bone.quaternion.x,
    bone.quaternion.y,
    bone.quaternion.z,
    bone.quaternion.w,
  ];
  for (const value of values) {
    if (!Number.isFinite(value) || Math.abs(value) > 1e5) {
      return false;
    }
  }
  return true;
}
