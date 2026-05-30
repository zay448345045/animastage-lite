import {
  createMMDTextureManager,
  pathVariants,
  type ProcessedMMDFiles,
} from '../utils/mmdFiles';
import type { DemoPackManifest } from './types';

function resolvePublicUrl(relative: string, baseUrl: string): string {
  const trimmed = relative.replace(/^\.\//, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(trimmed, base).href;
}

function registerHttpPath(fileMap: Record<string, string>, relPath: string, url: string) {
  for (const variant of pathVariants(relPath)) {
    fileMap[variant] = url;
    fileMap[variant.toLowerCase()] = url;
  }
  const base = relPath.replace(/\\/g, '/').split('/').pop();
  if (base) {
    for (const variant of pathVariants(base)) {
      fileMap[variant] = url;
      fileMap[variant.toLowerCase()] = url;
    }
  }
}

/**
 * Loads a hosted demo pack from `public/demos/<id>/manifest.json`.
 * Uses HTTP URLs (no blob spam) — textures resolve via fileMap + LoadingManager.
 */
export async function loadDemoPack(
  manifestUrl: string
): Promise<ProcessedMMDFiles | { error: string }> {
  let response: Response;
  try {
    response = await fetch(manifestUrl);
  } catch {
    return { error: 'Could not reach demo pack.' };
  }

  if (!response.ok) {
    return { error: `Demo pack not found (${response.status}).` };
  }

  let manifest: DemoPackManifest;
  try {
    manifest = (await response.json()) as DemoPackManifest;
  } catch {
    return { error: 'Invalid demo manifest JSON.' };
  }

  if (!manifest.model) {
    return { error: 'Manifest missing model path.' };
  }

  const folderBase = manifestUrl.replace(/\/manifest\.json$/i, '/');
  const fileMap: Record<string, string> = {};

  for (const rel of manifest.files ?? []) {
    const url = resolvePublicUrl(rel, folderBase);
    registerHttpPath(fileMap, rel, url);
  }

  const modelRel = manifest.model;
  const modelUrl = resolvePublicUrl(modelRel, folderBase);
  registerHttpPath(fileMap, modelRel, modelUrl);

  const modelFileName = modelRel.replace(/\\/g, '/').split('/').pop() ?? 'model.pmx';
  const manager = createMMDTextureManager(fileMap);

  const motions = manifest.motions ?? [];
  const vmdBlobUrls = motions.map((rel) => resolvePublicUrl(rel, folderBase));
  const vmdFileNames = motions.map((rel) => rel.replace(/\\/g, '/').split('/').pop() ?? rel);

  for (let i = 0; i < motions.length; i++) {
    registerHttpPath(fileMap, motions[i], vmdBlobUrls[i]);
  }

  let cameraVmdBlobUrl: string | null = null;
  let cameraVmdFileName: string | null = null;
  if (manifest.camera) {
    cameraVmdBlobUrl = resolvePublicUrl(manifest.camera, folderBase);
    cameraVmdFileName =
      manifest.camera.replace(/\\/g, '/').split('/').pop() ?? manifest.camera;
    registerHttpPath(fileMap, manifest.camera, cameraVmdBlobUrl);
  }

  return {
    name: manifest.name,
    blobUrl: modelUrl,
    modelFileName,
    manager,
    fileMap,
    vmdBlobUrls,
    vmdFileNames,
    cameraVmdBlobUrl,
    cameraVmdFileName,
    hasCameraVmd: Boolean(manifest.camera),
  };
}
