import type { MMDConstraintDef } from './mmdTypes';
import type { MMDRigidBodyJolt } from './mmdRigidBodyJolt';
import { isFiniteNumber } from './joltWasmSafe';

const VEC3_FIELDS = ['position', 'rotation'] as const;
const LIMIT_FIELDS = [
  'translationLimitation1',
  'translationLimitation2',
  'rotationLimitation1',
  'rotationLimitation2',
  'springPosition',
  'springRotation',
] as const;

export interface MmdConstraintValidationResult {
  ok: boolean;
  reason?: string;
  params?: MMDConstraintDef;
}

export interface MmdConstraintValidationContext {
  bodyCount: number;
  bodyA?: MMDRigidBodyJolt;
  bodyB?: MMDRigidBodyJolt;
  isBodyAdded?: (bodyId: unknown) => boolean;
}

function readVec3(source: number[] | undefined, fallback: number[]): number[] | null {
  if (!Array.isArray(source) || source.length < 3) {
    return null;
  }
  const values = [source[0], source[1], source[2]];
  if (!values.every(isFiniteNumber)) {
    return null;
  }
  return values;
}

function sanitizeVec3(source: number[] | undefined, fallback: number[]): number[] {
  const values = readVec3(source, fallback);
  return values ?? fallback.slice();
}

function sanitizeLimitPair(min: number, max: number): [number, number] {
  if (min === 0 && max === 0) {
    return [0, 0];
  }
  if (!isFiniteNumber(min) || !isFiniteNumber(max)) {
    return [0, 0];
  }
  if (min > max) {
    return [max, min];
  }
  return [min, max];
}

function sanitizeSpring(value: number): number {
  if (!isFiniteNumber(value) || value < 0) {
    return 0;
  }
  return value;
}

/** PMX type 0 (or missing) maps to generic 6DOF spring constraints in MMD/Ammo. */
function isSupportedConstraintType(type: number | undefined): boolean {
  return type === undefined || type === 0;
}

export function validateMmdConstraintDef(
  params: MMDConstraintDef,
  context: MmdConstraintValidationContext
): MmdConstraintValidationResult {
  const label = params.name ?? params.englishName ?? 'unnamed';

  if (!isSupportedConstraintType(params.type)) {
    return {
      ok: false,
      reason: `${label}: unsupported constraint type ${params.type}`,
    };
  }

  const indexA = params.rigidBodyIndex1;
  const indexB = params.rigidBodyIndex2;

  if (!isFiniteNumber(indexA) || !isFiniteNumber(indexB)) {
    return { ok: false, reason: `${label}: invalid rigid body indices` };
  }

  if (indexA < 0 || indexB < 0 || indexA >= context.bodyCount || indexB >= context.bodyCount) {
    return {
      ok: false,
      reason: `${label}: body index out of range (${indexA}, ${indexB}) / ${context.bodyCount}`,
    };
  }

  if (indexA === indexB) {
    return { ok: false, reason: `${label}: cannot constrain a body to itself` };
  }

  if (!context.bodyA || !context.bodyB) {
    return { ok: false, reason: `${label}: referenced rigid bodies are missing` };
  }

  if (context.isBodyAdded) {
    if (!context.isBodyAdded(context.bodyA.bodyId)) {
      return { ok: false, reason: `${label}: body A is not in the physics world` };
    }
    if (!context.isBodyAdded(context.bodyB.bodyId)) {
      return { ok: false, reason: `${label}: body B is not in the physics world` };
    }
  }

  for (const field of VEC3_FIELDS) {
    if (readVec3(params[field], [0, 0, 0]) === null) {
      return { ok: false, reason: `${label}: invalid ${field} vector` };
    }
  }

  for (const field of LIMIT_FIELDS) {
    const vec = params[field];
    if (!Array.isArray(vec) || vec.length < 3 || !vec.every(isFiniteNumber)) {
      return { ok: false, reason: `${label}: invalid ${field} vector` };
    }
  }

  return {
    ok: true,
    params: sanitizeMmdConstraintDef(params),
  };
}

export function sanitizeMmdConstraintDef(params: MMDConstraintDef): MMDConstraintDef {
  const translationLimitation1 = sanitizeVec3(params.translationLimitation1, [0, 0, 0]);
  const translationLimitation2 = sanitizeVec3(params.translationLimitation2, [0, 0, 0]);
  const rotationLimitation1 = sanitizeVec3(params.rotationLimitation1, [0, 0, 0]);
  const rotationLimitation2 = sanitizeVec3(params.rotationLimitation2, [0, 0, 0]);

  const tx = sanitizeLimitPair(translationLimitation1[0], translationLimitation2[0]);
  const ty = sanitizeLimitPair(translationLimitation1[1], translationLimitation2[1]);
  const tz = sanitizeLimitPair(translationLimitation1[2], translationLimitation2[2]);
  const rx = sanitizeLimitPair(rotationLimitation1[0], rotationLimitation2[0]);
  const ry = sanitizeLimitPair(rotationLimitation1[1], rotationLimitation2[1]);
  const rz = sanitizeLimitPair(rotationLimitation1[2], rotationLimitation2[2]);

  return {
    ...params,
    position: sanitizeVec3(params.position, [0, 0, 0]),
    rotation: sanitizeVec3(params.rotation, [0, 0, 0]),
    translationLimitation1: [tx[0], ty[0], tz[0]],
    translationLimitation2: [tx[1], ty[1], tz[1]],
    rotationLimitation1: [rx[0], ry[0], rz[0]],
    rotationLimitation2: [rx[1], ry[1], rz[1]],
    springPosition: sanitizeVec3(params.springPosition, [0, 0, 0]).map(sanitizeSpring),
    springRotation: sanitizeVec3(params.springRotation, [0, 0, 0]).map(sanitizeSpring),
  };
}
