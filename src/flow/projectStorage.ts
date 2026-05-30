import type { AppState, ViewportFormat } from '../types';
import type { SavedProjectV1 } from './types';

const PROJECT_KEY = 'as_saved_project';

export function buildProjectFromState(
  appState: AppState,
  viewportFormat: ViewportFormat,
  name?: string
): SavedProjectV1 {
  return {
    version: 1,
    name: name ?? `Project ${new Date().toLocaleDateString()}`,
    savedAt: Date.now(),
    maxFrames: appState.maxFrames,
    currentFrame: appState.currentFrame,
    viewportFormat,
    cameraMode: appState.cameraMode,
    cameraKeyframes: appState.cameraKeyframes,
    visualFx: { ...appState.visualFx },
    characterQuality: appState.characterQuality,
    physicsMode: appState.physicsMode,
    mmdLite: { ...appState.mmdLite },
    models: appState.models.map((m) => ({
      name: m.name,
      keyframes: m.keyframes,
      morphs: { ...m.morphs },
      bones: JSON.parse(JSON.stringify(m.bones)),
      activeTemplateId: m.activeTemplateId ?? null,
      positionX: m.positionX,
      positionY: m.positionY,
      positionZ: m.positionZ,
    })),
  };
}

export function saveProjectToStorage(project: SavedProjectV1): void {
  localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
}

export function loadProjectFromStorage(): SavedProjectV1 | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProjectV1;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Restore timeline/camera — meshes must be re-uploaded. */
export function applyProjectToState(
  prev: AppState,
  project: SavedProjectV1
): AppState {
  const existingModels = prev.models;
  const models =
    existingModels.length > 0
      ? existingModels.map((m, i) => {
          const saved = project.models[i];
          if (!saved) return m;
          return {
            ...m,
            name: saved.name,
            keyframes: saved.keyframes,
            morphs: saved.morphs,
            bones: saved.bones,
            activeTemplateId: saved.activeTemplateId,
            positionX: saved.positionX,
            positionY: saved.positionY,
            positionZ: saved.positionZ,
            clipDirty: true,
          };
        })
      : [];

  return {
    ...prev,
    maxFrames: project.maxFrames,
    currentFrame: project.currentFrame,
    cameraMode: project.cameraMode,
    cameraKeyframes: project.cameraKeyframes,
    visualFx: { ...project.visualFx },
    characterQuality: project.characterQuality,
    physicsMode: project.physicsMode,
    mmdLite: { ...project.mmdLite },
    models,
    isPlaying: false,
  };
}
