import * as THREE from 'three';
import type { CameraFocusTarget, CameraFramingMode, CameraSnapshot } from '../types';
import {
  collectCharacterRootPositions,
  resolveDuoHeadTargetForCamera,
  resolveHeadTargetForCamera,
} from './characterHeadRegistry';

const BODY_LIFT = 8.5;
const FULL_LIFT = 6;

export function resolveStudioFocusPoint(
  followModelId: string | null | undefined,
  framing: CameraFramingMode,
  focusTarget: CameraFocusTarget,
  fallback: THREE.Vector3,
  out: THREE.Vector3
): boolean {
  if (focusTarget === 'face') {
    return resolveHeadTargetForCamera(followModelId, framing, fallback, out);
  }

  if (focusTarget === 'body') {
    if (resolveHeadTargetForCamera(followModelId, framing, fallback, out)) {
      out.y -= 2.5;
      return true;
    }
    const roots: THREE.Vector3[] = [];
    if (collectCharacterRootPositions(roots) > 0) {
      out.set(0, 0, 0);
      for (const p of roots) out.add(p);
      out.divideScalar(roots.length);
      out.y += BODY_LIFT;
      return true;
    }
    return false;
  }

  const roots: THREE.Vector3[] = [];
  if (collectCharacterRootPositions(roots) >= 2) {
    out.set(0, 0, 0);
    for (const p of roots) out.add(p);
    out.divideScalar(roots.length);
    out.y += FULL_LIFT;
    return true;
  }

  if (resolveDuoHeadTargetForCamera(fallback, out)) return true;
  return resolveHeadTargetForCamera(followModelId, framing, fallback, out);
}

/** Move orbit path baked around anchor so it tracks the character during playback. */
export function offsetCameraSnapshotToFocus(
  snapshot: CameraSnapshot,
  anchor: [number, number, number],
  focus: THREE.Vector3
): CameraSnapshot {
  const dx = focus.x - anchor[0];
  const dy = focus.y - anchor[1];
  const dz = focus.z - anchor[2];
  return {
    position: [
      snapshot.position[0] + dx,
      snapshot.position[1] + dy,
      snapshot.position[2] + dz,
    ],
    rotation: [...snapshot.rotation],
    fov: snapshot.fov,
    target: [focus.x, focus.y, focus.z],
  };
}
