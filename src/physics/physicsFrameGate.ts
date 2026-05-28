/**
 * Limits physics worker requests to one per render frame (avoids message-queue floods).
 * Updated from {@link JoltPhysicsFrameSync} (priority -1000).
 */
let renderFrameId = 0;
let lastPhysicsDispatchFrame = -1;

/** Frames to skip physics after mesh load / worker handoff (prevents 700ms rAF stalls). */
let loadCooldownFrames = 0;

/** Skip heavy physics when the previous rAF handler exceeded this budget. */
let previousFrameOverBudget = false;

export const PHYSICS_LOAD_COOLDOWN_FRAMES = 45;

export function bumpRenderFrameId(): void {
  renderFrameId += 1;
  if (loadCooldownFrames > 0) {
    loadCooldownFrames -= 1;
  }
}

export function getRenderFrameId(): number {
  return renderFrameId;
}

export function startPhysicsLoadCooldown(frames = PHYSICS_LOAD_COOLDOWN_FRAMES): void {
  loadCooldownFrames = frames;
}

export function isPhysicsLoadCooldown(): boolean {
  return loadCooldownFrames > 0;
}

export function setPreviousFrameOverBudget(over: boolean): void {
  previousFrameOverBudget = over;
}

export function isPreviousFrameOverBudget(): boolean {
  return previousFrameOverBudget;
}

/** Returns false if a physics STEP/FRAME_READY was already sent this render frame. */
export function tryAcquirePhysicsDispatchSlot(): boolean {
  if (isPhysicsLoadCooldown() || isPreviousFrameOverBudget()) {
    return false;
  }
  if (lastPhysicsDispatchFrame === renderFrameId) {
    return false;
  }
  lastPhysicsDispatchFrame = renderFrameId;
  return true;
}

export function resetPhysicsDispatchGate(): void {
  lastPhysicsDispatchFrame = -1;
  loadCooldownFrames = 0;
  previousFrameOverBudget = false;
}
