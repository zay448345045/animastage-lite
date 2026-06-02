import type { AnimaStageScene } from './types';
import { parseSceneJson } from './codec';

const STORAGE_KEY = 'as_saved_project_v2';

export function saveSceneToStorage(scene: AnimaStageScene): void {
  try {
    const json = JSON.stringify(scene);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.setItem('as_saved_project', json);
  } catch {
    /* ignore */
  }
}

export function loadSceneFromStorage(): AnimaStageScene | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('as_saved_project');
    if (!raw) return null;
    return parseSceneJson(raw);
  } catch {
    return null;
  }
}

export function hasStoredScene(): boolean {
  return loadSceneFromStorage() !== null;
}
