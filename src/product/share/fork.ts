import type { AnimaStageScene } from '../scene/types';
import { parseSceneJson } from '../scene/codec';

const FORK_STORAGE_KEY = 'as_fork_scene';

export function stashForkScene(scene: AnimaStageScene): void {
  try {
    localStorage.setItem(FORK_STORAGE_KEY, JSON.stringify(scene));
  } catch {
    /* ignore */
  }
}

export function consumeForkScene(): AnimaStageScene | null {
  try {
    const raw = localStorage.getItem(FORK_STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(FORK_STORAGE_KEY);
    return parseSceneJson(raw);
  } catch {
    return null;
  }
}

/** Viral loop — viewer opens editor with scene forked. */
export function navigateToEditorFork(scene: AnimaStageScene): void {
  stashForkScene(scene);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  window.location.href = `${base}/app?fork=1`;
}

export function hasForkParam(search: string): boolean {
  return new URLSearchParams(search).get('fork') === '1';
}
