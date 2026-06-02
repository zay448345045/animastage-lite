export {
  ULTRA_HEAVY_TRIANGLE_THRESHOLD,
  MODERATE_MESH_TRIANGLE_THRESHOLD,
  VERTEX_CACHE_MAX_TRIANGLES,
  HEAVY_MESHLET_SIZE,
  HEAVY_MESH_USERDATA_KEY,
  type HeavyMeshRuntimeState,
  type SkinnedMeshCluster,
} from './types';
export {
  optimizeVertexCache,
  countGeometryTriangles,
} from './vertexCacheOptimizer';
export {
  buildSkinnedMeshClusters,
  batchIdenticalMeshes,
} from './meshClusterSystem';
export {
  buildSkinnedLodLevels,
  updateSkinnedLodState,
  applyLodToCluster,
  cullMeshClusters,
  applyClusteredForwardLayers,
  disposeLodResources,
} from './skinnedLodPipeline';
export {
  MorphInfluenceDoubleBuffer,
  syncMorphDoubleBuffer,
} from './geometryDoubleBuffer';
export {
  applyHeavyMeshOptimizations,
  applyHeavyMeshOptimizationsAsync,
  applyModerateMeshOptimizations,
  updateHeavyMeshRuntime,
  disposeHeavyMeshRuntime,
  countSkinnedMeshTriangles,
  shouldApplyHeavyMeshOptimizations,
  getHeavyMeshRuntime,
  isUltraHeavyMeshActive,
  setUltraHeavyMeshActive,
  subscribeUltraHeavyMesh,
  getUltraHeavyMeshSnapshot,
  resolveUltraHeavyShadowMapSize,
  resolveUltraHeavyCsmCascades,
} from './heavyMeshOptimizer';
export { HEAVY_MESH_MEMORY, estimateGeometryBytes, estimateSkinnedMeshMemoryMb } from './memoryProfile';
export { capMaterialTextureResolution } from './textureMemoryCap';
export { default as CascadedShadowLighting, useCascadedShadowsEnabled } from './CascadedShadowLighting';
export { default as StaticGroundShadow } from './StaticGroundShadow';
