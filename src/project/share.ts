import type { AnimaStageProject } from './types';
import { encodeProjectForUrl, parseProjectJson } from './codec';

const SHARE_STORAGE_PREFIX = 'as_share_';
const INLINE_SCENE_MAX_LEN = 14_000;

function randomShareId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function saveSharePayload(id: string, json: string): void {
  try {
    localStorage.setItem(`${SHARE_STORAGE_PREFIX}${id}`, json);
  } catch (e) {
    console.warn('[share] localStorage full', e);
    throw e;
  }
}

export function loadSharePayload(id: string): string | null {
  try {
    return localStorage.getItem(`${SHARE_STORAGE_PREFIX}${id}`);
  } catch {
    return null;
  }
}

export function buildViewerPath(project: AnimaStageProject, encodedScene: string): string {
  if (encodedScene.length <= INLINE_SCENE_MAX_LEN) {
    return `/viewer?scene=${encodeURIComponent(encodedScene)}`;
  }
  const id = randomShareId();
  saveSharePayload(id, JSON.stringify(project));
  return `/viewer?id=${encodeURIComponent(id)}`;
}

export async function createShareLink(project: AnimaStageProject): Promise<string> {
  const encoded = await encodeProjectForUrl(project);
  const path = buildViewerPath(project, encoded);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${origin}${base}${path}`;
}

export async function loadProjectFromViewerSearch(search: string): Promise<AnimaStageProject> {
  const params = new URLSearchParams(search);
  const scene = params.get('scene');
  if (scene) {
    const { decodeProjectFromUrlPayload } = await import('./codec');
    return decodeProjectFromUrlPayload(scene);
  }
  const id = params.get('id');
  if (id) {
    const raw = loadSharePayload(id);
    if (!raw) throw new Error('Shared scene expired or not found on this device');
    return parseProjectJson(raw);
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
