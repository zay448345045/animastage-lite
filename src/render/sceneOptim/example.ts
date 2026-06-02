/**
 * Example: Complete Scene Optimization Pipeline
 * 
 * This example demonstrates how to use all the scene optimization utilities
 * in a realistic workflow.
 */

import * as THREE from 'three';
import {
  // Renderer setup
  createOptimizedRenderer,
  applyPixelRatioCap,
  DynamicResolutionGovernor,
  
  // Geometry optimization
  freezeStaticObjectTree,
  estimateGeometryBudget,
  createInstancedDecorations,
  
  // Material optimization
  applyMaterialDowngrade,
  applyAnisotropyBudget,
  auditTransparentMaterials,
  optimizeMaterialTransparency,
  
  // Shadow optimization
  configureRendererShadows,
  computeObjectBounds,
  fitDirectionalShadowCamera,
  applyShadowProxiesToMap,
  ShadowUpdateManager,
  
  // Raycasting
  createPickProxy,
  raycastPickProxies,
  
  // Loading
  createOptimizedGLTFLoader,
  optimizeLoadedGLTFScene,
  
  // Cleanup
  disposeObject3D,
  
  // Scheduling
  runWorkInSlices,
} from '../render';

// ============================================================================
// 1. SETUP OPTIMIZED RENDERER
// ============================================================================

export function setupOptimizedRenderer(canvas: HTMLElement): {
  renderer: THREE.WebGLRenderer;
  dprGov: DynamicResolutionGovernor;
} {
  // Create with sensible defaults for heavy scenes
  const renderer = createOptimizedRenderer(canvas, {
    maxPixelRatio: 1.5,
    antialias: false,          // Use FXAA post-pass instead
    alpha: false,              // Opaque canvas
    precision: 'mediump',      // Mobile-friendly register usage
    powerPreference: 'high-performance',
  });

  // Enable dynamic resolution scaling
  const dprGov = new DynamicResolutionGovernor(renderer, {
    maxPixelRatio: 1.5,
    minPixelRatio: 0.5,
    lowFps: 30,
    highFps: 56,
    cooldownMs: 1100,
  });

  return { renderer, dprGov };
}

// ============================================================================
// 2. SETUP SHADOWS
// ============================================================================

export function setupShadows(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  directionalLight: THREE.DirectionalLight
): ShadowUpdateManager {
  configureRendererShadows(renderer, {
    useVSM: true,      // Better quality, more perf than PCF
    autoUpdate: false, // Manual control to avoid unnecessary updates
  });

  // Setup light for shadows
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera = new THREE.OrthographicCamera(-40, 40, 40, -40, 0.5, 120);

  // Create shadow manager
  const shadowMgr = new ShadowUpdateManager(renderer);
  shadowMgr.trackLight(directionalLight);

  // Fit shadow camera to scene bounds
  const bounds = computeObjectBounds(scene);
  fitDirectionalShadowCamera(directionalLight, bounds, {
    padding: 4,
    near: 0.5,
    far: 120,
  });

  return shadowMgr;
}

// ============================================================================
// 3. OPTIMIZE LOADED SCENE
// ============================================================================

export async function optimizeLoadedScene(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  options: {
    freezeStatics?: boolean;
    optimizeMaterials?: boolean;
    setupShadowProxies?: boolean;
    optimizeTransparency?: boolean;
  } = {}
): Promise<void> {
  const tasks: Array<() => void> = [];

  // Task 1: Freeze static geometry
  if (options.freezeStatics !== false) {
    tasks.push(() => {
      freezeStaticObjectTree(scene, { skipSkinned: true });
      console.log('[Optimize] Froze static geometry');
    });
  }

  // Task 2: Optimize materials by distance
  if (options.optimizeMaterials !== false) {
    tasks.push(() => {
      applyMaterialDowngrade(scene, {
        cameraPosition: camera instanceof THREE.PerspectiveCamera ? camera.position : undefined,
        backdropDistance: 40,
        heroNames: ['character', 'mainCharacter', 'player'],
      });
      console.log('[Optimize] Downgraded materials by distance');
    });
  }

  // Task 3: Clamp texture anisotropy
  tasks.push(() => {
    applyAnisotropyBudget(scene, renderer, 4);
    console.log('[Optimize] Applied anisotropy budget');
  });

  // Task 4: Audit and fix transparency
  if (options.optimizeTransparency !== false) {
    tasks.push(() => {
      const issues = auditTransparentMaterials(scene);
      if (issues.length > 0) {
        console.log(`[Optimize] Found ${issues.length} transparency issues`);
        for (const issue of issues) {
          console.log(`  - ${issue.mesh.name}: ${issue.reason}`);
          if (issue.material) {
            optimizeMaterialTransparency(issue.material);
          }
        }
      }
    });
  }

  // Task 5: Setup shadow proxies
  if (options.setupShadowProxies !== false) {
    tasks.push(() => {
      if (camera instanceof THREE.PerspectiveCamera) {
        const proxies = applyShadowProxiesToMap(scene, camera, {
          minTriangles: 5000,
          targetTriangles: 2000,
        });
        console.log(`[Optimize] Created ${proxies.length} shadow proxies`);
      }
    });
  }

  // Run all optimizations with time-slicing to avoid main-thread blocking
  await runWorkInSlices(tasks, 8); // 8ms per slice
  console.log('[Optimize] All optimizations complete');
}

// ============================================================================
// 4. SETUP RAYCASTING
// ============================================================================

export function setupRaycastPicking(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  onPick: (mesh: THREE.Object3D | THREE.Mesh) => void
): THREE.Mesh[] {
  const pickProxies: THREE.Mesh[] = [];

  // Create pick proxies for all heavy meshes
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) {
      const tri = obj.geometry.index
        ? obj.geometry.index.count / 3
        : (obj.geometry.getAttribute('position')?.count || 0) / 3;

      // Only create proxies for significant meshes
      if (tri > 1000) {
        const proxy = createPickProxy(obj, { useBounds: true, targetTriangles: 500 });
        pickProxies.push(proxy);
        scene.add(proxy);
      }
    }
  });

  // Setup click handler
  renderer.domElement.addEventListener('click', (event) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    
    const hits = raycastPickProxies(event, camera, renderer, pickProxies);
    for (const hit of hits) {
      onPick(hit);
    }
  });

  console.log(`[Raycasting] Created ${pickProxies.length} pick proxies`);
  return pickProxies;
}

// ============================================================================
// 5. ESTIMATE SCENE COMPLEXITY
// ============================================================================

export function estimateSceneComplexity(scene: THREE.Scene): {
  meshCount: number;
  totalVertices: number;
  totalIndices: number;
  estimatedMemoryMb: number;
} {
  const geometries: THREE.BufferGeometry[] = [];
  let meshCount = 0;

  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      meshCount++;
      if (obj.geometry && !geometries.includes(obj.geometry)) {
        geometries.push(obj.geometry);
      }
    }
  });

  const budget = estimateGeometryBudget(geometries);
  
  // Rough estimate: 12 bytes per vertex (position) + 4 bytes per index
  const estimatedMemoryMb = (budget.vertices * 12 + budget.indices * 4) / (1024 * 1024);

  return {
    meshCount,
    totalVertices: budget.vertices,
    totalIndices: budget.indices,
    estimatedMemoryMb,
  };
}

// ============================================================================
// 6. CLEANUP
// ============================================================================

export function cleanupScene(scene: THREE.Scene): void {
  const children = [...scene.children];
  for (const child of children) {
    disposeObject3D(child, { scene, removeFromParent: true });
  }
  console.log('[Cleanup] Scene cleared');
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In your main component or setup:

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.getElementById('canvas') as HTMLElement;

// 1. Setup renderer
const { renderer, dprGov } = setupOptimizedRenderer(canvas);

// 2. Setup lights and shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
const shadowMgr = setupShadows(renderer, scene, directionalLight);

// 3. Load model
const loader = createOptimizedGLTFLoader(renderer);
loader.load('model.glb', async (gltf) => {
  const { scene: importedScene } = gltf;
  
  // Optimize everything
  await optimizeLoadedScene(importedScene, camera, renderer);
  
  // Estimate complexity
  const complexity = estimateSceneComplexity(importedScene);
  console.log(`Scene: ${complexity.meshCount} meshes, ~${complexity.estimatedMemoryMb.toFixed(1)}MB`);
  
  // Setup picking
  const pickProxies = setupRaycastPicking(importedScene, camera, renderer, (hit) => {
    console.log('Picked:', hit.name || hit);
  });
  
  scene.add(importedScene);
});

// 4. Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update dynamic resolution based on FPS
  const fps = calculateCurrentFPS();
  dprGov.tick(fps);
  
  // Update shadows if needed
  shadowMgr.update(computeObjectBounds(scene));
  
  renderer.render(scene, camera);
}

animate();

// 5. Cleanup on scene change
window.addEventListener('beforeunload', () => {
  cleanupScene(scene);
});
*/
