import * as THREE from 'three';

/** PMX helper / collision meshes that must not render (not hair/cloth). */
const HIDE_MESH_NAME = /コリジョン|collision|刚体|hitbox|non.?render/i;
const HIDE_MAT_NAME = /ノン表示|非表示|non.?display|hidden|描画しない/i;

/**
 * Hide PMX collision / non-display helper meshes only.
 * Does not hide hair, wings, or cloth — those need physics + textures.
 */
export function hideNonRenderingMmdMeshes(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;

    if (HIDE_MESH_NAME.test(mesh.name)) {
      mesh.visible = false;
      return;
    }

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!material) continue;
      const label = `${mesh.name} ${material.name}`;
      if (HIDE_MAT_NAME.test(label)) {
        mesh.visible = false;
        return;
      }
    }
  });
}
