/**
 * Heavy PMX import — loading UI, texture progress, loading-mode flags.
 */

export type ModelLoadStage =
  | 'idle'
  | 'fetching'
  | 'geometry'
  | 'textures'
  | 'animation'
  | 'ik'
  | 'physics'
  | 'optimizing'
  | 'done';

const STAGE_MESSAGES: Record<ModelLoadStage, string> = {
  idle: '',
  fetching: 'Reading model…',
  geometry: 'Building mesh…',
  textures: 'Loading textures…',
  animation: 'Preparing animation…',
  ik: 'Setting up bones & IK…',
  physics: 'Enabling physics…',
  optimizing: 'Finishing setup…',
  done: '',
};

/** Force-dismiss stuck overlay if physics init blocks the main thread. */
const LOAD_UI_WATCHDOG_MS = 12_000;
const ELAPSED_TICK_MS = 1000;

let active = false;
/** True while Jolt worker / physics bootstrap runs after staged pose is ready. */
let physicsBootstrapActive = false;
let stage: ModelLoadStage = 'idle';
let loadStartedAt = 0;
let texturesLoaded = 0;
let texturesTotal = 0;
let geometryReady = false;
let stagedReady = false;
let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
let elapsedTickTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

export interface ModelLoadStatus {
  message: string;
  percent: number | null;
  elapsedSec: number;
  visible: boolean;
  texturesLoaded: number;
  texturesTotal: number;
}

const EMPTY_STATUS: ModelLoadStatus = {
  message: '',
  percent: null,
  elapsedSec: 0,
  visible: false,
  texturesLoaded: 0,
  texturesTotal: 0,
};

/** Cached snapshot — required for useSyncExternalStore (stable reference between notifies). */
let statusSnapshot: ModelLoadStatus = EMPTY_STATUS;

function clearWatchdog(): void {
  if (watchdogTimer !== null) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }
}

function stopElapsedTick(): void {
  if (elapsedTickTimer !== null) {
    clearInterval(elapsedTickTimer);
    elapsedTickTimer = null;
  }
}

function startElapsedTick(): void {
  stopElapsedTick();
  elapsedTickTimer = setInterval(() => {
    if (!active) {
      stopElapsedTick();
      return;
    }
    rebuildStatusSnapshot();
    listeners.forEach((l) => l());
  }, ELAPSED_TICK_MS);
}

function resetProgressCounters(): void {
  texturesLoaded = 0;
  texturesTotal = 0;
  geometryReady = false;
  stagedReady = false;
}

function rebuildStatusSnapshot(): void {
  if (!active) {
    statusSnapshot = EMPTY_STATUS;
    return;
  }

  const elapsedSec =
    loadStartedAt > 0 ? (performance.now() - loadStartedAt) / 1000 : 0;
  const stageMsg = STAGE_MESSAGES[stage] ?? 'Loading…';
  const parts: string[] = [stageMsg];

  let percent: number | null = null;
  if (texturesTotal > 0) {
    percent = Math.min(100, Math.round((texturesLoaded / texturesTotal) * 100));
    parts.push(`Textures ${texturesLoaded}/${texturesTotal} (${percent}%)`);
  }

  parts.push(`${elapsedSec.toFixed(1)} s`);

  statusSnapshot = {
    message: parts.join(' · '),
    percent,
    elapsedSec,
    visible: true,
    texturesLoaded,
    texturesTotal,
  };
}

function notify(): void {
  rebuildStatusSnapshot();
  listeners.forEach((l) => l());
}

/** Close loading overlay — does not wait for physics / staged attach. */
function tryDismissLoadOverlay(): void {
  if (!active) return;
  if (!geometryReady) return;
  if (texturesTotal > 0 && texturesLoaded < texturesTotal) {
    // One missing blob URL is common on large PMX — don't block the UI at 99%.
    if (texturesLoaded < Math.max(1, texturesTotal - 1)) return;
    if (!stagedReady && texturesLoaded < texturesTotal) return;
  }
  endModelLoad();
}

export function beginModelLoad(): void {
  active = true;
  stage = 'fetching';
  loadStartedAt = performance.now();
  resetProgressCounters();
  clearWatchdog();
  watchdogTimer = setTimeout(() => {
    if (!active) return;
    console.warn('[ModelLoad] UI watchdog — dismissing loading overlay');
    endModelLoad();
  }, LOAD_UI_WATCHDOG_MS);
  rebuildStatusSnapshot();
  startElapsedTick();
  listeners.forEach((l) => l());
}

export function setModelLoadStage(next: ModelLoadStage): void {
  if (!active) return;
  stage = next;
  notify();
}

export function reportModelLoadGeometryReady(): void {
  geometryReady = true;
  if (active && (stage === 'fetching' || stage === 'idle')) {
    stage = 'geometry';
  }
  notify();
  tryDismissLoadOverlay();
}

export function reportModelLoadTextures(loaded: number, total: number): void {
  texturesLoaded = Math.max(0, loaded);
  texturesTotal = Math.max(0, total);
  if (active && texturesTotal > 0) {
    stage = 'textures';
  }
  notify();
  if (texturesTotal > 0 && texturesLoaded >= texturesTotal) {
    tryDismissLoadOverlay();
  }
}

export function reportModelLoadStagedReady(): void {
  stagedReady = true;
  notify();
  tryDismissLoadOverlay();
}

export function endModelLoad(): void {
  clearWatchdog();
  stopElapsedTick();
  active = false;
  stage = 'idle';
  resetProgressCounters();
  loadStartedAt = 0;
  rebuildStatusSnapshot();
  listeners.forEach((l) => l());
}

export function beginPhysicsBootstrap(): void {
  physicsBootstrapActive = true;
}

export function endPhysicsBootstrap(): void {
  physicsBootstrapActive = false;
}

export function isPhysicsBootstrapActive(): boolean {
  return physicsBootstrapActive;
}

/** Model / texture load or physics worker handoff — skip adaptive quality cuts. */
export function isModelLoadActive(): boolean {
  return active || physicsBootstrapActive;
}

export function getModelLoadStage(): ModelLoadStage {
  return stage;
}

/** Stable reference until the next notify — safe for useSyncExternalStore. */
export function getModelLoadStatus(): ModelLoadStatus {
  return statusSnapshot;
}

/** @deprecated Use getModelLoadStatus().message */
export function getModelLoadStageMessage(): string {
  return statusSnapshot.message;
}

export function subscribeModelLoad(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reliable on main thread even when R3F frameloop is "demand". */
export function scheduleAfterMs(
  delayMs: number,
  fn: () => void,
  isCancelled?: () => boolean
): () => void {
  if (delayMs <= 0 && typeof requestAnimationFrame === 'function') {
    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      if (cancelled || isCancelled?.()) return;
      fn();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }

  const id = window.setTimeout(() => {
    if (isCancelled?.()) return;
    fn();
  }, Math.max(0, delayMs));
  return () => clearTimeout(id);
}

/** Run heavy work without freezing the loading overlay. */
export function runWhenIdle(fn: () => void, timeoutMs = 3000): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn, { timeout: timeoutMs });
  } else if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => fn());
  } else {
    window.setTimeout(fn, 0);
  }
}
