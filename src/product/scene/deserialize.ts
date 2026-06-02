import type { AppState } from '../../types';
import type { AnimaStageScene } from './types';
import { qualityModeToPatch } from './qualityMode';
import { getCameraTemplateId } from '../templates/cameraPresets';

export interface RestoreSceneOptions {
  viewerSafe?: boolean;
}

/**
 * Restore scene document into AppState via public state shape only.
 * Does not touch VMD evaluation, physics stepping, or render loop.
 */
export function deserializeScene(
  prev: AppState,
  scene: AnimaStageScene,
  options?: RestoreSceneOptions
): AppState {
  const viewerSafe = options?.viewerSafe ?? false;
  const qPatch = qualityModeToPatch(scene.settings.quality, viewerSafe);

  const existingModels = prev.models;
  const models =
    existingModels.length > 0
      ? existingModels.map((m, i) => {
          const saved = scene.models.find((x) => x.id === m.id) ?? scene.models[i];
          if (!saved) return m;
          const [px, py, pz] = saved.position;
          return {
            ...m,
            name: saved.name,
            keyframes: saved.keyframes,
            morphs: saved.morphs,
            bones: saved.bones,
            activeTemplateId: saved.activeTemplateId,
            positionX: px,
            positionY: py,
            positionZ: pz,
            clipDirty: true,
          };
        })
      : [];

  return {
    ...prev,
    maxFrames: scene.settings.maxFrames,
    currentFrame: scene.settings.currentFrame,
    cameraMode: scene.camera.mode,
    cameraKeyframes: scene.camera.keyframes,
    cameraVmdFileName: scene.camera.cameraVmdFileName,
    hasCameraVmd: Boolean(scene.camera.cameraVmdFileName),
    visualFx: {
      ...scene.fx.visualFx,
      bloomEnabled: viewerSafe ? false : scene.fx.bloom,
      dofEnabled: viewerSafe ? false : scene.fx.dof,
      ...qPatch.visualFxPatch,
    },
    characterQuality: viewerSafe ? 'standard' : scene.settings.characterQuality,
    physicsMode: viewerSafe ? 'playtime' : scene.settings.physicsMode,
    mmdLite: { ...scene.settings.mmdLite },
    rtxModeEnabled: viewerSafe ? false : scene.fx.rtxModeEnabled,
    models,
    isPlaying: viewerSafe ? true : prev.isPlaying,
  };
}

export function getCameraTemplateForScene(scene: AnimaStageScene): string | null {
  return getCameraTemplateId(scene.camera.preset);
}
