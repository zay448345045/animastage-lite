import type {
  BufferAttribute,
  Group,
  SkinnedMesh,
  Vector3,
} from 'three';

/** Triangle count at which ultra-heavy GPU pipeline activates. */
export const ULTRA_HEAVY_TRIANGLE_THRESHOLD = 450_000;

/** Vertex cache + texture cap for large (non-ultra) imports. */
export const MODERATE_MESH_TRIANGLE_THRESHOLD = 120_000;

/** Full vertex-cache reorder is O(n²) — skip above this to avoid multi-minute freezes. */
export const VERTEX_CACHE_MAX_TRIANGLES = 60_000;

export const HEAVY_MESHLET_SIZE = 64;

export interface MeshletBounds {
  id: number;
  center: Vector3;
  radius: number;
  indexStart: number;
  indexCount: number;
}

export interface SkinnedMeshCluster {
  mesh: SkinnedMesh;
  meshlets: MeshletBounds[];
  materialIndex: number;
  lodIndices: BufferAttribute[];
  lodMorphIndex: number | null;
}

export interface SkinnedLodState {
  activeLod: number;
  blend: number;
  distance: number;
}

export interface HeavyMeshRuntimeState {
  sourceMesh: SkinnedMesh;
  renderRoot: Group | null;
  clusters: SkinnedMeshCluster[];
  lod: SkinnedLodState;
  triangleCount: number;
}

export const HEAVY_MESH_USERDATA_KEY = '__heavyMeshRuntime';
