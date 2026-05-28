import * as THREE from 'three';
import type { CameraSnapshot } from '../types';
import type { BakedTriangle, PathTracerLight, PathTracerSceneData } from './types';
import { PATH_TRACER_MAX_TRIANGLES } from './types';
import { MaterialRegistry, TextureRegistry } from './mmdMaterial';

const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _uvA = new THREE.Vector2();
const _uvB = new THREE.Vector2();
const _uvC = new THREE.Vector2();

type MmdLikeMaterial = THREE.Material & {
  transparent?: boolean;
  opacity?: number;
  alphaMap?: THREE.Texture | null;
  alphaTest?: number;
};

function pushTriangle(
  out: BakedTriangle[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  uva: THREE.Vector2,
  uvb: THREE.Vector2,
  uvc: THREE.Vector2,
  matIndex: number
): void {
  out.push({
    v0: [a.x, a.y, a.z],
    v1: [b.x, b.y, b.z],
    v2: [c.x, c.y, c.z],
    uv0: [uva.x, uva.y],
    uv1: [uvb.x, uvb.y],
    uv2: [uvc.x, uvc.y],
    matIndex,
  });
}

function isAlphaCutoutMaterial(material: THREE.Material | undefined): boolean {
  if (!material) return false;
  const mat = material as MmdLikeMaterial;
  return (
    Boolean(mat.alphaMap?.image) ||
    (mat.transparent && mat.opacity !== undefined && mat.opacity < 0.999) ||
    (mat.alphaTest !== undefined && mat.alphaTest > 0.01)
  );
}

function shouldBakeMesh(mesh: THREE.Mesh): boolean {
  if (mesh.userData?.pathTracerSkip) return false;
  if (!mesh.geometry?.attributes?.position) return false;
  const name = mesh.name.toLowerCase();
  if (
    name.includes('outline') ||
    name.includes('edge') ||
    name.includes('helper') ||
    name.includes('physics')
  ) {
    return false;
  }
  return true;
}

function subsampleBlock(tris: BakedTriangle[], budget: number): BakedTriangle[] {
  if (tris.length <= budget) return tris;
  const step = tris.length / budget;
  const result: BakedTriangle[] = [];
  for (let i = 0; i < budget; i += 1) {
    result.push(tris[Math.floor(i * step)]!);
  }
  return result;
}

function allocateBudgets(counts: number[], totalBudget: number): number[] {
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total <= totalBudget) return counts;

  const budgets = counts.map((count) =>
    Math.max(4, Math.floor((count / total) * totalBudget))
  );
  let used = budgets.reduce((sum, n) => sum + n, 0);
  let i = 0;
  while (used > totalBudget && i < 1000) {
    const idx = i % budgets.length;
    if (budgets[idx]! > 4) {
      budgets[idx]! -= 1;
      used -= 1;
    }
    i += 1;
  }
  while (used < totalBudget && i < 1000) {
    const idx = i % budgets.length;
    if (budgets[idx]! < counts[idx]!) {
      budgets[idx]! += 1;
      used += 1;
    }
    i += 1;
  }
  return budgets;
}

function bakeMeshTriangles(
  mesh: THREE.Mesh | THREE.SkinnedMesh,
  out: BakedTriangle[],
  matRegistry: MaterialRegistry,
  texRegistry: TextureRegistry,
  options?: { skipAlphaMaterials?: boolean }
): void {
  const geometry = mesh.geometry;
  if (!geometry?.attributes?.position) return;

  mesh.updateMatrixWorld(true);
  const matrix = mesh.matrixWorld;
  const pos = geometry.attributes.position;
  const uvAttr = geometry.attributes.uv as THREE.BufferAttribute | undefined;
  const index = geometry.index;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  const skinned = (mesh as THREE.SkinnedMesh).isSkinnedMesh
    ? (mesh as THREE.SkinnedMesh)
    : null;
  if (skinned?.skeleton) {
    skinned.skeleton.update();
  }

  const readVertex = (i: number, target: THREE.Vector3): void => {
    if (skinned) {
      skinned.getVertexPosition(i, target);
      target.applyMatrix4(matrix);
    } else {
      target.fromBufferAttribute(pos, i);
      target.applyMatrix4(matrix);
    }
  };

  const readUv = (i: number, target: THREE.Vector2): void => {
    if (uvAttr) {
      target.fromBufferAttribute(uvAttr, i);
    } else {
      target.set(0, 0);
    }
  };

  const groups =
    geometry.groups.length > 0
      ? geometry.groups
      : [{ start: 0, count: index ? index.count : pos.count, materialIndex: 0 }];

  for (const group of groups) {
    const material = materials[group.materialIndex ?? 0];
    if (!material) continue;
    if (options?.skipAlphaMaterials && isAlphaCutoutMaterial(material)) continue;

    const matIndex = matRegistry.register(material, texRegistry);
    const end = group.start + group.count;

    if (index) {
      for (let i = group.start; i < end; i += 3) {
        const ia = index.getX(i);
        const ib = index.getX(i + 1);
        const ic = index.getX(i + 2);
        readVertex(ia, _vA);
        readVertex(ib, _vB);
        readVertex(ic, _vC);
        readUv(ia, _uvA);
        readUv(ib, _uvB);
        readUv(ic, _uvC);
        pushTriangle(out, _vA, _vB, _vC, _uvA, _uvB, _uvC, matIndex);
      }
    } else {
      for (let i = group.start; i < end; i += 3) {
        readVertex(i, _vA);
        readVertex(i + 1, _vB);
        readVertex(i + 2, _vC);
        readUv(i, _uvA);
        readUv(i + 1, _uvB);
        readUv(i + 2, _uvC);
        pushTriangle(out, _vA, _vB, _vC, _uvA, _uvB, _uvC, matIndex);
      }
    }
  }
}

/** Decimate per mesh so each part stays contiguous (no global triangle soup). */
function mergeMeshBlocks(blocks: BakedTriangle[][], maxCount: number): BakedTriangle[] {
  if (blocks.length === 0) return [];
  const counts = blocks.map((b) => b.length);
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total <= maxCount) return blocks.flat();

  const budgets = allocateBudgets(counts, maxCount);
  return blocks.flatMap((block, i) => subsampleBlock(block, budgets[i]!));
}

/** Extract visible MMD mesh geometry + full materials for path tracing. */
export function bakeSceneForPathTracer(
  root: THREE.Object3D,
  options?: {
    maxTriangles?: number;
    maxTextures?: number;
    floorY?: number;
    skipAlphaMaterials?: boolean;
  }
): PathTracerSceneData {
  syncSkinnedMeshes(root);
  const maxTriangles = options?.maxTriangles ?? PATH_TRACER_MAX_TRIANGLES;
  const texRegistry = new TextureRegistry(options?.maxTextures);
  const matRegistry = new MaterialRegistry();
  const meshBlocks: BakedTriangle[][] = [];

  root.traverse((obj) => {
    if (!obj.visible) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !shouldBakeMesh(mesh)) return;

    const block: BakedTriangle[] = [];
    bakeMeshTriangles(mesh, block, matRegistry, texRegistry, {
      skipAlphaMaterials: options?.skipAlphaMaterials,
    });
    if (block.length > 0) meshBlocks.push(block);
  });

  const triangles = mergeMeshBlocks(meshBlocks, maxTriangles);

  const lights: PathTracerLight[] = [];
  root.traverse((obj) => {
    const light = obj as THREE.Light;
    if (!light.isLight || !light.visible) return;
    if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
      const c = light.color;
      lights.push({
        position: [light.position.x, light.position.y, light.position.z],
        radius: 0.35,
        color: [c.r, c.g, c.b],
        intensity: light.intensity * 2.5,
      });
    }
  });

  return {
    triangles,
    materials: matRegistry.materials,
    textures: texRegistry.textures,
    lights: lights.slice(0, 8),
    floorY: options?.floorY ?? 0,
  };
}

function syncSkinnedMeshes(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const skinned = obj as THREE.SkinnedMesh;
    if (!skinned.isSkinnedMesh) return;
    skinned.skeleton?.bones.forEach((bone) => bone.updateMatrixWorld(true));
    skinned.skeleton?.update();
    skinned.updateMatrixWorld(true);
  });
  root.updateMatrixWorld(true);
}

export function prepareSceneForPathTracer(root: THREE.Object3D): void {
  syncSkinnedMeshes(root);
}

export interface BakedBounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
  radius: number;
}

export function computeBakedBounds(baked: PathTracerSceneData): BakedBounds {
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const tri of baked.triangles) {
    for (const v of [tri.v0, tri.v1, tri.v2]) {
      min.min(new THREE.Vector3(v[0], v[1], v[2]));
      max.max(new THREE.Vector3(v[0], v[1], v[2]));
    }
  }
  const center = min.clone().add(max).multiplyScalar(0.5);
  const radius = center.distanceTo(max);
  return { min, max, center, radius };
}

export function focusDistFromBaked(
  camera: THREE.PerspectiveCamera,
  baked: PathTracerSceneData
): number {
  const { center, radius } = computeBakedBounds(baked);
  return Math.max(5, camera.position.distanceTo(center) + radius * 0.15);
}

export function cameraFromThree(
  camera: THREE.PerspectiveCamera,
  dof?: { aperture: number; focusDist: number },
  aimCenter?: THREE.Vector3
): import('./types').PathTracerCamera {
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  const position = camera.position.clone();
  const viewDir = new THREE.Vector3();
  camera.getWorldDirection(viewDir);

  let forward = viewDir.clone();
  if (aimCenter) {
    const toCenter = aimCenter.clone().sub(position);
    if (toCenter.lengthSq() > 1e-6) {
      toCenter.normalize();
      if (viewDir.dot(toCenter) < 0.35) {
        forward.copy(toCenter);
      }
    }
  }

  const worldUp = new THREE.Vector3(0, 1, 0);
  let right = new THREE.Vector3().crossVectors(forward, worldUp);
  if (right.lengthSq() < 1e-8) {
    right.set(1, 0, 0);
  }
  right.normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();

  const focusDist = dof?.focusDist ?? 15;
  const target = position.clone().add(forward.clone().multiplyScalar(focusDist));

  return {
    position: [position.x, position.y, position.z],
    target: [target.x, target.y, target.z],
    right: [right.x, right.y, right.z],
    up: [up.x, up.y, up.z],
    forward: [forward.x, forward.y, forward.z],
    fov: camera.fov,
    aperture: dof?.aperture ?? 0,
    focusDist,
  };
}

export function cameraFromSnapshot(snapshot: CameraSnapshot): import('./types').PathTracerCamera {
  return {
    position: snapshot.position,
    target: snapshot.target,
    fov: snapshot.fov,
    aperture: 0.025,
    focusDist: Math.hypot(
      snapshot.position[0] - snapshot.target[0],
      snapshot.position[1] - snapshot.target[1],
      snapshot.position[2] - snapshot.target[2]
    ),
  };
}
