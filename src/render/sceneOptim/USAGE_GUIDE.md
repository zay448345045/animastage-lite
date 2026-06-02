# Scene Optimization Utilities - Integration Guide

All scene optimization utilities from the external `webgl-scene-optim` project have been integrated into your project at `src/render/sceneOptim/`.

## Quick Start

### Import from render module:
```typescript
import {
  createOptimizedRenderer,
  freezeStaticObjectTree,
  DynamicResolutionGovernor,
  disposeMaterial,
  // ... other utilities
} from '../render';
```

Or import directly from sceneOptim:
```typescript
import {
  createOptimizedRenderer,
  freezeStaticObjectTree,
} from '../render/sceneOptim';
```

---

## Available Utilities

### 1. **Renderer Initialization** (3 functions)

#### `createOptimizedRenderer(canvasParent?, opts?)`
Creates a WebGL renderer optimized for dense scenes.
```typescript
const renderer = createOptimizedRenderer(document.body, {
  maxPixelRatio: 1.5,
  antialias: false,        // Use FXAA post-pass instead
  alpha: false,            // Opaque canvas
  precision: 'mediump',    // Mobile-friendly
  powerPreference: 'high-performance',
});
```

#### `applyPixelRatioCap(renderer, max?)`
Clamps device pixel ratio to prevent fill-rate meltdown on 4K displays.
```typescript
const dpr = applyPixelRatioCap(renderer, 1.5);
```

#### `DynamicResolutionGovernor`
Automatically lowers renderer DPR when FPS drops, restores when stable.
```typescript
const dprGov = new DynamicResolutionGovernor(renderer, {
  maxPixelRatio: 1.5,
  minPixelRatio: 0.5,
  lowFps: 30,
  highFps: 56,
  onResize: () => camera.aspect = renderer.aspect,
});

// Per frame:
dprGov.tick(currentFps, performance.now());
```

---

### 2. **Geometry & Draw Calls** (5 functions)

#### `estimateGeometryBudget(geometries)`
Get vertex and index counts for memory budgeting.
```typescript
const budget = estimateGeometryBudget([geo1, geo2, geo3]);
console.log(`${budget.vertices} vertices, ${budget.indices} indices`);
```

#### `createStaticBatchedGroup(opts)`
Create a BatchedMesh for static props (r166+). Reduces draw calls.
```typescript
const { batched, instanceIds } = createStaticBatchedGroup({
  material: new THREE.MeshStandardMaterial(),
  items: [
    { geometry: treeMesh.geometry, matrix: matrix1 },
    { geometry: treeMesh.geometry, matrix: matrix2 },
    // ... more trees
  ],
});
scene.add(batched);
```

#### `createInstancedDecorations(geometry, material, matrices)`
Create InstancedMesh when geometry + material are identical.
```typescript
const instanced = createInstancedDecorations(
  foliageGeo,
  leafMaterial,
  [mat1, mat2, mat3, ...]
);
scene.add(instanced);
```

#### `freezeStaticObjectTree(root, opts?)`
Stop per-frame matrix recompute on static geometry (keeps SkinnedMesh dynamic).
```typescript
freezeStaticObjectTree(cityProps, { skipSkinned: true });
```

#### `unfreezeObjectTree(root)`
Restore matrix updates if needed later.
```typescript
unfreezeObjectTree(cityProps);
```

---

### 3. **Materials & Textures** (6 functions)

#### `downgradeMaterial(source, tier)`
Downgrade MeshStandardMaterial → Phong/Basic for better perf.
```typescript
const backdropMaterial = downgradeMaterial(
  sourceStandardMat,
  MaterialTier.BACKDROP  // 'backdrop' | 'mid' | 'hero'
);
```

#### `applyMaterialDowngrade(root, opts?)`
Walk scene and downgrade materials by distance/names.
```typescript
applyMaterialDowngrade(scene, {
  cameraPosition: camera.position,
  backdropDistance: 40,    // Beyond 40 units → BACKDROP tier
  heroNames: ['character', 'main_prop'],
});
```

#### `clampTextureAnisotropy(texture, renderer, max?)`
Reduce anisotropy for distant textures.
```typescript
clampTextureAnisotropy(texture, renderer, 4);  // max 4×
```

#### `applyAnisotropyBudget(root, renderer, max?)`
Apply anisotropy cap to entire material tree.
```typescript
applyAnisotropyBudget(importedScene, renderer, 4);
```

#### `auditTransparentMaterials(root)`
Find materials breaking Early-Z (transparent + depthWrite issues).
```typescript
const issues = auditTransparentMaterials(scene);
for (const issue of issues) {
  console.warn(`${issue.mesh.name}: ${issue.reason}`);
}
```

#### `optimizeMaterialTransparency(material, opts?)`
Convert "fake transparent" → opaque for better depth prepass.
```typescript
optimizeMaterialTransparency(material, {
  alphaTest: 0.5,
  opacityThreshold: 0.99,
  preferCutout: true,
});
```

---

### 4. **Lighting & Shadows** (8 functions + 1 class)

#### `configureRendererShadows(renderer, opts?)`
Setup shadow map type (VSM or PCF).
```typescript
const shadowConfig = configureRendererShadows(renderer, {
  useVSM: true,      // VSMShadowMap (better quality, more perf)
  autoUpdate: false, // Manual updates
});
```

#### `ShadowUpdateManager`
Track and invalidate shadow maps efficiently.
```typescript
const shadowMgr = new ShadowUpdateManager(renderer);
shadowMgr.trackLight(directionalLight);
shadowMgr.invalidate();
shadowMgr.update(sceneBounds);
```

#### `fitDirectionalShadowCamera(light, worldBounds, opts?)`
Tight ortho frustum for directional shadows.
```typescript
const bounds = computeObjectBounds(scene);
fitDirectionalShadowCamera(dirLight, bounds, {
  padding: 4,
  far: 120,
});
```

#### `computeObjectBounds(root)`
Get AABB of entire scene/subtree.
```typescript
const box = computeObjectBounds(scene);
console.log(`Scene bounds: ${box.getSize(new THREE.Vector3())}`);
```

#### `buildLowPolyProxyGeometry(sourceGeometry, targetTriangles?)`
Simplify geometry using SimplifyModifier.
```typescript
const simplifiedGeo = buildLowPolyProxyGeometry(complexGeo, 2000);
```

#### `createShadowProxyPair(sourceMesh, opts?)`
Create low-poly shadow caster + visible mesh.
```typescript
const { visibleMesh, shadowProxy, group } = createShadowProxyPair(heavyMesh, {
  targetTriangles: 2000,
  receiveShadow: true,
});
scene.add(group);
```

#### `syncShadowProxyTransform(visibleMesh, shadowProxy)`
Manually sync transforms if needed.
```typescript
syncShadowProxyTransform(mesh, proxy);
```

#### `applyShadowProxiesToMap(root, mainCamera, opts?)`
Auto-create low-poly shadow proxies for heavy meshes.
```typescript
const proxies = applyShadowProxiesToMap(importedMap, camera, {
  minTriangles: 5000,
  targetTriangles: 2000,
});
```

---

### 5. **Raycasting** (2 functions)

#### `createPickProxy(sourceMesh, opts?)`
Invisible low-poly or bounding-box raycast target.
```typescript
const pickProxy = createPickProxy(heavyMesh, {
  useBounds: true,
  targetTriangles: 500,
});
scene.add(pickProxy);
pickProxies.push(pickProxy);
```

#### `raycastPickProxies(event, camera, renderer, pickProxies, opts?)`
Raycast against pick proxies.
```typescript
document.addEventListener('click', (event) => {
  const hits = raycastPickProxies(event, camera, renderer, pickProxies);
  for (const hit of hits) {
    console.log('Picked:', hit);
  }
});
```

---

### 6. **Loading & Disposal** (5 functions)

#### `createOptimizedGLTFLoader(renderer, loadingManager?, opts?)`
GLTFLoader with KTX2 + Meshopt support.
```typescript
const loader = createOptimizedGLTFLoader(renderer, manager, {
  transcoderPath: './vendor/three/libs/basis/',
});
loader.load('model.glb', (gltf) => {
  optimizeLoadedGLTFScene(gltf.scene, { renderer, materialDowngrade: true });
  scene.add(gltf.scene);
});
```

#### `optimizeLoadedGLTFScene(scene, opts?)`
Apply all optimizations to loaded GLTF.
```typescript
optimizeLoadedGLTFScene(importedScene, {
  renderer,
  mainCamera: camera,
  shadowProxies: true,
  materialDowngrade: true,
  maxAnisotropy: 4,
});
```

#### `disposeMaterial(material, disposedTextureUuids?)`
Properly free material + textures from GPU.
```typescript
disposeMaterial(oldMaterial);  // Prevents VRAM leaks
```

#### `disposeObject3D(object, opts?)`
Recursively remove object and free GPU resources.
```typescript
disposeObject3D(oldModel, {
  scene,
  removeFromParent: true,
});
```

#### `disposeMapPropsRoot(propsRoot, scene)`
Clear entire map props tree.
```typescript
disposeMapPropsRoot(cityPropsRoot, scene);
```

---

### 7. **Main Thread Scheduling** (2 functions)

#### `runWorkInSlices(tasks, sliceBudgetMs?)`
Run sync tasks in ≤8ms chunks with yields.
```typescript
await runWorkInSlices([
  () => enhanceMmdMaterials(mesh),
  () => applyCharacterMaterialQuality(mesh, renderer),
], 6);  // 6ms per slice
```

#### `scheduleIdleWork(fn, options?)`
Schedule heavy work when browser is idle (with fallback to rAF).
```typescript
scheduleIdleWork(() => {
  // Heavy work here
}, { timeoutMs: 2000 });
```

---

## Constants

```typescript
export const PROXY_LAYER = 31;  // Layer for shadow/pick proxies
export const DEFAULT_MAX_ANISOTROPY = 4;
export const MaterialTier = {
  HERO: 'hero',           // Full PBR, near camera
  MID: 'mid',             // Phong, medium distance
  BACKDROP: 'backdrop',   // Basic, far distance
};
```

---

## Scene Complexity & Analysis

### `estimateSceneComplexity(scene)`
Estimate total complexity for memory budgeting and optimization decisions.

```typescript
import { estimateSceneComplexity } from '../render';

const loader = new GLTFLoader();
loader.load('scene.glb', (gltf) => {
  const report = estimateSceneComplexity(gltf.scene);
  
  console.log(`Meshes: ${report.meshCount}`);
  console.log(`Vertices: ${report.totalVertices}`);
  console.log(`Indices: ${report.totalIndices}`);
  console.log(`Geometries: ${report.geometryCount}`);
  console.log(`Materials: ${report.materialCount}`);
  console.log(`Estimated VRAM: ~${report.estimatedMemoryMb.toFixed(1)}MB`);
  
  // Decide optimization tier based on complexity
  if (report.estimatedMemoryMb > 100) {
    console.log('Heavy scene — apply aggressive optimizations');
    applyMaterialDowngrade(gltf.scene, { backdropDistance: 30 });
  }
});
```

### `cleanupScene(scene)`
Clear entire scene graph and dispose all GPU resources. Prevents VRAM leaks when switching scenes.

```typescript
import { cleanupScene, optimizeLoadedGLTFScene } from '../render';

// When switching to a new level/location:
cleanupScene(currentScene);

// Load new scene
const loader = new GLTFLoader();
loader.load('new-location.glb', (gltf) => {
  optimizeLoadedGLTFScene(gltf.scene, {
    renderer,
    mainCamera,
    shadowProxies: true,
    materialDowngrade: true,
  });
  scene.add(gltf.scene);
});
```

---

## Example: Complete Scene Optimization

```typescript
import {
  createOptimizedRenderer,
  DynamicResolutionGovernor,
  freezeStaticObjectTree,
  applyMaterialDowngrade,
  applyShadowProxiesToMap,
  createOptimizedGLTFLoader,
  optimizeLoadedGLTFScene,
  computeObjectBounds,
  fitDirectionalShadowCamera,
  configureRendererShadows,
} from '../render';

// 1. Create optimized renderer
const renderer = createOptimizedRenderer(document.body, {
  maxPixelRatio: 1.5,
  powerPreference: 'high-performance',
});

// 2. Setup dynamic resolution
const dprGov = new DynamicResolutionGovernor(renderer, {
  maxPixelRatio: 1.5,
  lowFps: 30,
  highFps: 56,
});

// 3. Configure shadows
configureRendererShadows(renderer, { useVSM: true, autoUpdate: false });

// 4. Load and optimize GLTF
const loader = createOptimizedGLTFLoader(renderer);
loader.load('city.glb', (gltf) => {
  const { scene } = gltf;
  
  // Optimize materials by distance
  applyMaterialDowngrade(scene, {
    cameraPosition: camera.position,
    backdropDistance: 40,
  });
  
  // Freeze static geometry
  freezeStaticObjectTree(scene, { skipSkinned: true });
  
  // Setup shadow proxies for heavy meshes
  applyShadowProxiesToMap(scene, camera, { minTriangles: 5000 });
  
  // Fit shadow camera to bounds
  const bounds = computeObjectBounds(scene);
  fitDirectionalShadowCamera(dirLight, bounds);
  
  sceneGraph.add(scene);
});

// 5. Per-frame updates
function animate() {
  requestAnimationFrame(animate);
  
  const fps = calculateFPS();
  dprGov.tick(fps);
  
  renderer.render(scene, camera);
}
```

---

## File Structure

```
src/render/sceneOptim/
├── webglSceneOptim.ts      (main implementation)
├── mainThreadScheduler.ts  (runWorkInSlices, scheduleIdleWork)
└── index.ts               (exports)
```

All exports are also available from `src/render/index.ts` for convenience.

---

## Notes

- **No physics/animation/timeline changes** — all utilities are purely for rendering optimization
- **BatchedMesh / InstancedMesh** require Three.js r166+
- **SimplifyModifier** used for low-poly proxy generation
- **KTX2Loader + Meshopt** for compressed GLTF loading
- All functions are **fully type-safe** with TypeScript support

