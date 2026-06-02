/** Lightweight CPU vs GPU split — JS phase vs post-useFrame render gap. No GPU profiling extensions. */

let frameStartMs = 0;
let cpuPhaseEndMs = 0;
let lastCpuMs = 0;
let lastGpuMs = 0;

export function resetFrameCpuGpuTiming(): void {
  frameStartMs = 0;
  cpuPhaseEndMs = 0;
  lastCpuMs = 0;
  lastGpuMs = 0;
}

/** Start of rAF — also closes previous frame GPU estimate. */
export function beginFrameCpuGpuTiming(): void {
  const now = performance.now();
  if (cpuPhaseEndMs > 0) {
    lastGpuMs = Math.max(0, now - cpuPhaseEndMs);
  }
  frameStartMs = now;
}

/** After scene update hooks, before WebGL render. */
export function endCpuPhaseTiming(): void {
  const now = performance.now();
  cpuPhaseEndMs = now;
  lastCpuMs = Math.max(0, now - frameStartMs);
}

export function getFrameCpuGpuMs(): { cpuMs: number; gpuMs: number } {
  return { cpuMs: lastCpuMs, gpuMs: lastGpuMs };
}
