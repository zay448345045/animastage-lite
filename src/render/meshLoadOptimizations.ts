import type { SkinnedMesh } from 'three';
import { yieldToMain } from '../utils/yieldMainThread';
import {
  applyHeavyMeshOptimizations,
  applyHeavyMeshOptimizationsAsync,
  applyModerateMeshOptimizations,
  countSkinnedMeshTriangles,
  shouldApplyHeavyMeshOptimizations,
  type HeavyMeshRuntimeState,
} from './heavyMesh';
import { capMaterialTextureResolutionAsync } from './heavyMesh/textureMemoryCap';
import { MODERATE_MESH_TRIANGLE_THRESHOLD } from './heavyMesh/types';

/** Show mesh first when triangle count exceeds this (async background optimizations). */
export const REVEAL_BEFORE_OPTIMIZE_THRESHOLD = 60_000;

/**
 * Geometry/texture optimizations only — does not touch skeleton, morphs, or physics data.
 */
export function runSafeMeshLoadOptimizations(
  mesh: SkinnedMesh,
  onProgress?: (message: string) => void
): HeavyMeshRuntimeState | null {
  const triangleCount = countSkinnedMeshTriangles(mesh);
  if (shouldApplyHeavyMeshOptimizations(triangleCount)) {
    return applyHeavyMeshOptimizations(mesh, onProgress);
  }
  applyModerateMeshOptimizations(mesh);
  return null;
}

/**
 * Time-sliced load optimizations — use after the mesh is visible so the UI does not freeze.
 */
export async function runSafeMeshLoadOptimizationsAsync(
  mesh: SkinnedMesh,
  onProgress?: (message: string) => void
): Promise<HeavyMeshRuntimeState | null> {
  const triangleCount = countSkinnedMeshTriangles(mesh);
  if (shouldApplyHeavyMeshOptimizations(triangleCount)) {
    return applyHeavyMeshOptimizationsAsync(mesh, onProgress);
  }
  if (triangleCount >= MODERATE_MESH_TRIANGLE_THRESHOLD) {
    onProgress?.('Capping oversized textures…');
    await capMaterialTextureResolutionAsync(mesh);
    await yieldToMain();
    applyModerateMeshOptimizations(mesh, { skipTextureCap: true });
    await yieldToMain();
    return null;
  }
  if (triangleCount >= REVEAL_BEFORE_OPTIMIZE_THRESHOLD) {
    onProgress?.('Capping oversized textures…');
    await capMaterialTextureResolutionAsync(mesh);
    return null;
  }
  return runSafeMeshLoadOptimizations(mesh, onProgress);
}

export function shouldRevealBeforeOptimize(mesh: SkinnedMesh): boolean {
  return countSkinnedMeshTriangles(mesh) >= REVEAL_BEFORE_OPTIMIZE_THRESHOLD;
}
