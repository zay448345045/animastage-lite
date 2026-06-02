import * as THREE from 'three';
import type { CameraFramingMode, CameraSnapshot } from '../../types';
import { getStageTargetVector } from '../../scene/cameraFraming';
import {
  computeDuoFovBoost,
  getRegisteredCharacterCount,
} from '../../scene/characterHeadRegistry';

/** Camera offset from focus point (+Z behind subject, MMD stage convention). */
export function buildFollowCameraSnapshotFromFocus(
  focus: THREE.Vector3,
  framing: CameraFramingMode
): CameraSnapshot {
  const duo = framing === 'duo' && getRegisteredCharacterCount() >= 2;
  const distance = duo ? 38 : 24;
  const lift = duo ? 2.5 : 1.8;
  const baseFov = duo ? 50 : 44;
  const fov = computeDuoFovBoost(baseFov, framing);

  return {
    position: [focus.x, focus.y + lift, focus.z + distance],
    rotation: [0, 0, 0],
    fov,
    target: [focus.x, focus.y, focus.z],
  };
}

/**
 * Product-layer framing for Shorts — static snapshot; does not touch VMD or keyframe eval.
 */
export function buildShortCameraSnapshot(framing: CameraFramingMode): CameraSnapshot {
  const target = getStageTargetVector(new THREE.Vector3());
  return buildFollowCameraSnapshotFromFocus(target, framing);
}
