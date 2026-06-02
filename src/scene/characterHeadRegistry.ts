import * as THREE from 'three';
import type { CameraFramingMode } from '../types';
import { findHeadWorldPosition } from '../utils/cameraFollow';

type RootGetter = () => THREE.Object3D | null;

const roots = new Map<string, RootGetter>();
const _headScratch = new THREE.Vector3();

export function registerCharacterRoot(
  modelId: string,
  getRoot: RootGetter
): () => void {
  roots.set(modelId, getRoot);
  return () => {
    if (roots.get(modelId) === getRoot) {
      roots.delete(modelId);
    }
  };
}

export function getRegisteredCharacterCount(): number {
  return roots.size;
}

/** World position of each registered model root (for body/full camera focus). */
export function collectCharacterRootPositions(out: THREE.Vector3[]): number {
  out.length = 0;
  for (const getRoot of roots.values()) {
    const root = getRoot?.();
    if (!root) continue;
    const p = new THREE.Vector3();
    root.getWorldPosition(p);
    out.push(p);
  }
  return out.length;
}

function collectHeadPositions(out: THREE.Vector3[]): number {
  out.length = 0;
  for (const getRoot of roots.values()) {
    const root = getRoot?.();
    if (!root) continue;
    const head = findHeadWorldPosition(root, _headScratch);
    if (head) out.push(head.clone());
  }
  return out.length;
}

/** Center between all visible character heads (for duo/group framing). */
export function resolveDuoHeadTargetForCamera(
  fallback: THREE.Vector3,
  out: THREE.Vector3
): boolean {
  const heads: THREE.Vector3[] = [];
  const count = collectHeadPositions(heads);
  if (count === 0) return false;
  if (count === 1) {
    out.copy(heads[0]!);
    return true;
  }
  out.set(0, 0, 0);
  for (const h of heads) out.add(h);
  out.divideScalar(count);
  return true;
}

export function resolveHeadTargetForCamera(
  followModelId: string | null | undefined,
  framing: CameraFramingMode,
  fallback: THREE.Vector3,
  out: THREE.Vector3
): boolean {
  if (framing === 'duo' || getRegisteredCharacterCount() > 0) {
    if (resolveDuoHeadTargetForCamera(fallback, out)) return true;
  }

  if (followModelId) {
    const getRoot = roots.get(followModelId);
    const root = getRoot?.();
    if (root) {
      const head = findHeadWorldPosition(root, out);
      if (head) return true;
    }
  }

  for (const getRoot of roots.values()) {
    const root = getRoot?.();
    if (!root) continue;
    const head = findHeadWorldPosition(root, out);
    if (head) return true;
  }

  out.copy(fallback);
  return false;
}

/** Extra FOV so both characters stay in frame during orbit templates. */
export function computeDuoFovBoost(fov: number, framing: CameraFramingMode): number {
  if (framing !== 'duo' || getRegisteredCharacterCount() < 2) return fov;
  const heads: THREE.Vector3[] = [];
  collectHeadPositions(heads);
  if (heads.length < 2) return fov;
  const span = heads[0]!.distanceTo(heads[1]!);
  const boost = THREE.MathUtils.clamp(6 + span * 0.35, 6, 18);
  return THREE.MathUtils.clamp(fov + boost, 10, 120);
}
