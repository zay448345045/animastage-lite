import type { AppState, CharacterQuality, PhysicsMode } from '../types';
import type { QualityMode } from './types';

export interface QualityModePatch {
  characterQuality: CharacterQuality;
  physicsMode: PhysicsMode;
  rtxModeEnabled: boolean;
  visualFxPatch: Partial<AppState['visualFx']>;
}

/** Map product quality mode → runtime GPU / FX settings. */
export function qualityModeToPatch(mode: QualityMode, viewerSafe = false): QualityModePatch {
  if (viewerSafe || mode === 'performance') {
    return {
      characterQuality: 'standard',
      physicsMode: 'playtime',
      rtxModeEnabled: false,
      visualFxPatch: {
        bloomEnabled: false,
        dofEnabled: false,
        ssaoEnabled: false,
      },
    };
  }
  if (mode === 'balanced') {
    return {
      characterQuality: 'hd',
      physicsMode: 'playtime',
      rtxModeEnabled: false,
      visualFxPatch: {
        bloomEnabled: true,
        dofEnabled: false,
        ssaoEnabled: false,
      },
    };
  }
  return {
    characterQuality: 'hd',
    physicsMode: 'anytime',
    rtxModeEnabled: false,
    visualFxPatch: {},
  };
}

export function inferQualityMode(state: Pick<AppState, 'characterQuality' | 'physicsMode' | 'rtxModeEnabled' | 'visualFx'>): QualityMode {
  if (
    state.characterQuality === 'standard' &&
    !state.rtxModeEnabled &&
    !state.visualFx.bloomEnabled &&
    !state.visualFx.dofEnabled
  ) {
    return 'performance';
  }
  if (state.characterQuality === 'hd' && state.physicsMode === 'playtime' && !state.rtxModeEnabled) {
    return 'balanced';
  }
  return 'quality';
}

export function fxTierFromQualityMode(mode: QualityMode): 'high' | 'medium' | 'low' {
  if (mode === 'performance') return 'low';
  if (mode === 'balanced') return 'medium';
  return 'high';
}
