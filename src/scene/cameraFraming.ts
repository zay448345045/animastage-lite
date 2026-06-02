import * as THREE from 'three';
import type { CameraFramingMode, MMDModel } from '../types';
import { resolveDuoHeadTargetForCamera } from './characterHeadRegistry';

const FALLBACK_TARGET = new THREE.Vector3(0, 10, 0);
const _scratch = new THREE.Vector3();

export function resolveCameraFramingFromModels(
  models: readonly MMDModel[]
): CameraFramingMode {
  const visible = models.filter((m) => m.visible).length;
  return visible >= 2 ? 'duo' : 'single';
}

/** Stage orbit target — center of duo heads when 2+ characters are registered. */
export function getStageTargetTuple(): [number, number, number] {
  if (resolveDuoHeadTargetForCamera(FALLBACK_TARGET, _scratch)) {
    return [_scratch.x, _scratch.y, _scratch.z];
  }
  return [0, 10, 0];
}

export function getStageTargetVector(out = new THREE.Vector3()): THREE.Vector3 {
  if (resolveDuoHeadTargetForCamera(FALLBACK_TARGET, out)) return out;
  return out.copy(FALLBACK_TARGET);
}
