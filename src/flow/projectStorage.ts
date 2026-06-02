import type { AppState, ViewportFormat } from '../types';
import {
  serializeScene,
  deserializeScene,
} from '../product/scene';
import type { AnimaStageScene } from '../product/scene/types';

/** @deprecated use product/scene */
export function buildProjectFromState(
  appState: AppState,
  viewportFormat: ViewportFormat,
  name?: string,
  sourceDemoId?: string | null
): AnimaStageScene {
  return serializeScene(appState, viewportFormat, { name, sourceDemoId });
}

export {
  saveSceneToStorage as saveProjectToStorage,
  loadSceneFromStorage as loadProjectFromStorage,
} from '../product/scene/storage';

export function applyProjectToState(prev: AppState, project: AnimaStageScene): AppState {
  return deserializeScene(prev, project);
}

export { hasStoredScene };
