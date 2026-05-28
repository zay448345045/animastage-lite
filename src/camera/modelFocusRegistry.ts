import type * as THREE from 'three';

let activeMesh: THREE.SkinnedMesh | null = null;

export function setActiveFocusMesh(mesh: THREE.SkinnedMesh | null): void {
  activeMesh = mesh;
}

export function getActiveFocusMesh(): THREE.SkinnedMesh | null {
  return activeMesh;
}
