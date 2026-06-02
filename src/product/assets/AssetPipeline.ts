import type { ModelAnalysisReport } from '../../analyzer/types';
import { isHeavyModelReport, isUltraHeavyModelReport } from '../../perf/heavyModelPolicy';
import type { AppState, CharacterQuality } from '../../types';

const CACHE_PREFIX = 'as_asset_cache_';

export interface AssetOptimizationHints {
  isHeavy: boolean;
  isUltraHeavy: boolean;
  suggestedQuality: CharacterQuality;
  disableRtx: boolean;
  message: string | null;
}

export interface AssetPipelinePatch {
  characterQuality?: CharacterQuality;
  rtxModeEnabled?: boolean;
  physicsMode?: AppState['physicsMode'];
  mmdLite?: Partial<AppState['mmdLite']>;
}

/**
 * Product-side asset pipeline — detects heavy imports and suggests settings only.
 */
export class AssetPipeline {
  analyze(report: ModelAnalysisReport | null | undefined): AssetOptimizationHints {
    if (!report) {
      return {
        isHeavy: false,
        isUltraHeavy: false,
        suggestedQuality: 'hd',
        disableRtx: false,
        message: null,
      };
    }
    const isHeavy = isHeavyModelReport(report);
    const isUltraHeavy = isUltraHeavyModelReport(report);
    return {
      isHeavy,
      isUltraHeavy,
      suggestedQuality: isUltraHeavy ? 'standard' : isHeavy ? 'hd' : 'hd',
      disableRtx: isHeavy,
      message: isHeavy
        ? 'Heavy model detected — optimization flags enabled'
        : null,
    };
  }

  buildAutoPatch(
    report: ModelAnalysisReport | null | undefined,
    prev: AppState
  ): AssetPipelinePatch | null {
    const hints = this.analyze(report);
    if (!hints.isHeavy && !hints.isUltraHeavy) return null;

    return {
      characterQuality: hints.suggestedQuality,
      rtxModeEnabled: hints.disableRtx ? false : prev.rtxModeEnabled,
      physicsMode: 'playtime',
      mmdLite: {
        stablePhys: true,
        freezeTwistBones: hints.isUltraHeavy,
      },
    };
  }

  cacheModelKey(modelFileName: string, report: ModelAnalysisReport): void {
    try {
      localStorage.setItem(
        `${CACHE_PREFIX}${modelFileName}`,
        JSON.stringify({ report, cachedAt: Date.now() })
      );
    } catch {
      /* ignore */
    }
  }

  loadCachedReport(modelFileName: string): ModelAnalysisReport | null {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${modelFileName}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { report: ModelAnalysisReport };
      return parsed.report ?? null;
    } catch {
      return null;
    }
  }
}

export const assetPipeline = new AssetPipeline();
