/** @deprecated — use ../camera-presets */
export {
  CAMERA_PRESET_CATALOG,
  CAMERA_PRESET_CATALOG as CAMERA_PRESETS,
  CAMERA_PRESET_TEMPLATES,
  getCameraPreset,
  getCameraPresetBySlug,
  getCameraPresetBySlug as getCameraPresetById,
  pickCameraPresetForModelCount,
} from '../camera-presets/presets';

import type { CameraPresetId } from '../scene/types';
import { CAMERA_PRESET_TEMPLATES } from '../camera-presets/presets';

export function getCameraTemplateId(preset: CameraPresetId): string | null {
  return CAMERA_PRESET_TEMPLATES[preset] ?? null;
}
