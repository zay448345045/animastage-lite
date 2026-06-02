import type { AnimaStageScene } from '../scene/types';
import { encodeSceneForUrl, parseSceneJson } from '../scene/codec';

const SHARE_PREFIX = 'as_share_';
const INLINE_MAX = 14_000;

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function saveSharePayload(id: string, json: string): void {
  localStorage.setItem(`${SHARE_PREFIX}${id}`, json);
}

export function loadSharePayload(id: string): string | null {
  try {
    return localStorage.getItem(`${SHARE_PREFIX}${id}`);
  } catch {
    return null;
  }
}

export function buildViewerPath(scene: AnimaStageScene, encoded: string): string {
  if (encoded.length <= INLINE_MAX) {
    return `/viewer?scene=${encodeURIComponent(encoded)}`;
  }
  const id = randomId();
  saveSharePayload(id, JSON.stringify(scene));
  return `/viewer?id=${encodeURIComponent(id)}`;
}

export async function createShareLink(scene: AnimaStageScene): Promise<string> {
  const encoded = await encodeSceneForUrl(scene);
  const path = buildViewerPath(scene, encoded);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${origin}${base}${path}`;
}

export async function loadSceneFromViewerSearch(search: string): Promise<AnimaStageScene> {
  const params = new URLSearchParams(search);
  const sceneParam = params.get('scene');
  if (sceneParam) {
    const { decodeSceneFromUrlPayload } = await import('../scene/codec');
    return decodeSceneFromUrlPayload(sceneParam);
  }
  const id = params.get('id');
  if (id) {
    const raw = loadSharePayload(id);
    if (!raw) throw new Error('Shared scene expired or not found on this device');
    return parseSceneJson(raw);
  }
  throw new Error('Missing ?scene= or ?id= in viewer URL');
}

export async function copyShareLinkToClipboard(link: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = link;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

/** @deprecated */
export const loadProjectFromViewerSearch = loadSceneFromViewerSearch;
export const createShareLinkFromProject = createShareLink;
