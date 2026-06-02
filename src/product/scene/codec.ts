import type { AnimaStageScene } from './types';
import type { SavedProjectV1 } from '../../flow/types';
import { migrateV1ToV2 } from './serialize';

const FILE_EXT = '.animastage';

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function gzipCompressUtf8(text: string): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function gzipDecompressUtf8(bytes: Uint8Array): Promise<string | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  } catch {
    return null;
  }
}

export function isAnimaStageScene(value: unknown): value is AnimaStageScene {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return o.format === 'animastage' && o.version === 2;
}

export function parseSceneJson(raw: string): AnimaStageScene {
  const parsed = JSON.parse(raw) as unknown;
  if (isAnimaStageScene(parsed)) return parsed;
  const legacy = parsed as SavedProjectV1;
  if (legacy && typeof legacy === 'object' && legacy.version === 1) {
    return migrateV1ToV2(legacy);
  }
  throw new Error('Unrecognized scene file format');
}

export function serializeSceneJson(scene: AnimaStageScene): string {
  return JSON.stringify(scene, null, 2);
}

export function downloadSceneFile(scene: AnimaStageScene): void {
  const safeName = scene.name.replace(/[^\w\-]+/g, '_').slice(0, 48) || 'scene';
  const blob = new Blob([serializeSceneJson(scene)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}${FILE_EXT}`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function encodeSceneForUrl(scene: AnimaStageScene): Promise<string> {
  const json = JSON.stringify(scene);
  const gz = await gzipCompressUtf8(json);
  if (gz && gz.length < json.length) return `gz.${bytesToBase64Url(gz)}`;
  return `raw.${bytesToBase64Url(new TextEncoder().encode(json))}`;
}

export async function decodeSceneFromUrlPayload(payload: string): Promise<AnimaStageScene> {
  const dot = payload.indexOf('.');
  if (dot < 0) throw new Error('Invalid scene payload');
  const kind = payload.slice(0, dot);
  const data = payload.slice(dot + 1);
  const bytes = base64UrlToBytes(data);
  if (kind === 'gz') {
    const text = await gzipDecompressUtf8(bytes);
    if (!text) throw new Error('Could not decompress scene');
    return parseSceneJson(text);
  }
  if (kind === 'raw') return parseSceneJson(new TextDecoder().decode(bytes));
  throw new Error('Unknown scene encoding');
}

/** @deprecated */
export const parseProjectJson = parseSceneJson;
export const downloadProjectFile = downloadSceneFile;
export const encodeProjectForUrl = encodeSceneForUrl;
export const decodeProjectFromUrlPayload = decodeSceneFromUrlPayload;
