import type { AppState } from '../../types';

export interface PerfDiagnosticItem {
  id: string;
  cause: string;
  suggestion: string;
}

export interface PerfDiagnostics {
  causes: string[];
  suggestions: string[];
  items: PerfDiagnosticItem[];
}

/** Scene + settings analysis — read-only, does not touch animation pipeline. */
export function analyzeScenePerformance(appState: AppState): PerfDiagnostics {
  const items: PerfDiagnosticItem[] = [];
  const model = appState.models.find((m) => m.id === appState.selectedObjectId) ?? appState.models[0];
  const report = model?.modelAnalysis;

  if (appState.physicsMode === 'anytime') {
    items.push({
      id: 'physics_anytime',
      cause: 'Physics runs continuously (Anytime mode)',
      suggestion: 'Set Physics → Only on Playback while editing',
    });
  }

  if (report) {
    const { stats, issues } = report;
    if (stats.rigidBodyCount > 64 || issues.some((i) => i.id.startsWith('perf_physics'))) {
      items.push({
        id: 'physics_heavy',
        cause: `Heavy physics setup (${stats.rigidBodyCount} rigid bodies)`,
        suggestion: 'Use Performance → Medium or Low physics quality',
      });
    }
    if (stats.vertexCount > 80_000 || stats.triangleCount > 120_000) {
      items.push({
        id: 'mesh_heavy',
        cause: `High polygon count (${stats.vertexCount.toLocaleString()} verts)`,
        suggestion: 'Use 9:16 Lite mode or lower character quality',
      });
    }
    if (stats.boneCount > 200) {
      items.push({
        id: 'bones_heavy',
        cause: `Complex skeleton (${stats.boneCount} bones)`,
        suggestion: 'Prefer Playtime physics; avoid extra IK layers while scrubbing',
      });
    }
  }

  if (appState.visualFx.bloomEnabled || appState.visualFx.dofEnabled) {
    items.push({
      id: 'postfx',
      cause: 'Bloom / depth-of-field post-processing enabled',
      suggestion: 'Disable bloom & DOF in Visual FX, or click Fix performance',
    });
  }

  if (appState.rtxModeEnabled) {
    items.push({
      id: 'rtx',
      cause: 'RTX stack enabled',
      suggestion: 'Turn off RTX for editing; use RTX only for final export',
    });
  }

  if (appState.visualFx.weatherPreset && appState.visualFx.weatherPreset !== 'clear') {
    items.push({
      id: 'weather',
      cause: `Weather particles (${appState.visualFx.weatherPreset})`,
      suggestion: 'Set weather to Clear in MMD RTX panel',
    });
  }

  if (appState.characterQuality === 'ultra' || appState.characterQuality === 'high') {
    items.push({
      id: 'quality',
      cause: `Character quality: ${appState.characterQuality}`,
      suggestion: 'Switch to HD or Performance quality in export menu',
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'ok',
      cause: 'No major scene issues detected',
      suggestion: 'If FPS is still low, try Physics → Low and disable post-FX',
    });
  }

  return {
    items,
    causes: items.map((i) => i.cause),
    suggestions: [...new Set(items.map((i) => i.suggestion))],
  };
}
