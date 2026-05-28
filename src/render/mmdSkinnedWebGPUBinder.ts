import * as THREE from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import {
  ensureMmdSkinAttributesForWebGPU,
  isMmdSkinnedMeshWebGpuReady,
  MMD_WEBGPU_SKELETON_BOUND_KEY,
} from './mmdSkinAttributeManager';
import {
  createMmdSkinnedToonNodeMaterial,
  isMmdSkinnedNodeMaterial,
  prepareMmdSkinnedNodeMaterial,
  stripLegacyMaterialTypeFlags,
} from './mmdSkinnedNodeMaterial';

export interface BindMmdSkinnedMeshOptions {
  textureAnisotropy?: number;
  /** Re-run compileAsync after textures load */
  onReady?: () => void;
}

/**
 * Detached bind + skeleton update — bone matrices feed GPU uniform/bone texture once per frame.
 */
export function bindMmdSkinnedSkeleton(mesh: THREE.SkinnedMesh): void {
  if (!mesh.skeleton || mesh.userData[MMD_WEBGPU_SKELETON_BOUND_KEY]) return;

  mesh.updateMatrixWorld(true);
  for (const bone of mesh.skeleton.bones) {
    bone.updateMatrixWorld(true);
  }

  if (!mesh.skeleton.boneInverses.length) {
    mesh.skeleton.calculateInverses();
  }

  mesh.bindMode = 'detached';
  mesh.bind(mesh.skeleton, mesh.matrixWorld);
  mesh.skeleton.update();
  mesh.userData[MMD_WEBGPU_SKELETON_BOUND_KEY] = true;
}

/** Call from useFrame before render — updates bone matrix uniform buffer / bone texture. */
export function updateMmdSkinnedBoneMatrices(mesh: THREE.SkinnedMesh): void {
  if (!mesh.skeleton) return;
  mesh.skeleton.update();
}

/**
 * Full WebGPU skinning prep: attributes → node materials → skeleton bind.
 */
export function prepareMmdSkinnedMeshForWebGPU(
  mesh: THREE.SkinnedMesh,
  textureAnisotropy = 2
): boolean {
  if (mesh.userData.skipWebGpuMaterialConvert) {
    bindMmdSkinnedSkeleton(mesh);
    return true;
  }

  const report = ensureMmdSkinAttributesForWebGPU(mesh);
  convertMeshMaterialsToSkinnedNode(mesh, textureAnisotropy);
  bindMmdSkinnedSkeleton(mesh);

  return report.webGpuReady && isMmdSkinnedMeshWebGpuReady(mesh);
}

function convertMeshMaterialsToSkinnedNode(
  mesh: THREE.SkinnedMesh,
  textureAnisotropy: number
): void {
  const srcMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const out = srcMats.map((mat, index) => {
    if (mat && isMmdSkinnedNodeMaterial(mat)) {
      prepareMmdSkinnedNodeMaterial(mat);
      stripLegacyMaterialTypeFlags(mat);
      return mat;
    }
    const legacy = mat as THREE.MeshToonMaterial | undefined;
    const nodeMat = createMmdSkinnedToonNodeMaterial({
      name: legacy?.name ?? `mmd_mat_${index}`,
      color: legacy?.color?.clone(),
      map: legacy?.map ?? undefined,
      gradientMap: legacy?.gradientMap ?? undefined,
    });
    if (legacy?.map) {
      legacy.map.anisotropy = textureAnisotropy;
    }
    return nodeMat;
  });

  mesh.material = out.length === 1 ? out[0]! : out;
}

export async function compileMmdSkinnedMeshWebGPU(
  renderer: WebGPURenderer,
  mesh: THREE.SkinnedMesh,
  scene: THREE.Scene,
  camera: THREE.Camera
): Promise<void> {
  prepareMmdSkinnedMeshForWebGPU(mesh);
  bindMmdSkinnedSkeleton(mesh);
  updateMmdSkinnedBoneMatrices(mesh);
  await renderer.compileAsync(mesh, camera, scene);
}
