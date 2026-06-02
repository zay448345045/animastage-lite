import type { AppState } from '../types';

/** Second character: physics schedule only — visual FX / quality stay user-controlled. */
export function patchStateForMultiCharacterLoad(prev: AppState): Partial<AppState> {
  if (prev.models.length < 1) return {};

  if (prev.physicsMode === 'anytime') {
    return { physicsMode: 'playtime' };
  }

  return {};
}
