/**
 * Performance layer — observer + controller only.
 * Core animation pipeline (VMD, IK, morphs, physics order) lives in components/ + physics/.
 */

export * from './perfTypes';
export * from './perfConstants';
export { subscribePerf, getPerfSnapshot, setPerfAppStateRef, recordFrameTiming, recordFrameDelta, recordMmdCpuBreakdown, publishSnapshot, resetPerfMetrics } from './perfStore';
export { resetStableFps, STABLE_FPS_SAMPLES, STABLE_FPS_CAP } from './stableFps';
export { tickStablePerfResponse, resetStablePerfResponse } from './stablePerfResponse';
export { getFrameCpuGpuMs, resetFrameCpuGpuTiming } from './frameCpuGpuTiming';
export * from './physicsQualityControl';
export * from './adaptiveQuality';
export * from './effectiveVisualFx';
export { analyzeScenePerformance } from './diagnostics/sceneDiagnostics';
export { buildPerfFixPatch } from './controller/applyPerfFix';
export { getPerfRenderAdaptation } from './controller/renderAdaptation';
export {
  setSceneTriangleCount,
  getSceneTriangleCount,
  syncTriangleStressGovernor,
} from './sceneTriangleStress';
