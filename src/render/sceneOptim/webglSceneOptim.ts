/**
 * webgl-scene-optim — Three.js WebGL 2.0 scene utilities
 * Adapted from external optimization patterns for dense scenes (450k+ tris, dynamic lights, map props).
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier.js';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Layer for invisible shadow / pick proxies (main camera must disable it). */
export const PROXY_LAYER = 31;

/** Sensible default — 16× anisotropy on 4K rarely pays off vs fill-rate cost. */
export const DEFAULT_MAX_ANISOTROPY = 4;

/** Material importance tiers for downgrade strategy. */
export const MaterialTier = Object.freeze({
  HERO: 'hero',           // full PBR, near camera / interactive
  MID: 'mid',             // Phong / simplified PBR
  BACKDROP: 'backdrop',   // Lambert / Basic, no real-time lights
});

type MaterialTierValue = typeof MaterialTier[keyof typeof MaterialTier];

// Reusable helpers to avoid allocations
const _box3 = new THREE.Box3();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _ndc = new THREE.Vector2();
const _ray = new THREE.Raycaster();

// =============================================================================
// 1. RENDERER INIT & RESOLUTION
// =============================================================================

export interface CreateOptimizedRendererOptions {
  maxPixelRatio?: number;
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'low-power' | 'high-performance' | 'default';
  precision?: 'highp' | 'mediump' | 'lowp';
  depth?: boolean;
  stencil?: boolean;
  preserveDrawingBuffer?: boolean;
  failIfMajorPerformanceCaveat?: boolean;
  outputColorSpace?: THREE.ColorSpace;
}

/**
 * Create a WebGLRenderer tuned for throughput on dense scenes.
 * - antialias:false — use FXAA/SMAA post-pass instead
 * - alpha:false — opaque canvas skips premultiplied-alpha
 * - precision:'mediump' — halves fragment register pressure on mobile
 * - powerPreference:'high-performance' — picks discrete GPU on hybrid laptops
 */
export function createOptimizedRenderer(
  canvasParent?: HTMLElement,
  opts: CreateOptimizedRendererOptions = {}
): THREE.WebGLRenderer {
  const maxDPR = opts.maxPixelRatio ?? 1.5;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);

  const renderer = new THREE.WebGLRenderer({
    antialias: opts.antialias ?? false,
    alpha: opts.alpha ?? false,
    powerPreference: opts.powerPreference ?? 'high-performance',
    precision: opts.precision ?? 'mediump',
    depth: opts.depth !== false,
    stencil: opts.stencil ?? false,
    preserveDrawingBuffer: opts.preserveDrawingBuffer ?? false,
    failIfMajorPerformanceCaveat: opts.failIfMajorPerformanceCaveat ?? false,
  });

  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = opts.outputColorSpace ?? THREE.SRGBColorSpace;

  if (canvasParent) canvasParent.appendChild(renderer.domElement);

  return renderer;
}

/**
 * Clamp device pixel ratio — primary lever against Retina/4K fill-rate meltdown.
 */
export function applyPixelRatioCap(renderer: THREE.WebGLRenderer, max = 1.5): number {
  const dpr = Math.min(window.devicePixelRatio || 1, max);
  renderer.setPixelRatio(dpr);
  return dpr;
}

/**
 * Dynamic resolution governor — lowers renderer DPR when FPS drops, restores when stable.
 * Pair with post-FX AA (FXAA) so downscaling stays acceptable visually.
 */
export interface DynamicResolutionGovernorOptions {
  maxPixelRatio?: number;
  minPixelRatio?: number;
  scales?: number[];
  lowFps?: number;
  highFps?: number;
  cooldownMs?: number;
  enabled?: boolean;
  onResize?: () => void;
}

export class DynamicResolutionGovernor {
  renderer: THREE.WebGLRenderer;
  onResize: () => void;
  baseDPR: number;
  minDPR: number;
  scales: number[];
  tier: number;
  lowFps: number;
  highFps: number;
  cooldownMs: number;
  private _lastChange: number;
  enabled: boolean;

  constructor(renderer: THREE.WebGLRenderer, opts: DynamicResolutionGovernorOptions = {}) {
    this.renderer = renderer;
    this.onResize = opts.onResize ?? (() => {});
    this.baseDPR = Math.min(opts.maxPixelRatio ?? 1.5, window.devicePixelRatio || 1);
    this.minDPR = opts.minPixelRatio ?? 0.5;
    this.scales = opts.scales ?? [1.0, 0.85, 0.72, 0.62, 0.5];
    this.tier = 0;
    this.lowFps = opts.lowFps ?? 30;
    this.highFps = opts.highFps ?? 56;
    this.cooldownMs = opts.cooldownMs ?? 1100;
    this._lastChange = 0;
    this.enabled = opts.enabled !== false;
    this._apply();
  }

  /** Current effective DPR after tier scaling. */
  get currentDPR(): number {
    const scale = this.scales[this.tier] ?? 1;
    return Math.max(this.minDPR, this.baseDPR * scale);
  }

  private _apply(): void {
    const dpr = this.currentDPR;
    if (Math.abs(this.renderer.getPixelRatio() - dpr) > 0.001) {
      this.renderer.setPixelRatio(dpr);
      this.onResize();
    }
  }

  tick(fps: number, now = performance.now()): void {
    if (!this.enabled) return;
    if (now - this._lastChange < this.cooldownMs) return;

    let next = this.tier;
    if (fps < this.lowFps && this.tier < this.scales.length - 1) next++;
    else if (fps > this.highFps && this.tier > 0) next--;

    if (next !== this.tier) {
      this.tier = next;
      this._lastChange = now;
      this._apply();
    }
  }

  reset(): void {
    this.tier = 0;
    this._apply();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.reset();
  }
}

// =============================================================================
// 2. GEOMETRY & DRAW CALLS
// =============================================================================

export interface GeometryBudget {
  vertices: number;
  indices: number;
}

export function estimateGeometryBudget(geometries: THREE.BufferGeometry[]): GeometryBudget {
  let vertices = 0;
  let indices = 0;
  for (const g of geometries) {
    const pos = g.getAttribute('position');
    if (pos) vertices += pos.count;
    if (g.index) indices += g.index.count;
    else if (pos) indices += pos.count;
  }
  return { vertices, indices };
}

export interface CreateStaticBatchedGroupOptions {
  material: THREE.Material;
  items: Array<{ geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }>;
  maxInstances?: number;
}

export interface StaticBatchedGroupResult {
  batched: THREE.BatchedMesh;
  instanceIds: number[];
  geometryIds: number[];
}

/**
 * BatchedMesh batch for static props sharing one material (r166+).
 * CRITICAL: addGeometry() then addInstance() — without instance nothing draws.
 */
export function createStaticBatchedGroup(
  opts: CreateStaticBatchedGroupOptions
): StaticBatchedGroupResult {
  const { material, items } = opts;
  if (!material || !items?.length) {
    throw new Error('createStaticBatchedGroup: material and items[] required');
  }

  const geos = items.map((i) => i.geometry);
  const budget = estimateGeometryBudget(geos);
  const maxInstances = opts.maxInstances ?? items.length;
  const pad = 1.15;

  const batched = new THREE.BatchedMesh(
    maxInstances,
    Math.ceil(budget.vertices * pad),
    Math.ceil(budget.indices * pad),
    material
  );
  batched.frustumCulled = true;
  batched.sortObjects = true;

  const geometryIdCache = new Map<string, number>();
  const instanceIds: number[] = [];
  const geometryIds: number[] = [];

  for (const item of items) {
    const geoKey = item.geometry.uuid;
    let geometryId = geometryIdCache.get(geoKey);
    if (geometryId == null) {
      geometryId = batched.addGeometry(item.geometry);
      geometryIdCache.set(geoKey, geometryId);
      geometryIds.push(geometryId);
    }
    const instanceId = batched.addInstance(geometryId);
    batched.setMatrixAt(instanceId, item.matrix);
    batched.setVisibleAt(instanceId, true);
    instanceIds.push(instanceId);
  }

  batched.computeBoundingBox();
  batched.computeBoundingSphere();
  freezeStaticObjectTree(batched);
  return { batched, instanceIds, geometryIds };
}

/** InstancedMesh — best when geometry + material are 100% identical. */
export function createInstancedDecorations(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  matrices: THREE.Matrix4[]
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  mesh.frustumCulled = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  for (let i = 0; i < matrices.length; i++) mesh.setMatrixAt(i, matrices[i]);
  mesh.instanceMatrix.needsUpdate = true;
  freezeStaticObjectTree(mesh);
  return mesh;
}

export interface FreezeStaticObjectTreeOptions {
  skipSkinned?: boolean;
  skipLights?: boolean;
}

/** Stop per-frame matrix recompute on static map geometry (keep SkinnedMesh dynamic). */
export function freezeStaticObjectTree(
  root: THREE.Object3D,
  opts: FreezeStaticObjectTreeOptions = {}
): void {
  const skipSkinned = opts.skipSkinned !== false;
  const skipLights = opts.skipLights ?? false;
  root.traverse((obj) => {
    if (skipSkinned && obj instanceof THREE.SkinnedMesh) return;
    if (skipLights && obj instanceof THREE.Light) return;
    obj.matrixAutoUpdate = false;
    obj.updateMatrix();
  });
  root.updateMatrixWorld(true);
}

export function unfreezeObjectTree(root: THREE.Object3D): void {
  root.traverse((obj) => {
    obj.matrixAutoUpdate = true;
  });
}

// =============================================================================
// 3. MATERIALS & TEXTURES
// =============================================================================

/**
 * Downgrade MeshStandardMaterial → cheaper shading model while preserving maps/color.
 * Background faces never need full PBR — Phong/Lambert/Basic cut ALU + texture fetches.
 */
export function downgradeMaterial(
  source: THREE.Material,
  tier: MaterialTierValue = MaterialTier.MID
): THREE.Material {
  if (!source || (source instanceof THREE.MeshBasicMaterial && tier === MaterialTier.BACKDROP)) {
    return source;
  }

  const maps = {
    map: (source as any).map,
    alphaMap: (source as any).alphaMap,
    envMap: (source as any).envMap,
  };

  if (tier === MaterialTier.HERO) return source;

  if (tier === MaterialTier.BACKDROP) {
    const basic = new THREE.MeshBasicMaterial({
      map: maps.map,
      alphaMap: maps.alphaMap,
      transparent: (source as any).transparent && !!maps.alphaMap,
      opacity: (source as any).opacity ?? 1,
      side: (source as any).side,
      depthWrite: !((source as any).transparent && !maps.alphaMap),
    });
    basic.name = (source.name || 'mat') + '_basic';
    return basic;
  }

  // MID — Phong keeps specular highlights without full PBR
  const sourceColor = (source as any).color?.clone?.() ?? new THREE.Color(0xffffff);
  const phong = new THREE.MeshPhongMaterial({
    map: maps.map,
    alphaMap: maps.alphaMap,
    color: sourceColor,
    specular: new THREE.Color(0x111111),
    shininess: (source as any).roughness != null
      ? Math.max(4, (1 - (source as any).roughness) * 64)
      : 12,
    transparent: (source as any).transparent,
    opacity: (source as any).opacity ?? 1,
    side: (source as any).side,
    depthWrite: (source as any).depthWrite !== false,
  });
  phong.name = (source.name || 'mat') + '_phong';
  return phong;
}

export interface ApplyMaterialDowngradeOptions {
  cameraPosition?: THREE.Vector3;
  backdropDistance?: number;
  heroNames?: string[];
}

/**
 * Walk a static import and downgrade materials by importance / distance rules.
 */
export function applyMaterialDowngrade(
  root: THREE.Object3D,
  opts: ApplyMaterialDowngradeOptions = {}
): void {
  const camPos = opts.cameraPosition;
  const backdropDist = opts.backdropDistance ?? 40;
  const heroNames = new Set(opts.heroNames ?? []);

  root.traverse((obj) => {
    if (!obj instanceof THREE.Mesh || !(obj as any).material) return;

    let tier: MaterialTierValue = MaterialTier.MID;
    if (heroNames.has(obj.name)) tier = MaterialTier.HERO;
    else if (camPos) {
      obj.getWorldPosition(_position);
      if (_position.distanceTo(camPos) > backdropDist) tier = MaterialTier.BACKDROP;
    } else if ((obj as any).userData.materialTier) {
      tier = (obj as any).userData.materialTier;
    }

    const mats = Array.isArray((obj as any).material) ? (obj as any).material : [(obj as any).material];
    const next = mats.map((m: THREE.Material) => downgradeMaterial(m, tier));
    (obj as any).material = Array.isArray((obj as any).material) ? next : next[0];
  });
}

/** Cap anisotropic filtering — max GPU value (often 16) is overkill for distant props. */
export function clampTextureAnisotropy(
  texture: THREE.Texture,
  renderer: THREE.WebGLRenderer,
  max = DEFAULT_MAX_ANISOTROPY
): THREE.Texture {
  if (!texture || !renderer) return texture;
  const cap = Math.min(max, renderer.capabilities.getMaxAnisotropy());
  texture.anisotropy = cap;
  return texture;
}

/** Apply anisotropy budget to every map slot on a material tree. */
export function applyAnisotropyBudget(
  root: THREE.Object3D,
  renderer: THREE.WebGLRenderer,
  max = DEFAULT_MAX_ANISOTROPY
): void {
  const cap = Math.min(max, renderer.capabilities.getMaxAnisotropy());
  root.traverse((obj) => {
    if (!obj instanceof THREE.Mesh || !(obj as any).material) return;
    const mats = Array.isArray((obj as any).material) ? (obj as any).material : [(obj as any).material];
    for (const mat of mats) {
      for (const key in mat) {
        const val = (mat as any)[key];
        if (val?.isTexture) val.anisotropy = cap;
      }
    }
  });
}

export interface TransparencyAudit {
  mesh: THREE.Object3D;
  material: THREE.Material;
  reason: string;
}

/**
 * Transparency audit — returns meshes that break Early-Z (transparent + depthWrite issues).
 * Rule of thumb: prefer opaque + alphaTest cutout over transparent:true when possible.
 */
export function auditTransparentMaterials(root: THREE.Object3D): TransparencyAudit[] {
  const issues: TransparencyAudit[] = [];
  root.traverse((obj) => {
    if (!obj instanceof THREE.Mesh || !(obj as any).material) return;
    const mats = Array.isArray((obj as any).material) ? (obj as any).material : [(obj as any).material];
    for (const mat of mats) {
      if (!(mat as any).transparent) continue;
      if ((mat as any).depthWrite !== false) {
        issues.push({
          mesh: obj,
          material: mat,
          reason: 'transparent+depthWrite blocks Early-Z sorting',
        });
      }
      if (!(mat as any).alphaTest && !(mat as any).alphaMap && (mat as any).opacity >= 0.99) {
        issues.push({
          mesh: obj,
          material: mat,
          reason: 'fully opaque but transparent:true forces late pass',
        });
      }
    }
  });
  return issues;
}

export interface OptimizeMaterialTransparencyOptions {
  alphaTest?: number;
  opacityThreshold?: number;
  preferCutout?: boolean;
}

/**
 * Convert "fake transparent" materials to opaque for better depth prepass.
 * Uses alphaTest cutout when alphaMap exists (foliage pattern).
 */
export function optimizeMaterialTransparency(
  material: THREE.Material,
  opts: OptimizeMaterialTransparencyOptions = {}
): THREE.Material {
  if (!material) return material;
  const alphaTest = opts.alphaTest ?? 0.5;

  if (
    (material as any).transparent &&
    (material as any).opacity >= (opts.opacityThreshold ?? 0.99) &&
    !(material as any).alphaMap
  ) {
    (material as any).transparent = false;
    (material as any).depthWrite = true;
  }

  if (
    (material as any).transparent &&
    (material as any).alphaMap &&
    opts.preferCutout !== false
  ) {
    (material as any).transparent = false;
    (material as any).alphaTest = alphaTest;
    (material as any).depthWrite = true;
  }

  return material;
}

// =============================================================================
// 4. LIGHTING & SHADOWS
// =============================================================================

export interface ConfigureRendererShadowsOptions {
  useVSM?: boolean;
  autoUpdate?: boolean;
}

export interface ShadowConfig {
  type: THREE.ShadowMapType;
  autoUpdate: boolean;
}

export function configureRendererShadows(
  renderer: THREE.WebGLRenderer,
  opts: ConfigureRendererShadowsOptions = {}
): ShadowConfig {
  const useVSM = opts.useVSM !== false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = useVSM ? THREE.VSMShadowMap : THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = opts.autoUpdate ?? false;
  return { type: renderer.shadowMap.type, autoUpdate: renderer.shadowMap.autoUpdate };
}

export class ShadowUpdateManager {
  renderer: THREE.WebGLRenderer;
  private _dirty: boolean;
  private _lights: Set<THREE.Light>;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this._dirty = true;
    this._lights = new Set();
  }

  trackLight(light: THREE.Light | null): THREE.Light | null {
    if (light?.castShadow) this._lights.add(light);
    return light;
  }

  invalidate(): void {
    this._dirty = true;
  }

  update(sceneBounds?: THREE.Box3): void {
    if (!this.renderer.shadowMap.enabled) return;
    if (!this._dirty && !this.renderer.shadowMap.needsUpdate) return;
    if (sceneBounds) {
      for (const light of this._lights) {
        if (light instanceof THREE.DirectionalLight) {
          fitDirectionalShadowCamera(light, sceneBounds);
        }
      }
    }
    this.renderer.shadowMap.needsUpdate = true;
    this._dirty = false;
  }
}

export interface FitDirectionalShadowCameraOptions {
  padding?: number;
  near?: number;
  far?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

/**
 * Tight ortho shadow frustum — tune near/far/left/right/top/bottom to scene bounds.
 * Example starting set for ~30-unit stage:
 *   near: 0.5, far: 80–120, extent: half of max(XZ) + padding
 */
export function fitDirectionalShadowCamera(
  light: THREE.DirectionalLight,
  worldBounds: THREE.Box3,
  opts: FitDirectionalShadowCameraOptions = {}
): THREE.DirectionalLight {
  if (!light?.shadow?.camera?.isOrthographicCamera || worldBounds.isEmpty()) return light;

  const pad = opts.padding ?? 4;
  const center = worldBounds.getCenter(_position);
  const size = worldBounds.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.z) * 0.5 + pad;

  const cam = light.shadow.camera as THREE.OrthographicCamera;
  cam.near = opts.near ?? 0.5;
  cam.far = opts.far ?? Math.max(cam.near + 1, size.y + pad * 2);
  cam.left = opts.left ?? -extent;
  cam.right = opts.right ?? extent;
  cam.top = opts.top ?? extent;
  cam.bottom = opts.bottom ?? -extent;
  cam.updateProjectionMatrix();

  if (light.target) {
    light.target.position.copy(center);
    light.target.updateMatrixWorld?.();
  }
  light.shadow.needsUpdate = true;
  return light;
}

export function computeObjectBounds(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) {
      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      if (obj.geometry.boundingBox) {
        _box3.copy(obj.geometry.boundingBox).applyMatrix4(obj.matrixWorld);
        box.union(_box3);
      }
    }
  });
  return box;
}

const _simplifyModifier = new SimplifyModifier();

export function buildLowPolyProxyGeometry(
  sourceGeometry: THREE.BufferGeometry,
  targetTriangles = 2000
): THREE.BufferGeometry {
  if (!sourceGeometry?.getAttribute('position')) return new THREE.BoxGeometry(1, 1, 1);

  let geo = sourceGeometry.clone();
  geo.computeVertexNormals();
  const pos = geo.getAttribute('position');
  const currentTris = geo.index ? geo.index.count / 3 : pos.count / 3;
  if (currentTris <= targetTriangles * 1.2) return geo;

  try {
    const removeRatio = 1 - Math.min(0.98, targetTriangles / currentTris);
    const count = Math.max(3, Math.floor(pos.count * removeRatio));
    geo = _simplifyModifier.modify(geo, count);
    geo.computeBoundingSphere();
    return geo;
  } catch {
    geo.computeBoundingBox();
    const s = geo.boundingBox!.getSize(new THREE.Vector3());
    return new THREE.BoxGeometry(
      Math.max(s.x, 0.1),
      Math.max(s.y, 0.1),
      Math.max(s.z, 0.1)
    );
  }
}

export interface ShadowProxyPair {
  visibleMesh: THREE.Object3D;
  shadowProxy: THREE.Mesh;
  group: THREE.Group;
}

export interface CreateShadowProxyPairOptions {
  receiveShadow?: boolean;
  targetTriangles?: number;
}

export function createShadowProxyPair(
  sourceMesh: THREE.Mesh,
  opts: CreateShadowProxyPairOptions = {}
): ShadowProxyPair {
  const group = new THREE.Group();
  const visibleMesh = sourceMesh;
  visibleMesh.castShadow = false;
  visibleMesh.receiveShadow = opts.receiveShadow !== false;

  const proxyGeo = buildLowPolyProxyGeometry(sourceMesh.geometry, opts.targetTriangles ?? 2000);
  const shadowProxy = new THREE.Mesh(
    proxyGeo,
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      depthWrite: false,
      depthTest: false,
    })
  );
  shadowProxy.castShadow = true;
  shadowProxy.receiveShadow = false;
  shadowProxy.layers.set(PROXY_LAYER);
  shadowProxy.userData.isShadowProxy = true;
  group.add(visibleMesh);
  group.add(shadowProxy);
  syncShadowProxyTransform(visibleMesh, shadowProxy);
  return { visibleMesh, shadowProxy, group };
}

export function syncShadowProxyTransform(
  visibleMesh: THREE.Object3D,
  shadowProxy: THREE.Mesh
): void {
  visibleMesh.updateMatrixWorld(true);
  visibleMesh.matrixWorld.decompose(_position, _quaternion, _scale);
  shadowProxy.position.copy(_position);
  shadowProxy.quaternion.copy(_quaternion);
  shadowProxy.scale.copy(_scale);
  shadowProxy.updateMatrixWorld(true);
}

export interface ApplyShadowProxiesToMapOptions {
  minTriangles?: number;
  targetTriangles?: number;
  receiveShadow?: boolean;
}

/**
 * Heavy mesh: no cast, yes receive. Low-poly sibling: cast only, invisible to main cam.
 */
export function applyShadowProxiesToMap(
  root: THREE.Object3D,
  mainCamera: THREE.Camera,
  opts: ApplyShadowProxiesToMapOptions = {}
): THREE.Mesh[] {
  mainCamera.layers.disable(PROXY_LAYER);
  const minTris = opts.minTriangles ?? 5000;
  const proxies: THREE.Mesh[] = [];

  root.traverse((obj) => {
    if (!obj instanceof THREE.Mesh || !obj.geometry) return;
    const tri = obj.geometry.index
      ? obj.geometry.index.count / 3
      : ((obj as any).geometry.getAttribute('position')?.count || 0) / 3;
    if (tri < minTris) return;

    const proxy = new THREE.Mesh(
      buildLowPolyProxyGeometry(obj.geometry, opts.targetTriangles ?? 2000),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    proxy.castShadow = true;
    proxy.receiveShadow = false;
    proxy.layers.set(PROXY_LAYER);
    proxy.userData.isShadowProxy = true;
    syncShadowProxyTransform(obj, proxy);
    obj.castShadow = false;
    obj.receiveShadow = opts.receiveShadow !== false;
    obj.parent?.add(proxy);
    proxies.push(proxy);
  });
  return proxies;
}

// =============================================================================
// 5. RAYCASTING
// =============================================================================

export interface CreatePickProxyOptions {
  useBounds?: boolean;
  targetTriangles?: number;
}

export function createPickProxy(
  sourceMesh: THREE.Mesh,
  opts: CreatePickProxyOptions = {}
): THREE.Mesh {
  const geo =
    opts.useBounds !== false
      ? (() => {
          sourceMesh.geometry.computeBoundingBox();
          const s = sourceMesh.geometry.boundingBox!.getSize(new THREE.Vector3());
          return new THREE.BoxGeometry(
            Math.max(s.x, 0.05),
            Math.max(s.y, 0.05),
            Math.max(s.z, 0.05)
          );
        })()
      : buildLowPolyProxyGeometry(sourceMesh.geometry, opts.targetTriangles ?? 500);

  const pickProxy = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      visible: false,
      depthWrite: false,
      depthTest: false,
    })
  );
  pickProxy.layers.set(PROXY_LAYER);
  pickProxy.userData.pickTarget = sourceMesh;
  syncShadowProxyTransform(sourceMesh, pickProxy);
  (sourceMesh as any).userData.skipRaycast = true;
  (sourceMesh as any).raycast = () => {};
  return pickProxy;
}

export interface RaycastPickProxiesOptions {
  recursive?: boolean;
}

export function raycastPickProxies(
  event: MouseEvent,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  pickProxies: THREE.Mesh[],
  opts: RaycastPickProxiesOptions = {}
): Array<THREE.Object3D | THREE.Mesh> {
  const rect = renderer.domElement.getBoundingClientRect();
  _ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  _ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  _ray.setFromCamera(_ndc, camera);
  _ray.layers.set(PROXY_LAYER);
  return _ray
    .intersectObjects(pickProxies, opts.recursive !== false)
    .map((h) => h.object.userData.pickTarget || h.object);
}

// =============================================================================
// 6. LOADING & GPU MEMORY DISPOSE
// =============================================================================

export interface CreateOptimizedGLTFLoaderOptions {
  transcoderPath?: string;
}

export function createOptimizedGLTFLoader(
  renderer: THREE.WebGLRenderer,
  loadingManager?: THREE.LoadingManager,
  opts: CreateOptimizedGLTFLoaderOptions = {}
): GLTFLoader {
  const loader = new GLTFLoader(loadingManager);
  loader.setMeshoptDecoder(MeshoptDecoder as any);
  const transcoderPath = opts.transcoderPath ?? './vendor/three/examples/jsm/libs/basis/';
  loader.setKTX2Loader(
    new KTX2Loader().setTranscoderPath(transcoderPath).detectSupport(renderer)
  );
  return loader;
}

export interface OptimizeLoadedGLTFSceneOptions {
  renderer?: THREE.WebGLRenderer;
  mainCamera?: THREE.Camera;
  maxAnisotropy?: number;
  shadowProxies?: boolean;
  materialDowngrade?: boolean;
}

export function optimizeLoadedGLTFScene(
  scene: THREE.Scene,
  opts: OptimizeLoadedGLTFSceneOptions = {}
): THREE.Scene {
  freezeStaticObjectTree(scene, { skipSkinned: true });
  if (opts.renderer)
    applyAnisotropyBudget(
      scene,
      opts.renderer,
      opts.maxAnisotropy ?? DEFAULT_MAX_ANISOTROPY
    );
  if (opts.shadowProxies && opts.mainCamera)
    applyShadowProxiesToMap(scene, opts.mainCamera, {});
  if (opts.materialDowngrade) applyMaterialDowngrade(scene, {});
  return scene;
}

const TEXTURE_KEYS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'envMap',
  'lightMap',
  'specularMap',
] as const;

/**
 * Dispose a material and all attached textures (prevents GPU memory leaks on scene switch).
 */
export function disposeMaterial(
  material: THREE.Material | THREE.Material[] | null,
  disposedTextureUuids = new Set<string>()
): void {
  if (!material) return;
  const mats = Array.isArray(material) ? material : [material];
  for (const mat of mats) {
    for (const key of TEXTURE_KEYS) {
      const tex = (mat as any)[key];
      if (tex?.isTexture && !disposedTextureUuids.has(tex.uuid)) {
        tex.dispose();
        disposedTextureUuids.add(tex.uuid);
      }
    }
    mat.dispose();
  }
}

export interface DisposeObject3DOptions {
  scene?: THREE.Scene;
  removeFromParent?: boolean;
  sharedGeometries?: Set<string>;
  sharedMaterials?: Set<string>;
}

/**
 * Recursively remove an object from the scene graph and free GPU resources.
 * BufferGeometry + Texture GPU memory is NOT garbage-collected by JS alone.
 * Switching maps without dispose → VRAM climb / context loss.
 */
export function disposeObject3D(
  object: THREE.Object3D | null,
  opts: DisposeObject3DOptions = {}
): void {
  if (!object) return;

  const disposedTextures = new Set<string>();
  const sharedGeos = opts.sharedGeometries ?? new Set();
  const sharedMats = opts.sharedMaterials ?? new Set();
  const disposedGeos = new Set<string>();

  object.traverse((node) => {
    if (
      node instanceof THREE.Mesh &&
      node.geometry &&
      !sharedGeos.has(node.geometry.uuid) &&
      !disposedGeos.has(node.geometry.uuid)
    ) {
      node.geometry.dispose();
      disposedGeos.add(node.geometry.uuid);
    }

    if (
      (node as any).material &&
      !sharedMats.has(
        Array.isArray((node as any).material)
          ? (node as any).material.map((m: THREE.Material) => m.uuid).join(',')
          : (node as any).material.uuid
      )
    ) {
      disposeMaterial((node as any).material, disposedTextures);
    }

    if (node instanceof THREE.SkinnedMesh && node.skeleton) {
      node.skeleton.boneTexture?.dispose?.();
    }
  });

  if (opts.removeFromParent !== false && object.parent) {
    object.parent.remove(object);
  }
  if (opts.scene?.children.includes(object)) {
    opts.scene.remove(object);
  }

  object.traverse((node) => {
    if (
      (node as any).userData.isShadowProxy ||
      (node as any).userData.isPickProxy
    ) {
      (node as any).geometry?.dispose?.();
      (node as any).material?.dispose?.();
    }
  });
}

/**
 * Clear an entire map props root — typical call when loading a new location JSON.
 */
export function disposeMapPropsRoot(propsRoot: THREE.Object3D | null, scene: THREE.Scene): void {
  if (!propsRoot) return;
  const children = [...propsRoot.children];
  for (const child of children) {
    disposeObject3D(child, { scene, removeFromParent: true });
  }
}

// =============================================================================
// 7. SCENE COMPLEXITY & ANALYSIS
// =============================================================================

export interface SceneComplexityReport {
  meshCount: number;
  totalVertices: number;
  totalIndices: number;
  estimatedMemoryMb: number;
  geometryCount: number;
  materialCount: number;
}

/**
 * Estimate total complexity of a scene for memory budgeting and optimization decisions.
 * Rough memory estimate assumes 12 bytes per vertex + 4 bytes per index.
 */
export function estimateSceneComplexity(scene: THREE.Scene): SceneComplexityReport {
  const geometries: THREE.BufferGeometry[] = [];
  const materials = new Set<string>();
  let meshCount = 0;

  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      meshCount++;
      if (obj.geometry && !geometries.includes(obj.geometry)) {
        geometries.push(obj.geometry);
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (mat) materials.add(mat.uuid);
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
    geometryCount: geometries.length,
    materialCount: materials.size,
  };
}

/**
 * Clear entire scene graph and dispose all GPU resources.
 * Typical call when switching between major scenes or cleaning up.
 */
export function cleanupScene(scene: THREE.Scene): void {
  const children = [...scene.children];
  for (const child of children) {
    disposeObject3D(child, { scene, removeFromParent: true });
  }
}
