/**
 * Graphics system lifecycle — hardware reinit after WebGL context loss.
 */
type GraphicsListener = () => void;

let graphicsEpoch = 0;
let gpuSuspended = false;
let recoveryInFlight = false;
let contextLostActive = false;
let reinitTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<GraphicsListener>();

const RECOVERY_DELAY_MS = 1000;

function notify(): void {
  listeners.forEach((l) => l());
}

export function getGraphicsEpoch(): number {
  return graphicsEpoch;
}

export function isGpuSuspended(): boolean {
  return gpuSuspended;
}

export function isWebGlRecoveryInFlight(): boolean {
  return recoveryInFlight;
}

export function isWebGlContextLostActive(): boolean {
  return contextLostActive;
}

export function subscribeGraphicsSystem(listener: GraphicsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function markWebGlContextLost(): void {
  recoveryInFlight = true;
  contextLostActive = true;
}

export function clearWebGlRecoveryState(): void {
  recoveryInFlight = false;
  contextLostActive = false;
}

export interface GraphicsQualityFallback {
  resolutionScale: number;
  enableBloom: boolean;
  enableDoF: boolean;
  enableSSAO: boolean;
  enableGodRays: boolean;
  enablePostFxStack: boolean;
}

/** Discrete-GPU defaults — used for docs/tests only; recovery no longer downgrades user settings. */
export function getGraphicsQualityFallback(): GraphicsQualityFallback {
  return {
    resolutionScale: 0.5,
    enableBloom: true,
    enableDoF: true,
    enableSSAO: true,
    enableGodRays: true,
    enablePostFxStack: true,
  };
}

/** Suspend canvas → wait → remount with new graphics epoch. */
export function initGraphicsSystem(): void {
  if (reinitTimer != null) return;

  gpuSuspended = true;
  notify();

  reinitTimer = setTimeout(() => {
    reinitTimer = null;
    // Two frames after delay — let React unmount the dead canvas and the driver free VRAM.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        graphicsEpoch += 1;
        gpuSuspended = false;
        clearWebGlRecoveryState();
        notify();
      });
    });
  }, RECOVERY_DELAY_MS);
}

export function cancelGraphicsSystemReinit(): void {
  if (reinitTimer != null) {
    clearTimeout(reinitTimer);
    reinitTimer = null;
  }
  gpuSuspended = false;
  clearWebGlRecoveryState();
}
