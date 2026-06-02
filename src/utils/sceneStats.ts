import * as THREE from 'three';

/** Count visible mesh triangles in a Three.js scene (same logic as mmd_rtx countTris). */
export function countSceneTriangles(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const idx = mesh.geometry.index;
    n += idx ? idx.count / 3 : (mesh.geometry.getAttribute('position')?.count ?? 0) / 3;
  });
  return n | 0;
}
