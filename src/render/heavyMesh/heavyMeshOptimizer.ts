import * as THREE from 'three';
import {
  countGeometryTriangles,
  optimizeVertexCache,
} from './vertexCacheOptimizer';
import {
  batchIdenticalMeshes,
  buildSkinnedMeshClusters,
} from './meshClusterSystem';
import {
  applyClusteredForwardLayers,
  applyLodToCluster,
  buildSkinnedLodLevels,
  cullMeshClusters,
  disposeLodResources,
  updateSkinnedLodState,
} from './skinnedLodPipeline';
import { MorphInfluenceDoubleBuffer, syncMorphDoubleBuffer } from './geometryDoubleBuffer';
import { HEAVY_MESH_MEMORY, estimateSkinnedMeshMemoryMb } from './memoryProfile';
import {
  capMaterialTextureResolution,
  capMaterialTextureResolutionAsync,
} from './textureMemoryCap';
import {
  HEAVY_MESH_USERDATA_KEY,
  type HeavyMeshRuntimeState,
  type SkinnedMeshCluster,
  MODERATE_MESH_TRIANGLE_THRESHOLD,
  ULTRA_HEAVY_TRIANGLE_THRESHOLD,
  VERTEX_CACHE_MAX_TRIANGLES,
} from './types';
import { yieldToMain } from '../../utils/yieldMainThread';

let ultraHeavyActive = false;
let ultraHeavyMeshCount = 0;
const ultraHeavyListeners = new Set<() => void>();

export function isUltraHeavyMeshActive(): boolean {
  return ultraHeavyActive;
}

export function subscribeUltraHeavyMesh(listener: () => void): () => void {
  ultraHeavyListeners.add(listener);
  return () => {
    ultraHeavyListeners.delete(listener);
  };
}

export function getUltraHeavyMeshSnapshot(): boolean {
  return ultraHeavyActive;
}

export function setUltraHeavyMeshActive(active: boolean): void {
  if (active) {
    ultraHeavyMeshCount += 1;
  } else {
    ultraHeavyMeshCount = Math.max(0, ultraHeavyMeshCount - 1);
  }
  const next = ultraHeavyMeshCount > 0;
  if (ultraHeavyActive === next) return;
  ultraHeavyActive = next;
  ultraHeavyListeners.forEach((l) => l());
}

export function countSkinnedMeshTriangles(mesh: THREE.SkinnedMesh): number {
  return countGeometryTriangles(mesh.geometry);
}

export function shouldApplyHeavyMeshOptimizations(triangleCount: number): boolean {
  return triangleCount >= ULTRA_HEAVY_TRIANGLE_THRESHOLD;
}

export type ModerateMeshOptimizeOptions = {
  skipTextureCap?: boolean;
  skipVertexCache?: boolean;
};

/** Safe for all large PMX — reorders indices + caps textures; same SkinnedMesh for physics. */
export function applyModerateMeshOptimizations(
  sourceMesh: THREE.SkinnedMesh,
  opts?: ModerateMeshOptimizeOptions
): boolean {
  const triangleCount = countSkinnedMeshTriangles(sourceMesh);
  if (
    triangleCount < MODERATE_MESH_TRIANGLE_THRESHOLD ||
    triangleCount >= ULTRA_HEAVY_TRIANGLE_THRESHOLD
  ) {
    return false;
  }

  const shouldCapTextures = !opts?.skipTextureCap;
  const shouldOptimizeVertexCache = !opts?.skipVertexCache;
  let didModify = false;

  if (shouldOptimizeVertexCache && triangleCount <= VERTEX_CACHE_MAX_TRIANGLES) {
    optimizeVertexCache(sourceMesh.geometry);
    didModify = true;
  }

  if (shouldCapTextures) {
    capMaterialTextureResolution(sourceMesh);
    didModify = true;
  }

  return didModify;
}

function shouldRunVertexCache(triangleCount: number): boolean {
  return triangleCount > 0 && triangleCount <= VERTEX_CACHE_MAX_TRIANGLES;
}

export function getHeavyMeshRuntime(
  mesh: THREE.SkinnedMesh
): HeavyMeshRuntimeState | null {
  return (mesh.userData[HEAVY_MESH_USERDATA_KEY] as HeavyMeshRuntimeState | undefined) ?? null;
}

function buildSingleMeshCluster(sourceMesh: THREE.SkinnedMesh): SkinnedMeshCluster {
  const { lodIndices, lodMorphIndex } = buildSkinnedLodLevels(sourceMesh.geometry);
  return {
    mesh: sourceMesh,
    meshlets: [],
    materialIndex: 0,
    lodIndices,
    lodMorphIndex,
  };
}

export type HeavyMeshOptimizeOptions = {
  skipTextureCap?: boolean;
  skipVertexCache?: boolean;
};

export type ModerateMeshOptimizeOptions = {
  skipTextureCap?: boolean;
  skipVertexCache?: boolean;
};

export function applyHeavyMeshOptimizations(
  sourceMesh: THREE.SkinnedMesh,
  onProgress?: (message: string) => void,
  opts?: HeavyMeshOptimizeOptions
): HeavyMeshRuntimeState | null {
  const triangleCount = countSkinnedMeshTriangles(sourceMesh);
  if (!shouldApplyHeavyMeshOptimizations(triangleCount)) {
    return null;
  }

  const beforeMb = estimateSkinnedMeshMemoryMb(sourceMesh);
  onProgress?.(`Memory profile: ~${beforeMb.toFixed(0)} MB (geometry + textures)`);

  if (!opts?.skipTextureCap) {
    onProgress?.('Capping oversized textures…');
    const capped = capMaterialTextureResolution(sourceMesh);
    if (capped > 0) {
      onProgress?.(`Downscaled ${capped} textures to ${HEAVY_MESH_MEMORY.maxTextureSize}px`);
    }
  }

  if (!opts?.skipVertexCache) {
    if (shouldRunVertexCache(triangleCount)) {
      onProgress?.('Vertex cache optimization…');
      optimizeVertexCache(sourceMesh.geometry);
    } else {
      onProgress?.('Skipping vertex cache (mesh too large for safe reorder)…');
    }
  }

  let renderRoot: THREE.Group | null = null;
  let clusters: SkinnedMeshCluster[];

  if (HEAVY_MESH_MEMORY.singleMeshMode) {
    onProgress?.('LOD setup (single mesh — no cluster duplication)…');
    clusters = [buildSingleMeshCluster(sourceMesh)];
    sourceMesh.visible = true;
  } else {
    onProgress?.('Building mesh clusters (meshlets)…');
    const builtClusters = buildSkinnedMeshClusters(sourceMesh);
    if (builtClusters.length === 0) return null;

    renderRoot = new THREE.Group();
    renderRoot.name = 'HeavyMeshRenderRoot';

    clusters = builtClusters.map((bc) => {
      const { lodIndices, lodMorphIndex } = buildSkinnedLodLevels(bc.mesh.geometry);
      renderRoot!.add(bc.mesh);
      return {
        mesh: bc.mesh,
        meshlets: bc.meshlets,
        materialIndex: bc.materialIndex,
        lodIndices,
        lodMorphIndex,
      };
    });

    onProgress?.('GPU instancing for rigid props…');
    const instanced = batchIdenticalMeshes(sourceMesh);
    for (const inst of instanced) {
      renderRoot.add(inst);
    }

    applyClusteredForwardLayers(renderRoot);
    sourceMesh.visible = false;
  }

  const morphSize = sourceMesh.morphTargetInfluences?.length ?? 0;
  const state: HeavyMeshRuntimeState = {
    sourceMesh,
    renderRoot,
    clusters,
    lod: { activeLod: 0, blend: 0, distance: 0 },
    triangleCount,
  };

  sourceMesh.userData[HEAVY_MESH_USERDATA_KEY] = state;
  if (morphSize > 0) {
    sourceMesh.userData.__heavyMeshMorphBuffer = new MorphInfluenceDoubleBuffer(morphSize);
  }

  sourceMesh.castShadow = true;
  sourceMesh.receiveShadow = true;

  for (const c of clusters) {
    if (c.mesh !== sourceMesh) {
      c.mesh.visible = true;
      c.mesh.castShadow = true;
      c.mesh.receiveShadow = true;
    }
  }

  setUltraHeavyMeshActive(true);
  const afterMb = estimateSkinnedMeshMemoryMb(sourceMesh);
  onProgress?.(`Heavy mesh ready (~${afterMb.toFixed(0)} MB). Single-mesh mode saves RAM vs cluster split.`);
  return state;
}

/** Time-sliced heavy pipeline — safe to run after the mesh is already visible. */
export async function applyHeavyMeshOptimizationsAsync(
  sourceMesh: THREE.SkinnedMesh,
  onProgress?: (message: string) => void
): Promise<HeavyMeshRuntimeState | null> {
  const triangleCount = countSkinnedMeshTriangles(sourceMesh);
  if (!shouldApplyHeavyMeshOptimizations(triangleCount)) {
    return null;
  }

  const beforeMb = estimateSkinnedMeshMemoryMb(sourceMesh);
  onProgress?.(`Memory profile: ~${beforeMb.toFixed(0)} MB (geometry + textures)`);

  onProgress?.('Capping oversized textures…');
  const capped = await capMaterialTextureResolutionAsync(sourceMesh);
  if (capped > 0) {
    onProgress?.(`Downscaled ${capped} textures to ${HEAVY_MESH_MEMORY.maxTextureSize}px`);
  }
  await yieldToMain();

  if (shouldRunVertexCache(triangleCount)) {
    onProgress?.('Vertex cache optimization…');
    optimizeVertexCache(sourceMesh.geometry);
    await yieldToMain();
  } else {
    onProgress?.('Skipping vertex cache (mesh too large for safe reorder)…');
  }

  await yieldToMain();
  return applyHeavyMeshOptimizations(sourceMesh, onProgress, {
    skipTextureCap: true,
    skipVertexCache: true,
  });
}

export function updateHeavyMeshRuntime(
  state: HeavyMeshRuntimeState,
  camera: THREE.Camera
): void {
  const root = state.renderRoot ?? state.sourceMesh;
  updateSkinnedLodState(root, camera, state.lod);

  for (const cluster of state.clusters) {
    applyLodToCluster(cluster, state.lod);
  }

  cullMeshClusters(state.clusters, camera, root);

  const morphBuffer = state.sourceMesh.userData.__heavyMeshMorphBuffer as
    | MorphInfluenceDoubleBuffer
    | undefined;
  const influences = state.sourceMesh.morphTargetInfluences;
  if (morphBuffer && influences && state.clusters.length > 1) {
    syncMorphDoubleBuffer(
      influences,
      morphBuffer,
      state.clusters.map((c) => c.mesh)
    );
  }
}

export function disposeHeavyMeshRuntime(state: HeavyMeshRuntimeState): void {
  state.renderRoot?.removeFromParent();
  if (HEAVY_MESH_MEMORY.singleMeshMode) {
    disposeLodResources(state.sourceMesh.geometry);
  } else {
    state.clusters.forEach((c) => {
      if (c.mesh !== state.sourceMesh) {
        c.mesh.geometry.dispose();
      }
    });
    disposeLodResources(state.sourceMesh.geometry);
  }
  state.sourceMesh.visible = true;
  delete state.sourceMesh.userData[HEAVY_MESH_USERDATA_KEY];
  delete state.sourceMesh.userData.__heavyMeshMorphBuffer;
  setUltraHeavyMeshActive(false);
}

export function resolveUltraHeavyShadowMapSize(requested: number): number {
  return Math.min(requested, HEAVY_MESH_MEMORY.csmShadowMapCap);
}

export function resolveUltraHeavyCsmCascades(): number {
  return HEAVY_MESH_MEMORY.csmCascades;
}
