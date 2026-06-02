import type { CameraPresetId } from '../scene/types';

export type CameraPresetKey = 'orbit' | 'duoFocus' | 'closeUp' | 'cinematicSweep';

export interface CameraPresetDefinition {
  key: CameraPresetKey;
  label: string;
  /** Existing animation template id (camera track only). */
  templateId: string;
  presetId: CameraPresetId;
}

export const CAMERA_PRESET_CATALOG: CameraPresetDefinition[] = [
  { key: 'orbit', label: 'Orbit', templateId: 'cam_orbit_half', presetId: 'orbit' },
  { key: 'duoFocus', label: 'Duo Focus', templateId: 'cam_duo_wide', presetId: 'duo' },
  { key: 'closeUp', label: 'Close-up', templateId: 'cam_portrait_close', presetId: 'close-up' },
  {
    key: 'cinematicSweep',
    label: 'Cinematic Sweep',
    templateId: 'cam_fly_epic',
    presetId: 'follow',
  },
];

export const CAMERA_PRESET_TEMPLATES: Record<CameraPresetId, string> = {
  orbit: 'cam_orbit_half',
  duo: 'cam_duo_wide',
  'close-up': 'cam_portrait_close',
  follow: 'cam_fly_epic',
};

export function getCameraPreset(key: CameraPresetKey): CameraPresetDefinition | undefined {
  return CAMERA_PRESET_CATALOG.find((p) => p.key === key);
}

export function getCameraPresetBySlug(id: string): CameraPresetDefinition | undefined {
  return CAMERA_PRESET_CATALOG.find((p) => p.key === id || p.presetId === id);
}

export function pickCameraPresetForModelCount(count: number): CameraPresetKey {
  return count >= 2 ? 'duoFocus' : 'orbit';
}
