import type { ModelAnalysisReport } from '../analyzer/types';
import type { AppState, CharacterQuality, PhysicsMode } from '../types';
import type { MmdLiteConfig } from '../types';

export interface AnalyzerAutoFixPatch {
  physicsMode?: PhysicsMode;
  characterQuality?: CharacterQuality;
  mmdLite?: Partial<MmdLiteConfig>;
}

export function suggestAnalyzerAutoFix(
  report: ModelAnalysisReport
): AnalyzerAutoFixPatch {
  const patch: AnalyzerAutoFixPatch = {};
  const { stats, issues } = report;

  const heavyMesh =
    stats.vertexCount > 80_000 ||
    stats.triangleCount > 120_000 ||
    issues.some((i) => i.id === 'perf_vertices' || i.id === 'perf_triangles');

  const heavyPhysics =
    stats.rigidBodyCount > 64 ||
    issues.some((i) => i.id === 'perf_physics' || i.id === 'perf_rigid_bodies');

  if (heavyMesh) {
    patch.characterQuality = 'standard';
  }

  if (heavyPhysics || heavyMesh) {
    patch.physicsMode = 'off';
    patch.mmdLite = {
      stablePhys: true,
      physicsWind: 0,
      physicsSwing: 0,
    };
  }

  return patch;
}

export function applyAnalyzerAutoFixToState(prev: AppState, patch: AnalyzerAutoFixPatch): AppState {
  return {
    ...prev,
    ...(patch.physicsMode !== undefined ? { physicsMode: patch.physicsMode } : {}),
    ...(patch.characterQuality !== undefined
      ? { characterQuality: patch.characterQuality }
      : {}),
    ...(patch.mmdLite
      ? { mmdLite: { ...prev.mmdLite, ...patch.mmdLite } }
      : {}),
  };
}
