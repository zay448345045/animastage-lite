import type { AppState } from '../types';
import { qualityModeToPatch } from '../product/scene/qualityMode';

export const MOBILE_SAFE = {
  dprMin: 0.5,
  dprMax: 0.75,
  textureMax: 1024,
  physicsMaxSteps: 1,
} as const;

/** State patch when SAFE mode is active — does not touch engine internals. */
export function getMobileSafeStatePatch(prev: AppState): Partial<AppState> {
  const patch = qualityModeToPatch('performance');
  return {
    characterQuality: patch.characterQuality,
    physicsMode: patch.physicsMode,
    rtxModeEnabled: false,
    renderTier: 'lite',
    visualFx: { ...prev.visualFx, ...patch.visualFxPatch },
  };
}
