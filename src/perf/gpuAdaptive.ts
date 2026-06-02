import {
  ADAPTIVE_RECOVER_FRAMES,
  ADAPTIVE_STRESS_FRAMES,
  ADAPTIVE_TIER_COOLDOWN_MS,
  GPU_BOUND_CPU_RATIO,
  GPU_OVERLOAD_PCT,
  TARGET_FRAME_MS,
} from './perfConstants';
import { isModelLoadActive } from './modelLoadProfile';
import { isPhysicsLoadCooldown } from '../physics/physicsFrameGate';
import { getPlaybackDegradeCap } from './playbackPerfMode';
import { isUltraHeavyMeshActive } from '../render/heavyMesh';

/** Visual-only degrade steps (0 = full quality, 4 = max reduction). */
let gpuDegradeLevel = 0;
let gpuStressStreak = 0;
let gpuRecoverStreak = 0;
let lastGpuDegradeChangeMs = 0;
let gpuBoundActive = false;
let gpuDegradeMessage: string | null = null;

export function getGpuDegradeLevel(): number {
  return gpuDegradeLevel;
}

export function isGpuBound(): boolean {
  return gpuBoundActive;
}

export function getGpuDegradeMessage(): string | null {
  return gpuDegradeMessage;
}

export function resetGpuAdaptive(): void {
  gpuDegradeLevel = 0;
  gpuStressStreak = 0;
  gpuRecoverStreak = 0;
  lastGpuDegradeChangeMs = 0;
  gpuBoundActive = false;
  gpuDegradeMessage = null;
}

/**
 * GPU-only adaptive controller — never touches animation / IK / physics order.
 * Uses hysteresis + cooldown to avoid flicker.
 */
export function tickGpuAdaptiveQuality(
  frameMs: number,
  cpuMs: number,
  gpuMs: number,
  frameOverBudget: boolean
): void {
  if (isModelLoadActive() || isPhysicsLoadCooldown()) {
    return;
  }

  const now = performance.now();
  const gpuSharePct = frameMs > 0 ? (gpuMs / frameMs) * 100 : 0;
  const gpuBound = gpuMs > cpuMs * GPU_BOUND_CPU_RATIO && gpuMs > 2;
  gpuBoundActive = gpuBound;

  const gpuStressed =
    gpuBound || gpuSharePct >= GPU_OVERLOAD_PCT || (frameOverBudget && gpuMs > cpuMs);

  if (gpuStressed) {
    gpuStressStreak += 1;
    gpuRecoverStreak = 0;
  } else if (
    gpuSharePct < GPU_OVERLOAD_PCT * 0.65 &&
    !gpuBound &&
    frameMs < TARGET_FRAME_MS * 0.92
  ) {
    gpuRecoverStreak += 1;
    gpuStressStreak = Math.max(0, gpuStressStreak - 1);
  } else {
    gpuStressStreak = Math.max(0, gpuStressStreak - 1);
  }

  const canChange = now - lastGpuDegradeChangeMs >= ADAPTIVE_TIER_COOLDOWN_MS;
  const ultraHeavy = isUltraHeavyMeshActive();
  const stressThreshold = gpuBound
    ? Math.max(4, Math.floor(ADAPTIVE_STRESS_FRAMES * 0.35))
    : ultraHeavy
      ? Math.max(6, Math.floor(ADAPTIVE_STRESS_FRAMES * 0.4))
      : ADAPTIVE_STRESS_FRAMES;

  const degradeCap = getPlaybackDegradeCap();
  if (gpuStressStreak >= stressThreshold && gpuDegradeLevel < degradeCap && canChange) {
    gpuDegradeLevel += 1;
    lastGpuDegradeChangeMs = now;
    gpuStressStreak = 0;
    gpuDegradeMessage = 'GPU bottleneck detected → reducing visual load';
  } else if (
    gpuRecoverStreak >= ADAPTIVE_RECOVER_FRAMES &&
    gpuDegradeLevel > 0 &&
    canChange
  ) {
    gpuDegradeLevel -= 1;
    lastGpuDegradeChangeMs = now;
    gpuRecoverStreak = 0;
    if (gpuDegradeLevel === 0) {
      gpuDegradeMessage = null;
    }
  }

  if (gpuDegradeLevel > 0 && !gpuDegradeMessage) {
    gpuDegradeMessage = 'GPU bottleneck detected → reducing visual load';
  }
}
