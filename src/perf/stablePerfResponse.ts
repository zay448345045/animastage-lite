/**
 * Lightweight quality nudge from smoothed frame time — uses existing perf governor.
 * No GPU profiling; does not block the render loop.
 */
import { tickPerfGovernor } from './controller/perfGovernor';

const STRESS_FRAME_MS = 25;
const STRESS_FRAMES = 10;
const RECOVER_FRAME_MS = 16;
const RECOVER_HOLD_MS = 2000;

let stressStreak = 0;
let recoverStartMs = 0;
let lastNudgeMs = 0;
const NUDGE_COOLDOWN_MS = 1800;

export function resetStablePerfResponse(): void {
  stressStreak = 0;
  recoverStartMs = 0;
  lastNudgeMs = 0;
}

/** Call each frame with smoothed frameMs (after warmup). */
export function tickStablePerfResponse(
  frameMsAvg: number,
  stableFps: number,
  now: number,
  recordingActive = false
): void {
  if (recordingActive) return;

  if (frameMsAvg > STRESS_FRAME_MS) {
    stressStreak += 1;
    recoverStartMs = 0;
    if (stressStreak >= STRESS_FRAMES && now - lastNudgeMs >= NUDGE_COOLDOWN_MS) {
      tickPerfGovernor(Math.min(stableFps, 48), now, false);
      lastNudgeMs = now;
      stressStreak = 0;
    }
    return;
  }

  stressStreak = Math.max(0, stressStreak - 1);

  if (frameMsAvg < RECOVER_FRAME_MS) {
    if (recoverStartMs === 0) recoverStartMs = now;
    if (now - recoverStartMs >= RECOVER_HOLD_MS && now - lastNudgeMs >= NUDGE_COOLDOWN_MS) {
      tickPerfGovernor(Math.max(stableFps, 68), now, false);
      lastNudgeMs = now;
      recoverStartMs = 0;
    }
  } else {
    recoverStartMs = 0;
  }
}
