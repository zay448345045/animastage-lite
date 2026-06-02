import type { ModelAnalysisReport } from '../analyzer/types';
import type { AppState, VisualFxSettings } from '../types';

const HEAVY_VERTS = 80_000;
const HEAVY_TRIS = 120_000;
/** Ultra-heavy tier — activates GPU mesh pipeline (clusters, LOD, CSM). */
export const ULTRA_HEAVY_TRIS = 450_000;
export const ULTRA_HEAVY_VERTS = 350_000;
const HEAVY_MORPHS = 80;
const HEAVY_MATERIALS = 32;
const HEAVY_TEXTURES = 120;

export function isHeavyModelReport(report: ModelAnalysisReport | null | undefined): boolean {
  if (!report) return false;
  const { stats, issues } = report;
  return (
    stats.vertexCount > HEAVY_VERTS ||
    stats.triangleCount > HEAVY_TRIS ||
    stats.morphCount > HEAVY_MORPHS ||
    stats.materialCount > HEAVY_MATERIALS ||
    stats.textureCount > HEAVY_TEXTURES ||
    issues.some((i) => i.id.startsWith('perf_'))
  );
}

export function isUltraHeavyModelReport(report: ModelAnalysisReport | null | undefined): boolean {
  if (!report) return false;
  return (
    report.stats.triangleCount >= ULTRA_HEAVY_TRIS ||
    report.stats.vertexCount >= ULTRA_HEAVY_VERTS
  );
}

/** Optional lighter defaults when user resets FX on a heavy import — not applied automatically. */
export function heavyModelVisualFxDefaults(visualFx: VisualFxSettings): VisualFxSettings {
  return {
    ...visualFx,
    bloomEnabled: false,
    dofEnabled: false,
    godRaysEnabled: false,
    weatherPreset: 'clear',
    materialDetailing: visualFx.materialDetailing,
    materialSmoothing: visualFx.materialSmoothing ?? 0.55,
  };
}

export function applyHeavyModelDefaultsToState(
  prev: AppState,
  modelId: string
): AppState {
  const model = prev.models.find((m) => m.id === modelId);
  if (!model?.modelAnalysis || !isHeavyModelReport(model.modelAnalysis)) {
    return prev;
  }
  if (model.userOverrodeHeavyFxDefaults) return prev;

  // RTX doubles post cost — off by default on heavy imports; user can re-enable.
  if (!prev.rtxModeEnabled) return prev;
  return {
    ...prev,
    rtxModeEnabled: false,
  };
}

export function markHeavyFxUserOverride(prev: AppState, modelId: string): AppState {
  return {
    ...prev,
    models: prev.models.map((m) =>
      m.id === modelId ? { ...m, userOverrodeHeavyFxDefaults: true } : m
    ),
  };
}
