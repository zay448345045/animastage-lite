import type { AppState } from '../../types';
import type { ProductCameraMode } from '../camera/CameraController';
import { DEFAULT_VISUAL_FX } from '../../templates/animationTemplates';
import type { CameraStudioSettings } from '../../types';

export interface BeautifyPatch {
  visualFx: AppState['visualFx'];
  characterQuality: AppState['characterQuality'];
  cameraStudio: Partial<CameraStudioSettings>;
  cameraMode: AppState['cameraMode'];
  suggestedCameraMode: ProductCameraMode;
}

/** Luma-style instant polish — settings + camera studio only. */
export function buildAutoBeautifyPatch(
  modelCount: number,
  hasCameraVmd: boolean
): BeautifyPatch {
  const suggestedCameraMode: ProductCameraMode =
    modelCount >= 2 ? 'duo' : hasCameraVmd ? 'follow' : 'closeUp';

  return {
    visualFx: {
      ...DEFAULT_VISUAL_FX,
      bloomEnabled: true,
      bloomIntensity: 0.35,
      dofEnabled: false,
      godRaysEnabled: false,
      ssaoEnabled: false,
      smaaEnabled: true,
      vignetteEnabled: true,
      vignetteIntensity: 0.25,
      postFxStackEnabled: true,
      colorGrade: 'cinematic',
      scenePreset: 'stage',
      lightPreset: 'natural',
      environmentIntensity: 1,
    },
    characterQuality: 'hd',
    cameraMode: hasCameraVmd ? 'mmd' : 'free',
    cameraStudio: {
      autoFocus: true,
      focusTarget: modelCount >= 2 ? 'full' : 'face',
      modestAngle: true,
      orbitPreset: 'face_portrait',
    },
    suggestedCameraMode,
  };
}
