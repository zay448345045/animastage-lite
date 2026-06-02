import type { CameraPresetKey } from './presets';
import { getCameraPreset, pickCameraPresetForModelCount } from './presets';

/** Product bridge — camera only, via existing template API. */
export interface CameraPresetBridge {
  applyCameraTemplate: (templateId: string) => void;
  getModelCount?: () => number;
}

/**
 * CameraPresetManager — modifies camera params only through animation templates.
 * Does not touch VMD, physics, or render loop.
 */
export class CameraPresetManager {
  apply(presetKey: CameraPresetKey, bridge: CameraPresetBridge): boolean {
    const preset = getCameraPreset(presetKey);
    if (!preset) return false;
    bridge.applyCameraTemplate(preset.templateId);
    return true;
  }

  applyAuto(bridge: CameraPresetBridge): boolean {
    const count = bridge.getModelCount?.() ?? 1;
    return this.apply(pickCameraPresetForModelCount(count), bridge);
  }
}

export const cameraPresetManager = new CameraPresetManager();
