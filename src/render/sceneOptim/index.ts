/**
 * Scene optimization utilities
 * Combined module with mainThreadScheduler + webglSceneOptim patterns
 */

// Main thread scheduling
export { runWorkInSlices, scheduleIdleWork } from './mainThreadScheduler';

// WebGL scene optimization
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
} from './webglSceneOptim';
