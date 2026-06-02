import { TARGET_FRAME_MS, PERF_UI_NOTIFY_MS } from './perfConstants';
import {
  getDegradeMessage,
  isDegradingLoad,
} from './adaptiveQuality';
import { isPostFxReduced } from './effectiveVisualFx';
import { analyzeScenePerformance } from './diagnostics/sceneDiagnostics';
import type { AppState } from '../types';
import {
  getAdaptivePhysicsTier,
  getEffectivePhysicsMaxSteps,
  getUserPhysicsQuality,
  resolveEffectivePhysicsTier,
} from './physicsQualityControl';
import type {
  PerfBottleneck,
  PerfBoundLabel,
  PerfCpuBreakdownMs,
  PerfSnapshot,
} from './perfTypes';
import {
  pushStableFrameTime,
  resetStableFps,
  resolveDisplayBottleneck,
  resolvePerfLevel,
  getStableFpsReading,
} from './stableFps';
import { resetStablePerfResponse } from './stablePerfResponse';
import { getFrameCpuGpuMs, resetFrameCpuGpuTiming } from './frameCpuGpuTiming';

const FPS_SAMPLES = 60;
const TIMING_SAMPLES = 30;

let fpsRing: number[] = [];
let frameMsRing: number[] = [];
let cpuDisplayRing: number[] = [];
let gpuDisplayRing: number[] = [];
let lastFrameMs = TARGET_FRAME_MS;
let lastCpu: PerfCpuBreakdownMs = {
  animationIk: 0,
  physics: 0,
  other: 0,
  renderEst: 0,
};
let lastPhysicsSkipped = false;
let lastPhysicsSimActive = false;
let budgetExceeded = false;
let budgetSignal = false;
let appStateRef: AppState | null = null;
let lastNotifyMs = 0;
let dirty = false;

const EMPTY_DIAG = { causes: [] as string[], suggestions: [] as string[] };

const EMPTY_SNAPSHOT: PerfSnapshot = {
  fps: 60,
  fpsAvg: 60,
  frameMs: TARGET_FRAME_MS,
  frameMsAvg: TARGET_FRAME_MS,
  budgetExceeded: false,
  degrading: false,
  degradeMessage: null,
  cpuMs: 0,
  gpuMsEst: TARGET_FRAME_MS,
  cpuSharePct: 50,
  gpuSharePct: 50,
  bottleneck: 'balanced',
  bottleneckLabel: 'Balanced',
  breakdownMs: { animationIk: 0, physics: 0, other: 0, renderEst: 0 },
  physicsQuality: 'auto',
  effectivePhysicsTier: 'medium',
  adaptiveTier: 'medium',
  physicsMaxSteps: 2,
  physicsSkipped: false,
  physicsSimActive: false,
  physicsStatus: '—',
  postFxReduced: false,
  boundLabel: 'Balanced',
  loadHint: 'Within budget',
  diagnostics: EMPTY_DIAG,
  perfLevel: 'Smooth',
  displayBottleneck: 'Balanced',
  cpuMsDisplay: 0,
  gpuMsDisplay: 0,
};

let snapshot: PerfSnapshot = { ...EMPTY_SNAPSHOT };

const listeners = new Set<() => void>();

function notifyThrottled(): void {
  const now = performance.now();
  if (now - lastNotifyMs < PERF_UI_NOTIFY_MS && dirty) return;
  lastNotifyMs = now;
  dirty = false;
  listeners.forEach((l) => l());
}

function notifyForce(): void {
  lastNotifyMs = performance.now();
  dirty = false;
  listeners.forEach((l) => l());
}

export function subscribePerf(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPerfSnapshot(): PerfSnapshot {
  return snapshot;
}

/** Latest CPU/GPU split for adaptive controllers (from last MMD breakdown or frame estimate). */
export function getLastFrameCpuGpuMs(): { cpuMs: number; gpuMs: number } {
  const cpuMs = lastCpu.animationIk + lastCpu.physics + lastCpu.other;
  const gpuMs = Math.max(0, lastFrameMs - cpuMs);
  return { cpuMs, gpuMs };
}

export function setPerfAppStateRef(state: AppState | null): void {
  appStateRef = state;
  dirty = true;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pushRing(ring: number[], value: number, max: number): number[] {
  const next = [...ring, value];
  if (next.length > max) next.shift();
  return next;
}

function resolveBoundLabel(cpuMs: number, gpuMs: number, overBudget: boolean): PerfBoundLabel {
  if (cpuMs < 0.5 && gpuMs < 0.5) return 'Balanced';
  if (!overBudget) {
    return cpuMs > gpuMs * 1.08 ? 'CPU-heavy frame' : 'GPU-heavy frame';
  }
  return cpuMs > gpuMs * 1.08 ? 'CPU bound' : 'GPU bound';
}

function resolveBottleneck(
  breakdown: PerfCpuBreakdownMs,
  gpuMs: number,
  overBudget: boolean
): { id: PerfBottleneck; label: string } {
  const cpuTotal = breakdown.animationIk + breakdown.physics + breakdown.other;
  if (cpuTotal < 0.5 && gpuMs < 0.5) {
    return { id: 'balanced', label: 'Balanced' };
  }
  if (!overBudget) {
    if (gpuMs > cpuTotal * 1.12 && gpuMs > 2) {
      return { id: 'render', label: 'Mostly GPU (within budget)' };
    }
    if (breakdown.physics > 0.4 && breakdown.physics >= breakdown.animationIk) {
      return { id: 'physics', label: 'Mostly physics (within budget)' };
    }
    if (breakdown.animationIk > 0.5) {
      return { id: 'animation', label: 'Mostly animation (within budget)' };
    }
    return { id: 'unknown', label: 'Within budget' };
  }
  if (gpuMs > cpuTotal * 1.12 && gpuMs > 2) {
    return { id: 'render', label: 'GPU bottleneck' };
  }
  if (breakdown.physics >= breakdown.animationIk && breakdown.physics > 0.4) {
    return { id: 'physics', label: 'Physics bottleneck' };
  }
  if (breakdown.animationIk > 0.5 && breakdown.animationIk >= breakdown.physics) {
    return { id: 'animation', label: 'Animation / IK bottleneck' };
  }
  if (gpuMs > cpuTotal) {
    return { id: 'render', label: 'GPU bottleneck' };
  }
  return { id: 'unknown', label: 'Mixed load' };
}

function resolvePhysicsStatus(
  userQ: ReturnType<typeof getUserPhysicsQuality>,
  effective: ReturnType<typeof resolveEffectivePhysicsTier>,
  simActive: boolean
): string {
  if (userQ === 'off') return 'Off';
  if (!simActive) return 'Idle (not simulating)';
  const tier = userQ === 'auto' ? effective : userQ;
  return `Simulating · ${tier}`;
}

function fpsFromAvgFrameMs(frameMsAvg: number): number {
  if (frameMsAvg <= 0) return 60;
  return 1000 / frameMsAvg;
}

/** Observer: per-frame delta → smoothed timing (primary metric). */
export function recordFrameDelta(deltaMs: number): boolean {
  const stable = pushStableFrameTime(deltaMs);
  if (!stable) return false;

  lastFrameMs = stable.frameMs;
  budgetExceeded = stable.frameMs > TARGET_FRAME_MS;
  if (budgetExceeded) budgetSignal = true;

  frameMsRing = pushRing(frameMsRing, stable.frameMs, FPS_SAMPLES);
  fpsRing = pushRing(fpsRing, stable.fps, FPS_SAMPLES);

  const cpuMs = lastCpu.animationIk + lastCpu.physics + lastCpu.other;
  const frameSplit = getFrameCpuGpuMs();
  const cpuForDisplay = frameSplit.cpuMs > 0 ? frameSplit.cpuMs : cpuMs;
  const gpuForDisplay =
    frameSplit.gpuMs > 0
      ? frameSplit.gpuMs
      : Math.max(0, stable.frameMs - cpuForDisplay);
  cpuDisplayRing = pushRing(cpuDisplayRing, cpuForDisplay, TIMING_SAMPLES);
  gpuDisplayRing = pushRing(gpuDisplayRing, gpuForDisplay, TIMING_SAMPLES);

  rebuildSnapshot(stable);
  return true;
}

/** Legacy batch timing — prefer recordFrameDelta per rAF frame. */
export function recordFrameTiming(frameMs: number, exceeded: boolean): void {
  recordFrameDelta(frameMs);
  if (exceeded) budgetExceeded = true;
}

export function consumeBudgetSignal(): boolean {
  const v = budgetSignal;
  budgetSignal = false;
  return v;
}

export function recordMmdCpuBreakdown(
  breakdown: Omit<PerfCpuBreakdownMs, 'renderEst'>,
  physicsSkipped: boolean,
  physicsSimActive = false
): void {
  lastPhysicsSkipped = physicsSkipped;
  lastPhysicsSimActive = physicsSimActive;
  const cpuWork = breakdown.animationIk + breakdown.physics + breakdown.other;
  const renderEst = Math.max(0, lastFrameMs - cpuWork);
  lastCpu = { ...breakdown, renderEst };
  rebuildSnapshot();
}

function rebuildSnapshot(stable = getStableFpsReading()): void {
  const cpuMs = lastCpu.animationIk + lastCpu.physics + lastCpu.other;
  const gpuMsEst = Math.max(0, lastFrameMs - cpuMs);
  const cpuMsDisplay = avg(cpuDisplayRing) || cpuMs;
  const gpuMsDisplay = avg(gpuDisplayRing) || gpuMsEst;
  const total = Math.max(lastFrameMs, 0.001);
  const cpuSharePct = Math.round((cpuMs / total) * 100);
  const gpuSharePct = Math.round((gpuMsEst / total) * 100);
  const frameMsAvg = stable.frameMs || avg(frameMsRing) || lastFrameMs;
  const overBudget = budgetExceeded || frameMsAvg > TARGET_FRAME_MS;
  const bn = resolveBottleneck(lastCpu, gpuMsEst, overBudget);
  const effective = resolveEffectivePhysicsTier();
  const userQ = getUserPhysicsQuality();
  const state = appStateRef;
  const diagnostics = state ? analyzeScenePerformance(state) : EMPTY_DIAG;
  const userPhysicsOff = userQ === 'off';
  const physicsSkipped = lastPhysicsSkipped || userPhysicsOff;
  const displayFps = stable.ready ? stable.fps : Math.round(fpsFromAvgFrameMs(frameMsAvg));

  snapshot = {
    fps: displayFps,
    fpsAvg: displayFps,
    frameMs: frameMsAvg,
    frameMsAvg,
    budgetExceeded: overBudget,
    degrading: isDegradingLoad(),
    degradeMessage: getDegradeMessage(),
    cpuMs,
    gpuMsEst,
    cpuSharePct,
    gpuSharePct,
    bottleneck: bn.id,
    bottleneckLabel: bn.label,
    breakdownMs: { ...lastCpu },
    physicsQuality: userQ,
    effectivePhysicsTier: effective,
    adaptiveTier: (() => {
      const t = getAdaptivePhysicsTier();
      if (t === 'high' || t === 'medium' || t === 'low') return t;
      return 'medium';
    })(),
    physicsMaxSteps: getEffectivePhysicsMaxSteps(),
    physicsSkipped,
    physicsSimActive: lastPhysicsSimActive,
    physicsStatus: resolvePhysicsStatus(userQ, effective, lastPhysicsSimActive),
    postFxReduced: state ? isPostFxReduced(state.visualFx, state) : false,
    boundLabel: resolveBoundLabel(cpuMs, gpuMsEst, overBudget),
    loadHint: overBudget ? 'Over 60 Hz budget' : 'Within 60 Hz budget',
    diagnostics,
    perfLevel: resolvePerfLevel(frameMsAvg),
    displayBottleneck: resolveDisplayBottleneck(cpuMsDisplay, gpuMsDisplay),
    cpuMsDisplay,
    gpuMsDisplay,
  };
  dirty = true;
  notifyThrottled();
}

export function publishSnapshot(): void {
  rebuildSnapshot();
}

export function resetPerfMetrics(): void {
  fpsRing = [];
  frameMsRing = [];
  cpuDisplayRing = [];
  gpuDisplayRing = [];
  lastFrameMs = TARGET_FRAME_MS;
  lastCpu = { animationIk: 0, physics: 0, other: 0, renderEst: 0 };
  snapshot = { ...EMPTY_SNAPSHOT };
  resetStableFps();
  resetStablePerfResponse();
  resetFrameCpuGpuTiming();
  notifyForce();
}
