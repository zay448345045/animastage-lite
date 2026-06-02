import type { AppState } from '../types';
import type { AnimaStageProject } from './types';
import { qualityModeToPatch } from './qualityMode';
import { CAMERA_PRESET_TEMPLATES } from './presets';

/** Restore timeline, camera, FX — meshes must already be in scene (or from demo). */
export function applyAnimaStageProject(
  prev: AppState,
  project: AnimaStageProject,
  options?: { viewerSafe?: boolean }
): AppState {
  const viewerSafe = options?.viewerSafe ?? false;
  const qPatch = qualityModeToPatch(project.settings.quality, viewerSafe);

  const existingModels = prev.models;
  const models =
    existingModels.length > 0
      ? existingModels.map((m, i) => {
          const saved =
            project.models.find((x) => x.id === m.id) ?? project.models[i];
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
    maxFrames: project.settings.maxFrames,
    currentFrame: project.settings.currentFrame,
    cameraMode: project.camera.mode,
    cameraKeyframes: project.camera.keyframes,
    cameraVmdFileName: project.camera.cameraVmdFileName,
    hasCameraVmd: Boolean(project.camera.cameraVmdFileName),
    visualFx: {
      ...project.fx.visualFx,
      bloomEnabled: viewerSafe ? false : project.fx.bloom,
      dofEnabled: viewerSafe ? false : project.fx.dof,
      ...qPatch.visualFxPatch,
    },
    characterQuality: viewerSafe ? 'standard' : project.settings.characterQuality,
    physicsMode: viewerSafe ? 'playtime' : project.settings.physicsMode,
    mmdLite: { ...project.settings.mmdLite },
    rtxModeEnabled: viewerSafe ? false : project.fx.rtxModeEnabled,
    models,
    isPlaying: viewerSafe,
  };
}

export function getCameraTemplateForProject(project: AnimaStageProject): string | null {
  return CAMERA_PRESET_TEMPLATES[project.camera.preset] ?? null;
}
