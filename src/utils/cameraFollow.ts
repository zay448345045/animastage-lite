import * as THREE from 'three';

/** Orbit / MMD camera target smoothing (0–1 per frame). */
export const CAMERA_DAMP_FACTOR = 0.12;

export const MIN_POLAR_ANGLE = 0.12;
export const MAX_POLAR_ANGLE = Math.PI / 2 + 0.12;

export const HEAD_BONE_NAMES = ['頭', 'head', 'Head', 'HEAD', '頭点'];

export function findHeadBone(root: THREE.Object3D): THREE.Object3D | null {
  let exact: THREE.Object3D | null = null;
  let fuzzy: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Bone) && obj.type !== 'Bone') return;
    const name = obj.name;
    const lower = name.toLowerCase();
    if (HEAD_BONE_NAMES.some((n) => name === n || lower === n.toLowerCase())) {
      exact = obj;
      return;
    }
    if (
      !fuzzy &&
      (name.includes('頭') || lower === 'head' || lower.endsWith('.head') || lower.endsWith('_head'))
    ) {
      fuzzy = obj;
    }
  });
  return exact ?? fuzzy;
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
