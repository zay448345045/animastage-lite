import type { QualityMode } from '../scene/types';
import type { AppState } from '../../types';

/** FX preset = settings patch only (no engine internals). */
export interface FxPresetDef {
  id: string;
  label: string;
  qualityMode: QualityMode;
  visualFxPatch: Partial<AppState['visualFx']>;
}

export const FX_PRESETS: FxPresetDef[] = [
  {
    id: 'safe',
    label: 'Safe (Shorts)',
    qualityMode: 'performance',
    visualFxPatch: { bloomEnabled: false, dofEnabled: false, ssaoEnabled: false },
  },
  {
    id: 'balanced',
    label: 'Balanced',
    qualityMode: 'balanced',
    visualFxPatch: { bloomEnabled: true, dofEnabled: false },
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    qualityMode: 'quality',
    visualFxPatch: { bloomEnabled: true, dofEnabled: true },
  },
];

export function getFxPreset(id: string): FxPresetDef | undefined {
  return FX_PRESETS.find((p) => p.id === id);
}
