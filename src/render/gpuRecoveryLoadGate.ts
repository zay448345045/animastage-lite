/** Serializes heavy GPU uploads after WebGL context recovery to avoid VRAM spikes. */

const STAGGER_MS = 350;

let chain: Promise<void> = Promise.resolve();
let recoveryActive = false;
let recoveryStartedAt = 0;

const RECOVERY_WINDOW_MS = 8000;

export function beginGpuRecoveryLoadGate(): void {
  recoveryActive = true;
  recoveryStartedAt = performance.now();
  chain = Promise.resolve();
  setTimeout(() => endGpuRecoveryLoadGate(), RECOVERY_WINDOW_MS);
}

export function endGpuRecoveryLoadGate(): void {
  recoveryActive = false;
}

export function isGpuRecoveryLoadGateActive(): boolean {
  if (!recoveryActive) return false;
  if (performance.now() - recoveryStartedAt > RECOVERY_WINDOW_MS) {
    recoveryActive = false;
    return false;
  }
  return true;
}

/** Queue GPU-heavy work (texture upload, warmup) one task at a time after recovery. */
export function runAfterGpuRecovery<T>(task: () => T | Promise<T>): Promise<T> {
  if (!isGpuRecoveryLoadGateActive()) {
    return Promise.resolve(task());
  }

  const run = chain.then(async () => {
    await new Promise((r) => setTimeout(r, STAGGER_MS));
    return task();
  });

  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
