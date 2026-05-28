import * as THREE from 'three';

/** Orbit / MMD camera target smoothing (0–1 per frame). */
export const CAMERA_DAMP_FACTOR = 0.12;

export const MIN_POLAR_ANGLE = 0.12;
export const MAX_POLAR_ANGLE = Math.PI / 2 + 0.12;

export const HEAD_BONE_NAMES = ['頭', 'head', 'Head', 'HEAD', '頭点'];

export function findHeadBone(root: THREE.Object3D): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (found) return;
    if (!(obj instanceof THREE.Bone) && obj.type !== 'Bone') return;
    const name = obj.name;
    if (HEAD_BONE_NAMES.some((n) => name === n || name.includes(n))) {
      found = obj;
    }
  });
  return found;
}

export function findHeadWorldPosition(
  root: THREE.Object3D,
  out = new THREE.Vector3()
): THREE.Vector3 | null {
  const head = findHeadBone(root);
  if (!head) return null;
  head.getWorldPosition(out);
  return out;
}
