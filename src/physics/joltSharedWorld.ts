import * as THREE from 'three';
import type { JoltModule } from './joltLoader';
import { getJolt } from './joltLoader';
import { LAYER_STATIC, setupJoltCollisionLayers } from './joltCollisionLayers';
import { MMD_BODY_DYNAMIC, MMD_BODY_KINEMATIC } from './mmdTypes';

export interface SharedJoltWorld {
  Jolt: JoltModule;
  joltInterface: JoltModule['JoltInterface'];
  physicsSystem: JoltModule['PhysicsSystem'];
  bodyInterface: JoltModule['BodyInterface'];
}

let sharedWorld: SharedJoltWorld | null = null;
let refCount = 0;

let stepScheduled = false;
let stepDelta = 0;

/** Reset step guard at the start of each render frame (priority hook in Viewport). */
export function resetJoltStepGuard(): void {
  stepScheduled = false;
  stepDelta = 0;
}

/** Reusable Jolt WASM transform buffers (one set per physics instance). */
export class JoltSyncBuffers {
  readonly pos: JoltModule['RVec3'];
  readonly rot: JoltModule['Quat'];
  readonly vec3: JoltModule['Vec3'];

  constructor(Jolt: JoltModule) {
    this.pos = new Jolt.RVec3(0, 0, 0);
    this.rot = new Jolt.Quat(0, 0, 0, 1);
    this.vec3 = new Jolt.Vec3(0, 0, 0);
  }

  dispose(Jolt: JoltModule): void {
    Jolt.destroy(this.pos);
    Jolt.destroy(this.rot);
    Jolt.destroy(this.vec3);
  }
}

/**
 * Fixed-timestep sub-stepping for the shared Jolt world (at most once per render frame).
 * Mirrors MMD/Ammo `stepSimulation(stepTime, maxStepNum, unitStep)`.
 */
export function stepSharedJoltWorld(
  delta: number,
  unitStep = 1 / 60,
  maxStepNum = 4
): void {
  if (!sharedWorld || delta <= 0) return;
  stepDelta = Math.max(stepDelta, delta);
  if (stepScheduled) return;

  const { joltInterface } = sharedWorld;
  let stepTime = stepDelta;
  let numSteps = (stepDelta / unitStep) | 0;
  if (numSteps < 1) {
    stepTime = unitStep;
    numSteps = 1;
  }
  if (numSteps > maxStepNum) {
    numSteps = maxStepNum;
    stepTime = unitStep * numSteps;
  }

  joltInterface.Step(stepTime, numSteps);
  stepScheduled = true;
}

/** Single fixed sub-step — safe to call in a loop (physics accumulator). */
export function stepSharedJoltWorldSubstep(unitStep = 1 / 60): void {
  if (!sharedWorld) return;
  sharedWorld.joltInterface.Step(unitStep, 1);
}

export function acquireSharedJoltWorld(): SharedJoltWorld {
  if (sharedWorld) {
    refCount++;
    return sharedWorld;
  }

  const Jolt = getJolt();
  const settings = new Jolt.JoltSettings();
  // 0 = no Emscripten pthread workers (avoids 200–700ms main-thread "message" handlers per step).
  settings.mMaxWorkerThreads = 0;

  const layers = setupJoltCollisionLayers(Jolt);
  settings.mObjectLayerPairFilter = layers.objectFilter;
  settings.mBroadPhaseLayerInterface = layers.bpInterface;
  settings.mObjectVsBroadPhaseLayerFilter = layers.objectVsBp;

  const joltInterface = new Jolt.JoltInterface(settings);
  Jolt.destroy(settings);

  const physicsSystem = joltInterface.GetPhysicsSystem();
  const bodyInterface = physicsSystem.GetBodyInterface();

  sharedWorld = { Jolt, joltInterface, physicsSystem, bodyInterface };
  refCount = 1;

  ensureStaticFloor(sharedWorld);

  return sharedWorld;
}

export function releaseSharedJoltWorld(): void {
  if (!sharedWorld) return;
  refCount--;
  if (refCount > 0) return;

  const { Jolt, bodyInterface, joltInterface } = sharedWorld;
  if (floorBodyId !== null) {
    bodyInterface.RemoveBody(floorBodyId);
    bodyInterface.DestroyBody(floorBodyId);
    floorBodyId = null;
  }

  Jolt.destroy(joltInterface);
  sharedWorld = null;
  refCount = 0;
}

let floorBodyId: JoltModule['BodyID'] | null = null;

function ensureStaticFloor(world: SharedJoltWorld): void {
  if (floorBodyId !== null) return;

  const { Jolt, bodyInterface } = world;
  const halfExtent = new Jolt.Vec3(50, 0.5, 50);
  const shape = new Jolt.BoxShape(halfExtent, 0.05, null);
  Jolt.destroy(halfExtent);

  const pos = new Jolt.RVec3(0, -0.5, 0);
  const rot = new Jolt.Quat(0, 0, 0, 1);
  const settings = new Jolt.BodyCreationSettings(
    shape,
    pos,
    rot,
    Jolt.EMotionType_Static,
    LAYER_STATIC
  );
  Jolt.destroy(pos);
  Jolt.destroy(rot);

  const body = bodyInterface.CreateBody(settings);
  Jolt.destroy(settings);
  bodyInterface.AddBody(body.GetID(), Jolt.EActivation_DontActivate);
  floorBodyId = body.GetID();
}

const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();
const _quat2 = new THREE.Quaternion();
const _quat3 = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3(1, 1, 1);
const _boneOffset = new THREE.Matrix4();
const _boneWorld = new THREE.Matrix4();
const _worldTransform = new THREE.Matrix4();
const _parentWorldInv = new THREE.Matrix4();
const SOFT_PHYSICS_SYNC_FACTOR = 0.25;
const SPIN_LOCK_THRESHOLD_RAD = THREE.MathUtils.degToRad(170 / 60);

/** PMX rigid-body offset in bone-local space (position + rotation from PMX). */
export function makeBoneOffsetMatrix(
  params: { position: number[]; rotation: number[] },
  target: THREE.Matrix4
): THREE.Matrix4 {
  target.makeRotationFromEuler(
    _euler.set(params.rotation[0], params.rotation[1], params.rotation[2], 'XYZ')
  );
  target.setPosition(params.position[0], params.position[1], params.position[2]);
  return target;
}

export function boneWorldMatrix(
  bone: THREE.Bone,
  params: { position: number[]; rotation: number[] },
  target: THREE.Matrix4
): THREE.Matrix4 {
  makeBoneOffsetMatrix(params, _boneOffset);
  return target.copy(bone.matrixWorld).multiply(_boneOffset);
}

export function decomposeToJolt(
  Jolt: JoltModule,
  matrix: THREE.Matrix4,
  outPos: JoltModule['RVec3'],
  outRot: JoltModule['Quat']
): void {
  matrix.decompose(_pos, _quat, _scale);
  outPos.Set(_pos.x, _pos.y, _pos.z);
  outRot.Set(_quat.x, _quat.y, _quat.z, _quat.w);
}

/** World position + rotation of a bone (without rigid-body offset). */
export function boneWorldTransform(
  bone: THREE.Bone,
  outPos: THREE.Vector3,
  outQuat: THREE.Quaternion
): void {
  bone.getWorldPosition(outPos);
  bone.getWorldQuaternion(outQuat);
}

export function applyJoltTransformToBone(
  bone: THREE.Bone,
  boneOffsetInverse: THREE.Matrix4,
  position: { GetX(): number; GetY(): number; GetZ(): number },
  rotation: { GetX(): number; GetY(): number; GetZ(): number; GetW(): number },
  mmdType: number,
  smooth = false
): void {
  _worldTransform.compose(
    _pos.set(position.GetX(), position.GetY(), position.GetZ()),
    _quat.set(rotation.GetX(), rotation.GetY(), rotation.GetZ(), rotation.GetW()),
    _scale
  );
  _worldTransform.multiply(boneOffsetInverse);
  _worldTransform.decompose(_pos, _quat, _scale);

  _quat2.setFromRotationMatrix(bone.matrixWorld).invert();
  _quat3.setFromRotationMatrix(bone.matrix);
  const targetQuat = _quat2.multiply(_quat).multiply(_quat3).normalize();

  let alpha = 1;
  if (smooth && mmdType !== MMD_BODY_KINEMATIC) {
    const angle = bone.quaternion.angleTo(targetQuat);
    alpha = SOFT_PHYSICS_SYNC_FACTOR * (angle > SPIN_LOCK_THRESHOLD_RAD ? SPIN_LOCK_THRESHOLD_RAD / angle : 1);
    alpha = Math.min(1, Math.max(0, alpha));
    bone.quaternion.slerp(targetQuat, alpha);
  } else {
    bone.quaternion.copy(targetQuat);
  }

  if (mmdType === MMD_BODY_DYNAMIC) {
    if (bone.parent) {
      _parentWorldInv.copy(bone.parent.matrixWorld).invert();
      _pos.applyMatrix4(_parentWorldInv);
    }
    if (smooth) {
      bone.position.lerp(_pos, alpha);
    } else {
      bone.position.copy(_pos);
    }
  }
}

/** Zero-allocation path for worker {@link Float32Array} readback. */
export function applyJoltFloatsToBone(
  bone: THREE.Bone,
  boneOffsetInverse: THREE.Matrix4,
  px: number,
  py: number,
  pz: number,
  qx: number,
  qy: number,
  qz: number,
  qw: number,
  mmdType: number,
  smooth = false
): void {
  _worldTransform.compose(
    _pos.set(px, py, pz),
    _quat.set(qx, qy, qz, qw),
    _scale
  );
  _worldTransform.multiply(boneOffsetInverse);
  _worldTransform.decompose(_pos, _quat, _scale);

  _quat2.setFromRotationMatrix(bone.matrixWorld).invert();
  _quat3.setFromRotationMatrix(bone.matrix);
  const targetQuat = _quat2.multiply(_quat).multiply(_quat3).normalize();

  let alpha = 1;
  if (smooth && mmdType !== MMD_BODY_KINEMATIC) {
    const angle = bone.quaternion.angleTo(targetQuat);
    alpha = SOFT_PHYSICS_SYNC_FACTOR * (angle > SPIN_LOCK_THRESHOLD_RAD ? SPIN_LOCK_THRESHOLD_RAD / angle : 1);
    alpha = Math.min(1, Math.max(0, alpha));
    bone.quaternion.slerp(targetQuat, alpha);
  } else {
    bone.quaternion.copy(targetQuat);
  }

  if (mmdType === MMD_BODY_DYNAMIC) {
    if (bone.parent) {
      _parentWorldInv.copy(bone.parent.matrixWorld).invert();
      _pos.applyMatrix4(_parentWorldInv);
    }
    if (smooth) {
      bone.position.lerp(_pos, alpha);
    } else {
      bone.position.copy(_pos);
    }
  }
}
