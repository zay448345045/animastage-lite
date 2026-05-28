import * as THREE from 'three';
import type { CameraFocusTarget } from '../types';

export type { CameraFocusTarget };

export interface ModelFocusPoints {
  face: THREE.Vector3;
  body: THREE.Vector3;
  full: THREE.Vector3;
  groundY: number;
}

const HEAD_NAMES = ['頭', 'head', 'Head', 'HEAD', '頭点', '首'];
const BODY_NAMES = ['上半身', '上半身2', 'spine', 'センター', 'center', 'Center', '腰'];

function findBoneWorldPosition(
  skeleton: THREE.Skeleton,
  names: string[],
  out: THREE.Vector3
): boolean {
  for (const bone of skeleton.bones) {
    for (const name of names) {
      if (
        bone.name === name ||
        bone.name.toLowerCase() === name.toLowerCase() ||
        bone.name.includes(name)
      ) {
        bone.getWorldPosition(out);
        return true;
      }
    }
  }
  return false;
}

export function computeModelFocusPoints(mesh: THREE.SkinnedMesh): ModelFocusPoints {
  mesh.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const face = new THREE.Vector3();
  const body = new THREE.Vector3();
  const full = new THREE.Vector3();

  if (!findBoneWorldPosition(mesh.skeleton, HEAD_NAMES, face)) {
    face.set(center.x, box.min.y + size.y * 0.88, center.z);
  } else {
    face.y += size.y * 0.02;
  }

  if (!findBoneWorldPosition(mesh.skeleton, BODY_NAMES, body)) {
    body.set(center.x, box.min.y + size.y * 0.55, center.z);
  }

  full.set(center.x, box.min.y + size.y * 0.5, center.z);

  return {
    face,
    body,
    full,
    groundY: box.min.y,
  };
}

export function pickFocusPoint(
  points: ModelFocusPoints,
  target: CameraFocusTarget
): THREE.Vector3 {
  switch (target) {
    case 'face':
      return points.face.clone();
    case 'body':
      return points.body.clone();
    default:
      return points.full.clone();
  }
}

/** Orbit polar limits that block low/upskirt angles (radians from +Y). */
export function modestPolarLimits(enabled: boolean): {
  minPolarAngle: number;
  maxPolarAngle: number;
} {
  if (!enabled) {
    return { minPolarAngle: 0.08, maxPolarAngle: Math.PI / 2 + 0.08 };
  }
  return {
    minPolarAngle: 0.12,
    maxPolarAngle: Math.PI / 2 - 0.22,
  };
}
