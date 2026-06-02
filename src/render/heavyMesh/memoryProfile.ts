import type { BufferGeometry, Object3D, SkinnedMesh, Texture } from 'three';

/** Memory-oriented defaults for ultra-heavy PMX (450k+ tris). */
export const HEAVY_MESH_MEMORY = {
  /** Single visible mesh — no per-material cluster clones. */
  singleMeshMode: true,
  /** Skip geomorph morph target (~12 bytes × vertexCount). */
  enableGeomorph: false,
  /** LOD index buffers: 100% + 50% (skip middle level). */
  lodLevels: 2,
  /** CSM shadow map edge length cap. */
  csmShadowMapCap: 1024,
  /** Number of CSM cascades. */
  csmCascades: 2,
  /** Downscale material textures above this edge (px). */
  maxTextureSize: 1024,
} as const;

let runtimeMaxTextureSize = HEAVY_MESH_MEMORY.maxTextureSize;

export function getRuntimeMaxTextureSize(): number {
  return runtimeMaxTextureSize;
}

export function setRuntimeMaxTextureSize(size: number): void {
  runtimeMaxTextureSize = Math.max(256, Math.min(4096, Math.floor(size)));
}

export function estimateGeometryBytes(geometry: BufferGeometry): number {
  let bytes = 0;
  for (const key in geometry.attributes) {
    const attr = geometry.attributes[key]!;
    bytes += attr.array.byteLength;
  }
  const morphs = geometry.morphAttributes.position;
  if (morphs) {
    for (const m of morphs) {
      bytes += m.array.byteLength;
    }
  }
  const index = geometry.getIndex();
  if (index) bytes += index.array.byteLength;
  return bytes;
}

export function estimateSkinnedMeshMemoryMb(mesh: SkinnedMesh): number {
  let bytes = estimateGeometryBytes(mesh.geometry);
  mesh.traverse((obj) => {
    const meshObj = obj as SkinnedMesh;
    if (!meshObj.isMesh) return;
    const raw = meshObj.material;
    const mats = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const mat of mats) {
      if (!mat) continue;
      for (const key of ['map', 'normalMap', 'emissiveMap', 'alphaMap', 'specularMap'] as const) {
        const tex = (mat as Record<string, Texture | undefined>)[key];
        if (tex?.image) {
          const w = (tex.image as { width?: number }).width ?? 0;
          const h = (tex.image as { height?: number }).height ?? 0;
          bytes += w * h * 4;
        }
      }
    }
  });
  return bytes / (1024 * 1024);
}
