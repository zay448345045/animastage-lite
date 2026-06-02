import type { AnimaStageProject } from './types';
import type { SavedProjectV1 } from '../flow/types';
import { migrateV1ToV2 } from './buildProject';

const PROJECT_FILE_EXT = '.animastage';

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
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

export function isAnimaStageProject(value: unknown): value is AnimaStageProject {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return o.format === 'animastage' && o.version === 2;
}

export function parseProjectJson(raw: string): AnimaStageProject {
  const parsed = JSON.parse(raw) as unknown;
  if (isAnimaStageProject(parsed)) return parsed;
  const legacy = parsed as SavedProjectV1;
  if (legacy && typeof legacy === 'object' && legacy.version === 1) {
    return migrateV1ToV2(legacy);
  }
  throw new Error('Unrecognized project file format');
}

export function serializeProject(project: AnimaStageProject): string {
  return JSON.stringify(project, null, 2);
}

export function downloadProjectFile(project: AnimaStageProject): void {
  const safeName = project.name.replace(/[^\w\-]+/g, '_').slice(0, 48) || 'scene';
  const blob = new Blob([serializeProject(project)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}${PROJECT_FILE_EXT}`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Encode for URL ?scene= (gzip when available, else raw base64 JSON). */
export async function encodeProjectForUrl(project: AnimaStageProject): Promise<string> {
  const json = JSON.stringify(project);
  const gz = await gzipCompressUtf8(json);
  if (gz && gz.length < json.length) {
    return `gz.${bytesToBase64Url(gz)}`;
  }
  return `raw.${bytesToBase64Url(new TextEncoder().encode(json))}`;
}

export async function decodeProjectFromUrlPayload(payload: string): Promise<AnimaStageProject> {
  const dot = payload.indexOf('.');
  if (dot < 0) throw new Error('Invalid scene payload');
  const kind = payload.slice(0, dot);
  const data = payload.slice(dot + 1);
  const bytes = base64UrlToBytes(data);

  if (kind === 'gz') {
    const text = await gzipDecompressUtf8(bytes);
    if (!text) throw new Error('Could not decompress scene');
    return parseProjectJson(text);
  }
  if (kind === 'raw') {
    return parseProjectJson(new TextDecoder().decode(bytes));
  }
  throw new Error('Unknown scene encoding');
}
