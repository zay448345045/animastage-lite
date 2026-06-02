/** Rolling-average FPS — avoids rAF batch spikes (900 FPS) and tab-stall drops. */

export const STABLE_FPS_SAMPLES = 60;
export const STABLE_FPS_WARMUP = 10;
export const STABLE_FPS_CAP = 120;
/** Ignore single-frame gaps (tab background, debugger pause). */
export const STABLE_FPS_MAX_DELTA_MS = 250;

export type PerfLevelLabel = 'Smooth' | 'Okay' | 'Lagging';

export interface StableFpsReading {
  fps: number;
  frameMs: number;
  frameMsDisplay: string;
  perfLevel: PerfLevelLabel;
  ready: boolean;
}

const FRAME_BUDGET_60_MS = 1000 / 60;
const FRAME_BUDGET_30_MS = 1000 / 30;

let frameTimes: number[] = [];
let warmupRemaining = STABLE_FPS_WARMUP;

function average(nums: number[]): number {
  if (nums.length === 0) return FRAME_BUDGET_60_MS;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function resolvePerfLevel(frameMs: number): PerfLevelLabel {
  if (frameMs < FRAME_BUDGET_60_MS) return 'Smooth';
  if (frameMs <= FRAME_BUDGET_30_MS) return 'Okay';
  return 'Lagging';
}

export function resolveDisplayBottleneck(cpuMs: number, gpuMs: number): string {
  if (cpuMs < 0.5 && gpuMs < 0.5) return 'Balanced';
  if (cpuMs > gpuMs * 1.08) return 'CPU bottleneck';
  if (gpuMs > cpuMs * 1.08) return 'GPU bottleneck';
  return 'Balanced';
}

function buildReading(): StableFpsReading {
  const frameMs = average(frameTimes);
  let fps = frameMs > 0 ? 1000 / frameMs : 60;
  if (fps > STABLE_FPS_CAP) fps = STABLE_FPS_CAP;
  return {
    fps: Math.round(fps),
    frameMs,
    frameMsDisplay: frameMs.toFixed(1),
    perfLevel: resolvePerfLevel(frameMs),
    ready: frameTimes.length > 0 && warmupRemaining <= 0,
  };
}

export function resetStableFps(): void {
  frameTimes = [];
  warmupRemaining = STABLE_FPS_WARMUP;
}

/** Push one rAF delta; returns null during warmup or invalid deltas. */
export function pushStableFrameTime(deltaMs: number): StableFpsReading | null {
  if (deltaMs <= 0 || deltaMs > STABLE_FPS_MAX_DELTA_MS) {
    return warmupRemaining <= 0 && frameTimes.length > 0 ? buildReading() : null;
  }

  if (warmupRemaining > 0) {
    warmupRemaining -= 1;
    return null;
  }

  frameTimes.push(deltaMs);
  if (frameTimes.length > STABLE_FPS_SAMPLES) {
    frameTimes.shift();
  }

  return buildReading();
}

export function getStableFpsReading(): StableFpsReading {
  return buildReading();
}
