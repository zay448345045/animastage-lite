export {
  auditMmdSkinAttributes,
  ensureMmdSkinAttributesForWebGPU,
  isMmdSkinnedMeshWebGpuReady,
  isWebGpuSkinIndexAttribute,
  isWebGpuSkinWeightAttribute,
  MMD_WEBGPU_SKIN_ATTRS_KEY,
  MMD_WEBGPU_SKELETON_BOUND_KEY,
} from './mmdSkinAttributeManager';
export {
  cleanLegacyWebGlMaterialState,
  createMmdSkinnedToonNodeMaterial,
  isMmdSkinnedNodeMaterial,
  prepareMmdSkinnedNodeMaterial,
  stripLegacyMaterialTypeFlags,
} from './mmdSkinnedNodeMaterial';
export {
  bindMmdSkinnedSkeleton,
  compileMmdSkinnedMeshWebGPU,
  prepareMmdSkinnedMeshForWebGPU,
  updateMmdSkinnedBoneMatrices,
} from './mmdSkinnedWebGPUBinder';

// Scene optimization utilities
export {
  // Constants
  PROXY_LAYER,
  DEFAULT_MAX_ANISOTROPY,
  MaterialTier,
  // Renderer
  createOptimizedRenderer,
  applyPixelRatioCap,
  DynamicResolutionGovernor,
  // Geometry & Draw Calls
  estimateGeometryBudget,
  createStaticBatchedGroup,
  createInstancedDecorations,
  freezeStaticObjectTree,
  unfreezeObjectTree,
  // Materials & Textures
  downgradeMaterial,
  applyMaterialDowngrade,
  clampTextureAnisotropy,
  applyAnisotropyBudget,
  auditTransparentMaterials,
  optimizeMaterialTransparency,
  // Lighting & Shadows
  configureRendererShadows,
  ShadowUpdateManager,
  fitDirectionalShadowCamera,
  computeObjectBounds,
  buildLowPolyProxyGeometry,
  createShadowProxyPair,
  syncShadowProxyTransform,
  applyShadowProxiesToMap,
  // Raycasting
  createPickProxy,
  raycastPickProxies,
  // Loading & Disposal
  createOptimizedGLTFLoader,
  optimizeLoadedGLTFScene,
  disposeMaterial,
  disposeObject3D,
  disposeMapPropsRoot,
  // Scene Complexity & Analysis
  estimateSceneComplexity,
  cleanupScene,
  // Main thread scheduling
  runWorkInSlices,
  scheduleIdleWork,
  // Types
  type GeometryBudget,
  type StaticBatchedGroupResult,
  type CreateOptimizedRendererOptions,
  type DynamicResolutionGovernorOptions,
  type ApplyMaterialDowngradeOptions,
  type FreezeStaticObjectTreeOptions,
  type CreateStaticBatchedGroupOptions,
  type TransparencyAudit,
  type OptimizeMaterialTransparencyOptions,
  type ConfigureRendererShadowsOptions,
  type ShadowConfig,
  type FitDirectionalShadowCameraOptions,
  type ShadowProxyPair,
  type CreateShadowProxyPairOptions,
  type ApplyShadowProxiesToMapOptions,
  type CreatePickProxyOptions,
  type RaycastPickProxiesOptions,
  type CreateOptimizedGLTFLoaderOptions,
  type OptimizeLoadedGLTFSceneOptions,
  type DisposeObject3DOptions,
  type SceneComplexityReport,
} from './sceneOptim';
