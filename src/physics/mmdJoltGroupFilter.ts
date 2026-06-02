import type { JoltModule } from './joltLoader';
import type { MMDRigidBodyDef } from './mmdTypes';
import { MMD_BODY_KINEMATIC } from './mmdTypes';

/**
 * MMD groupTarget filtering is handled via object layers (see joltCollisionLayers.ts).
 * GroupFilterJS in jolt-physics WASM only exposes CanCollide(group1, group2) — a 4-arg
 * MMD bitmask filter causes "function signature mismatch" on the first physics step.
 */
export function applyMmdBodyCollisionGroup(
  _Jolt: JoltModule,
  _creation: JoltModule['BodyCreationSettings'],
  _params: MMDRigidBodyDef
): void {
  // no-op — broad-phase layers disable dynamic↔dynamic; kinematic↔dynamic stays enabled
}

/** Minimum linear/angular damping on dynamic bodies — reduces explosion energy. */
export function effectiveMmdDynamicDamping(
  params: MMDRigidBodyDef
): { linear: number; angular: number } {
  if (params.type === MMD_BODY_KINEMATIC) {
    return { linear: params.positionDamping, angular: params.rotationDamping };
  }
  const lin = Math.max(params.positionDamping, 0.45);
  const ang = Math.max(params.rotationDamping, 0.55);
  return { linear: lin, angular: ang };
}
