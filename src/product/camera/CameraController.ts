import type { CameraMode } from '../../types';
import { cameraPresetManager } from '../camera-presets';
import type { CameraPresetKey } from '../camera-presets/presets';

export type ProductCameraMode = 'follow' | 'duo' | 'orbit' | 'closeUp';

export interface CameraControllerBridge {
  getModelCount: () => number;
  getHasCameraVmd: () => boolean;
  applyCameraTemplate: (templateId: string) => void;
  setCameraMode: (mode: CameraMode) => void;
  patchCameraStudio: (patch: Record<string, unknown>) => void;
}

const MODE_TO_PRESET: Record<ProductCameraMode, CameraPresetKey> = {
  follow: 'orbit',
  duo: 'duoFocus',
  orbit: 'orbit',
  closeUp: 'closeUp',
};

const MODE_STUDIO_PATCH: Record<ProductCameraMode, Record<string, unknown>> = {
  follow: { autoFocus: true, focusTarget: 'body', modestAngle: true, liveOrbit: false },
  duo: { autoFocus: true, focusTarget: 'full', modestAngle: true, liveOrbit: false },
  orbit: { autoFocus: true, focusTarget: 'body', modestAngle: true, liveOrbit: true, orbitPreset: 'orbit180' },
  closeUp: { autoFocus: true, focusTarget: 'face', modestAngle: true, liveOrbit: false, orbitPreset: 'face_portrait' },
};

/**
 * Cinemachine-lite wrapper — camera params + templates only, no render-loop changes.
 */
export class CameraController {
  private activeMode: ProductCameraMode = 'orbit';

  getMode(): ProductCameraMode {
    return this.activeMode;
  }

  applyMode(mode: ProductCameraMode, bridge: CameraControllerBridge): void {
    this.activeMode = mode;

    if (mode === 'follow' && bridge.getHasCameraVmd()) {
      bridge.setCameraMode('mmd');
      bridge.patchCameraStudio(MODE_STUDIO_PATCH.follow);
      return;
    }

    bridge.setCameraMode('free');
    bridge.patchCameraStudio(MODE_STUDIO_PATCH[mode]);
    cameraPresetManager.apply(MODE_TO_PRESET[mode], {
      applyCameraTemplate: bridge.applyCameraTemplate,
      getModelCount: bridge.getModelCount,
    });
  }

  applyAuto(bridge: CameraControllerBridge): void {
    const count = bridge.getModelCount();
    if (count >= 2) this.applyMode('duo', bridge);
    else if (bridge.getHasCameraVmd()) this.applyMode('follow', bridge);
    else this.applyMode('orbit', bridge);
  }
}

export const cameraController = new CameraController();
