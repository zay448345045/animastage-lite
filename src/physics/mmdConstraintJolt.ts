import * as THREE from 'three';
import type { JoltModule } from './joltLoader';
import type { SharedJoltWorld } from './joltSharedWorld';
import { safeJoltDestroy } from './joltWasmSafe';
import {
  validateMmdConstraintDef,
  type MmdConstraintValidationResult,
} from './mmdConstraintValidation';
import type { MMDConstraintDef } from './mmdTypes';
import type { MMDRigidBodyJolt } from './mmdRigidBodyJolt';

const _worldA = new THREE.Matrix4();
const _worldB = new THREE.Matrix4();
const _constraintLocal = new THREE.Matrix4();
const _invA = new THREE.Matrix4();
const _invB = new THREE.Matrix4();
const _frameA = new THREE.Matrix4();
const _frameB = new THREE.Matrix4();
const _euler = new THREE.Euler();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _axisX = new THREE.Vector3();
const _axisY = new THREE.Vector3();
const _joltPos = { x: 0, y: 0, z: 0 };
const _joltRot = { x: 0, y: 0, z: 0, w: 1 };

type JoltVec3Like = { Set(x: number, y: number, z: number): void };

export class MMDConstraintJolt {
  readonly constraint: JoltModule['TwoBodyConstraint'];

  private constructor(
    private readonly world: SharedJoltWorld,
    constraint: JoltModule['TwoBodyConstraint']
  ) {
    this.constraint = constraint;
  }

  static validate(
    params: MMDConstraintDef,
    bodyA: MMDRigidBodyJolt | undefined,
    bodyB: MMDRigidBodyJolt | undefined,
    bodyCount: number,
    isBodyAdded?: (bodyId: unknown) => boolean
  ): MmdConstraintValidationResult {
    return validateMmdConstraintDef(params, {
      bodyCount,
      bodyA,
      bodyB,
      isBodyAdded,
    });
  }

  /**
   * Creates a constraint or returns null when PMX data / Jolt rejects it.
   * Writes directly into settings-owned vectors (no extra RVec3/Vec3 allocs).
   */
  static tryCreate(
    world: SharedJoltWorld,
    bodyA: MMDRigidBodyJolt | undefined,
    bodyB: MMDRigidBodyJolt | undefined,
    params: MMDConstraintDef,
    bodyCount: number
  ): MMDConstraintJolt | null {
    const { Jolt, physicsSystem, bodyInterface } = world;
    const label = params.name ?? params.englishName ?? `#${params.rigidBodyIndex1}-${params.rigidBodyIndex2}`;

    const validation = MMDConstraintJolt.validate(
      params,
      bodyA,
      bodyB,
      bodyCount,
      (bodyId) => bodyInterface.IsAdded(bodyId)
    );

    if (!validation.ok || !validation.params || !bodyA || !bodyB) {
      console.warn('[MMD Jolt] Constraint skipped:', label, validation.reason ?? 'validation failed');
      return null;
    }

    const safeParams = validation.params;
    let settings: JoltModule['SixDOFConstraintSettings'] | null = null;

    try {
      if (!_buildConstraintFrames(world, bodyA, bodyB, safeParams, _frameA, _frameB)) {
        console.warn('[MMD Jolt] Constraint skipped:', label, 'invalid constraint frame');
        return null;
      }

      _frameA.decompose(_pos, _quat, _scale);
      if (!_normalizeQuaternion(_quat)) {
        console.warn('[MMD Jolt] Constraint skipped:', label, 'invalid frame A rotation');
        return null;
      }

      settings = new Jolt.SixDOFConstraintSettings();
      settings.mSpace = Jolt.EConstraintSpace_LocalToBodyCOM;
      settings.mPosition1.Set(_pos.x, _pos.y, _pos.z);
      _writeConstraintAxes(settings.mAxisX1, settings.mAxisY1, _quat);

      _frameB.decompose(_pos, _quat, _scale);
      if (!_normalizeQuaternion(_quat)) {
        console.warn('[MMD Jolt] Constraint skipped:', label, 'invalid frame B rotation');
        return null;
      }

      settings.mPosition2.Set(_pos.x, _pos.y, _pos.z);
      _writeConstraintAxes(settings.mAxisX2, settings.mAxisY2, _quat);

      applyAxisLimits(Jolt, settings, safeParams);
      applyAxisSprings(Jolt, settings, safeParams);

      const constraint = bodyInterface.CreateConstraint(
        settings,
        bodyA.bodyId,
        bodyB.bodyId
      ) as JoltModule['TwoBodyConstraint'] | null;

      safeJoltDestroy(Jolt, settings);
      settings = null;

      if (!constraint) {
        console.warn('[MMD Jolt] Constraint skipped:', label, 'CreateConstraint returned null');
        return null;
      }

      physicsSystem.AddConstraint(constraint);
      return new MMDConstraintJolt(world, constraint);
    } catch (error) {
      console.warn('[MMD Jolt] Constraint skipped:', label, error);
      return null;
    } finally {
      if (settings) {
        safeJoltDestroy(Jolt, settings);
      }
    }
  }

  dispose(): void {
    const { Jolt, physicsSystem } = this.world;
    try {
      physicsSystem.RemoveConstraint(this.constraint);
    } catch {
      // Constraint may already be removed with the body/world.
    }
    safeJoltDestroy(Jolt, this.constraint);
  }
}

function _writeConstraintAxes(
  axisX: JoltVec3Like,
  axisY: JoltVec3Like,
  quaternion: THREE.Quaternion
): void {
  _axisX.set(1, 0, 0).applyQuaternion(quaternion).normalize();
  _axisY.set(0, 1, 0).applyQuaternion(quaternion).normalize();
  axisX.Set(_axisX.x, _axisX.y, _axisX.z);
  axisY.Set(_axisY.x, _axisY.y, _axisY.z);
}

function _buildConstraintFrames(
  world: SharedJoltWorld,
  bodyA: MMDRigidBodyJolt,
  bodyB: MMDRigidBodyJolt,
  params: MMDConstraintDef,
  outFrameA: THREE.Matrix4,
  outFrameB: THREE.Matrix4
): boolean {
  _constraintLocal.makeRotationFromEuler(
    _euler.set(params.rotation[0], params.rotation[1], params.rotation[2], 'XYZ')
  );
  _constraintLocal.setPosition(params.position[0], params.position[1], params.position[2]);

  if (!_isValidMatrix(_constraintLocal)) {
    return false;
  }

  _bodyWorldMatrixFromJolt(world, bodyA, _worldA);
  _bodyWorldMatrixFromJolt(world, bodyB, _worldB);

  if (!_isValidMatrix(_worldA) || !_isValidMatrix(_worldB)) {
    return false;
  }

  _invA.copy(_worldA).invert();
  _invB.copy(_worldB).invert();
  outFrameA.copy(_invA).multiply(_constraintLocal);
  outFrameB.copy(_invB).multiply(_constraintLocal);
  return _isValidMatrix(outFrameA) && _isValidMatrix(outFrameB);
}

function _bodyWorldMatrixFromJolt(
  world: SharedJoltWorld,
  body: MMDRigidBodyJolt,
  target: THREE.Matrix4
): THREE.Matrix4 {
  const { bodyInterface } = world;
  const pos = new world.Jolt.RVec3(0, 0, 0);
  const rot = new world.Jolt.Quat(0, 0, 0, 1);
  bodyInterface.GetPositionAndRotation(body.bodyId, pos, rot);
  _joltPos.x = pos.GetX();
  _joltPos.y = pos.GetY();
  _joltPos.z = pos.GetZ();
  _joltRot.x = rot.GetX();
  _joltRot.y = rot.GetY();
  _joltRot.z = rot.GetZ();
  _joltRot.w = rot.GetW();
  world.Jolt.destroy(pos);
  world.Jolt.destroy(rot);
  return target.compose(
    _pos.set(_joltPos.x, _joltPos.y, _joltPos.z),
    _quat.set(_joltRot.x, _joltRot.y, _joltRot.z, _joltRot.w),
    _scale
  );
}

function _isValidMatrix(matrix: THREE.Matrix4): boolean {
  const elements = matrix.elements;
  for (let i = 0; i < elements.length; i++) {
    if (!Number.isFinite(elements[i])) {
      return false;
    }
  }
  return true;
}

function _normalizeQuaternion(quaternion: THREE.Quaternion): boolean {
  const lengthSq = quaternion.lengthSq();
  if (!Number.isFinite(lengthSq) || lengthSq < 1e-12) {
    return false;
  }
  if (Math.abs(lengthSq - 1) > 1e-4) {
    quaternion.normalize();
  }
  return Number.isFinite(quaternion.x)
    && Number.isFinite(quaternion.y)
    && Number.isFinite(quaternion.z)
    && Number.isFinite(quaternion.w);
}

function applyAxisLimits(
  Jolt: JoltModule,
  settings: JoltModule['SixDOFConstraintSettings'],
  params: MMDConstraintDef
): void {
  const tx = Jolt.SixDOFConstraintSettings_EAxis_TranslationX;
  const ty = Jolt.SixDOFConstraintSettings_EAxis_TranslationY;
  const tz = Jolt.SixDOFConstraintSettings_EAxis_TranslationZ;
  const rx = Jolt.SixDOFConstraintSettings_EAxis_RotationX;
  const ry = Jolt.SixDOFConstraintSettings_EAxis_RotationY;
  const rz = Jolt.SixDOFConstraintSettings_EAxis_RotationZ;

  setLimited(settings, tx, params.translationLimitation1[0], params.translationLimitation2[0]);
  setLimited(settings, ty, params.translationLimitation1[1], params.translationLimitation2[1]);
  setLimited(settings, tz, params.translationLimitation1[2], params.translationLimitation2[2]);
  setLimited(settings, rx, params.rotationLimitation1[0], params.rotationLimitation2[0]);
  setLimited(settings, ry, params.rotationLimitation1[1], params.rotationLimitation2[1]);
  setLimited(settings, rz, params.rotationLimitation1[2], params.rotationLimitation2[2]);
}

function applyAxisSprings(
  Jolt: JoltModule,
  settings: JoltModule['SixDOFConstraintSettings'],
  params: MMDConstraintDef
): void {
  const tx = Jolt.SixDOFConstraintSettings_EAxis_TranslationX;
  const ty = Jolt.SixDOFConstraintSettings_EAxis_TranslationY;
  const tz = Jolt.SixDOFConstraintSettings_EAxis_TranslationZ;
  const rx = Jolt.SixDOFConstraintSettings_EAxis_RotationX;
  const ry = Jolt.SixDOFConstraintSettings_EAxis_RotationY;
  const rz = Jolt.SixDOFConstraintSettings_EAxis_RotationZ;

  applySpring(Jolt, settings, tx, params.springPosition[0]);
  applySpring(Jolt, settings, ty, params.springPosition[1]);
  applySpring(Jolt, settings, tz, params.springPosition[2]);
  applySpring(Jolt, settings, rx, params.springRotation[0]);
  applySpring(Jolt, settings, ry, params.springRotation[1]);
  applySpring(Jolt, settings, rz, params.springRotation[2]);
}

function setLimited(
  settings: JoltModule['SixDOFConstraintSettings'],
  axis: number,
  min: number,
  max: number
): void {
  if (min === 0 && max === 0) {
    settings.MakeFixedAxis(axis);
    return;
  }
  settings.SetLimitedAxis(axis, min, max);
}

function applySpring(
  Jolt: JoltModule,
  settings: JoltModule['SixDOFConstraintSettings'],
  axis: number,
  stiffness: number
): void {
  if (stiffness <= 0) return;

  if (typeof settings.IsFixedAxis === 'function' && settings.IsFixedAxis(axis)) {
    return;
  }

  const spring = getSixDofLimitsSpringSettings(settings, axis);
  if (!spring) return;

  // MMD PMX spring stiffness maps to Bullet generic6DofSpring; use frequency mode like Ammo port.
  spring.mMode = Jolt.ESpringMode_FrequencyAndDamping;
  spring.mFrequency = Math.sqrt(Math.max(stiffness, 0.001)) / (2 * Math.PI);
  spring.mDamping = 0.475;
}

/** SixDOFConstraintSettings uses indexed getters in WASM, not GetLimitsSpringSettings(). */
function getSixDofLimitsSpringSettings(
  settings: JoltModule['SixDOFConstraintSettings'],
  axis: number
): JoltModule['SpringSettings'] | null {
  if (typeof settings.get_mLimitsSpringSettings === 'function') {
    return settings.get_mLimitsSpringSettings(axis);
  }
  if (typeof settings.GetLimitsSpringSettings === 'function') {
    return settings.GetLimitsSpringSettings(axis);
  }
  return null;
}
