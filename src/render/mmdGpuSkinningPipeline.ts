import * as THREE from 'three';

/** GPU skinning + morphing stay on the render path — no CPU vertex recompute. */
export function configureMmdMeshForGpuSkinning(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child as THREE.SkinnedMesh).isSkinnedMesh) return;

    const mesh = child as THREE.SkinnedMesh;
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;

    const bones = mesh.skeleton?.bones;
    if (bones) {
      for (let i = 0; i < bones.length; i++) {
        bones[i].matrixAutoUpdate = false;
      }
    }

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      const mat = material as THREE.Material & {
        skinning?: boolean;
        morphTargets?: boolean;
        morphNormals?: boolean;
      };
      mat.skinning = true;
      if (mesh.morphTargetInfluences?.length) {
        mat.morphTargets = true;
        mat.morphNormals = false;
      }
    }

    mesh.updateMatrix();
  });
}

/** Root transform updates only when the user moves the model via gizmo or props. */
export function configureMmdRootGroupForManualTransforms(root: THREE.Group): void {
  root.matrixAutoUpdate = false;
  root.updateMatrix();
}

export function syncMmdRootGroupMatrix(root: THREE.Group | null): void {
  if (!root) return;
  root.updateMatrix();
  root.updateMatrixWorld(true);
}

/** Push skeleton + world matrices to the GPU skinning pipeline once per frame. */
export function finalizeMmdSkinnedMeshForGpu(mesh: THREE.SkinnedMesh): void {
  if (mesh.skeleton) {
    mesh.skeleton.update();
  }
  if (mesh.matrixWorldNeedsUpdate) {
    mesh.updateMatrixWorld(false);
  }
}
