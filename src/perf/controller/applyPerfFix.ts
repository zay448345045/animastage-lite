import type { AppState, VisualFxSettings } from '../../types';
import type { PhysicsQualityTier } from '../perfTypes';
import { resetAdaptiveQuality } from '../adaptiveQuality';

export interface PerfFixResult {
  physicsQuality: PhysicsQualityTier;
  visualFx: VisualFxSettings;
  rtxModeEnabled: boolean;
  physicsMode: AppState['physicsMode'];
  characterQuality: AppState['characterQuality'];
}

/** Safe one-click tuning — does not change animation/VMD/IK/morph evaluation. */
export function buildPerfFixPatch(appState: AppState): PerfFixResult {
  resetAdaptiveQuality();

  return {
    physicsQuality: 'medium',
    physicsMode: appState.physicsMode === 'anytime' ? 'playtime' : appState.physicsMode,
    rtxModeEnabled: false,
    characterQuality:
      appState.characterQuality === 'ultra' ? 'high' : appState.characterQuality,
    visualFx: {
      ...appState.visualFx,
      bloomEnabled: false,
      dofEnabled: false,
      weatherPreset: 'clear',
      godRaysEnabled: false,
    },
  };
}
