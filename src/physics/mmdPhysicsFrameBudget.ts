/** Fixed Bullet/Ammo step — 120 Hz, capped substeps for ~4 ms physics budget. */
export const MMD_PHYSICS_UNIT_STEP = 1 / 120;
export const MMD_PHYSICS_MAX_SUBSTEPS = 3;
export const MMD_PHYSICS_DELTA_CAP = 1 / 30;

export interface MmdEditModeInput {
  playing: boolean;
  capturing: boolean;
  gizmoDragging: boolean;
  rootGizmoDragging: boolean;
}

/** Paused playback or manual bone/root manipulation — zero physics budget. */
export function isMmdEditMode(input: MmdEditModeInput): boolean {
  if (input.playing || input.capturing) {
    return input.gizmoDragging || input.rootGizmoDragging;
  }
  return true;
}

export interface MmdPhysicsRunInput {
  editMode: boolean;
  physicsMode: 'anytime' | 'playtime' | 'off';
  playing: boolean;
  capturing: boolean;
  ammoReady: boolean;
  physicsDeferred: boolean;
  userQualityOff: boolean;
}

export function shouldRunMmdPhysics(input: MmdPhysicsRunInput): boolean {
  if (input.editMode) return false;
  if (input.physicsDeferred || !input.ammoReady || input.userQualityOff) return false;
  if (input.physicsMode === 'off') return false;
  return input.playing || input.capturing;
}

/** Clamp render delta before feeding the physics accumulator. */
export function capMmdPhysicsDelta(delta: number): number {
  if (delta <= 0) return 0;
  return delta > MMD_PHYSICS_DELTA_CAP ? MMD_PHYSICS_DELTA_CAP : delta;
}
