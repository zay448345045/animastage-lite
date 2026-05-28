import * as THREE from 'three';
import type { CameraKeyframe, CameraSnapshot } from '../types';
import { frameToTime, seekAnimationMixer } from '../utils/animationSync';
import { CAMERA_DAMP_FACTOR } from '../utils/cameraFollow';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function createCameraKeyframeId(): string {
  return `cam_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function lerpScalar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpTuple3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    lerpScalar(a[0], b[0], t),
    lerpScalar(a[1], b[1], t),
    lerpScalar(a[2], b[2], t),
  ];
}

export function createEmptyCameraKeyframes(): CameraKeyframe[] {
  return [];
}

export function countCameraKeyframes(keyframes: CameraKeyframe[]): number {
  return keyframes.length;
}

export function addCameraKeyframe(
  keyframes: CameraKeyframe[],
  frame: number,
  snapshot: CameraSnapshot
): CameraKeyframe[] {
  const next = keyframes.filter((kf) => kf.frame !== frame);
  next.push({
    id: createCameraKeyframeId(),
    frame,
    position: [...snapshot.position],
    rotation: [...snapshot.rotation],
    fov: snapshot.fov,
  });
  return next.sort((a, b) => a.frame - b.frame);
}

export function deleteCameraKeyframe(keyframes: CameraKeyframe[], frame: number): CameraKeyframe[] {
  return keyframes.filter((kf) => kf.frame !== frame);
}

function cameraKeyframeKey(frame: number): string {
  return String(frame);
}

/** Stack camera keys — incoming wins on the same frame. */
export function mergeCameraKeyframes(
  existing: CameraKeyframe[],
  incoming: CameraKeyframe[]
): CameraKeyframe[] {
  const map = new Map<string, CameraKeyframe>();
  for (const kf of existing) {
    map.set(cameraKeyframeKey(kf.frame), kf);
  }
  for (const kf of incoming) {
    map.set(cameraKeyframeKey(kf.frame), {
      ...kf,
      id: createCameraKeyframeId(),
    });
  }
  return Array.from(map.values()).sort((a, b) => a.frame - b.frame);
}

export function captureCameraSnapshot(
  camera: THREE.PerspectiveCamera,
  orbitTarget?: THREE.Vector3
): CameraSnapshot {
  const target = orbitTarget ?? new THREE.Vector3(0, 10, 0);
  return {
    position: [camera.position.x, camera.position.y, camera.position.z],
    rotation: [
      camera.rotation.x * RAD2DEG,
      camera.rotation.y * RAD2DEG,
      camera.rotation.z * RAD2DEG,
    ],
    fov: camera.fov,
    target: [target.x, target.y, target.z],
  };
}

export function evaluateCameraAtFrame(
  keyframes: CameraKeyframe[],
  frame: number,
  fallback: CameraSnapshot
): CameraSnapshot {
  if (keyframes.length === 0) return fallback;

  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  const exact = sorted.find((kf) => kf.frame === frame);
  if (exact) {
    return {
      position: [...exact.position],
      rotation: [...exact.rotation],
      fov: exact.fov,
      target: [...fallback.target],
    };
  }

  if (frame <= sorted[0].frame) {
    const first = sorted[0];
    return {
      position: [...first.position],
      rotation: [...first.rotation],
      fov: first.fov,
      target: [...fallback.target],
    };
  }

  if (frame >= sorted[sorted.length - 1].frame) {
    const last = sorted[sorted.length - 1];
    return {
      position: [...last.position],
      rotation: [...last.rotation],
      fov: last.fov,
      target: [...fallback.target],
    };
  }

  let prev = sorted[0];
  let next = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  const range = next.frame - prev.frame;
  const t = range === 0 ? 0 : (frame - prev.frame) / range;

  return {
    position: lerpTuple3(prev.position, next.position, t),
    rotation: lerpTuple3(prev.rotation, next.rotation, t),
    fov: lerpScalar(prev.fov, next.fov, t),
    target: [...fallback.target],
  };
}

/**
 * Smooth camera transition — never snap with `.copy()` in the render loop.
 */
export function applyCameraSnapshotDamped(
  camera: THREE.PerspectiveCamera,
  snapshot: CameraSnapshot,
  goalPosition: THREE.Vector3,
  lookTarget: THREE.Vector3,
  alpha = CAMERA_DAMP_FACTOR
): void {
  if (
    !Number.isFinite(snapshot.position[0]) ||
    !Number.isFinite(snapshot.position[1]) ||
    !Number.isFinite(snapshot.position[2])
  ) {
    return;
  }

  goalPosition.set(snapshot.position[0], snapshot.position[1], snapshot.position[2]);
  lookTarget.set(snapshot.target[0], snapshot.target[1], snapshot.target[2]);

  camera.position.lerp(goalPosition, alpha);
  camera.fov = THREE.MathUtils.lerp(
    camera.fov,
    THREE.MathUtils.clamp(snapshot.fov, 10, 120),
    alpha
  );
  camera.updateProjectionMatrix();

  if (lookTarget.lengthSq() > 1e-8 && Number.isFinite(lookTarget.x)) {
    camera.lookAt(lookTarget);
    return;
  }

  const rotGoal = new THREE.Euler(
    snapshot.rotation[0] * DEG2RAD,
    snapshot.rotation[1] * DEG2RAD,
    snapshot.rotation[2] * DEG2RAD
  );
  camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, rotGoal.x, alpha);
  camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, rotGoal.y, alpha);
  camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, rotGoal.z, alpha);
}

export function applyCameraSnapshot(
  camera: THREE.PerspectiveCamera,
  snapshot: CameraSnapshot
): void {
  if (
    !Number.isFinite(snapshot.position[0]) ||
    !Number.isFinite(snapshot.position[1]) ||
    !Number.isFinite(snapshot.position[2])
  ) {
    return;
  }

  camera.position.set(snapshot.position[0], snapshot.position[1], snapshot.position[2]);
  camera.fov = THREE.MathUtils.clamp(snapshot.fov, 10, 120);
  camera.updateProjectionMatrix();

  const target = new THREE.Vector3(
    snapshot.target[0],
    snapshot.target[1],
    snapshot.target[2]
  );
  if (target.lengthSq() > 1e-8 && Number.isFinite(target.x)) {
    camera.lookAt(target);
    return;
  }

  camera.rotation.set(
    snapshot.rotation[0] * DEG2RAD,
    snapshot.rotation[1] * DEG2RAD,
    snapshot.rotation[2] * DEG2RAD
  );
}

export function isCameraPoseValid(camera: THREE.PerspectiveCamera): boolean {
  return (
    Number.isFinite(camera.position.x) &&
    Number.isFinite(camera.position.y) &&
    Number.isFinite(camera.position.z) &&
    camera.position.length() < 5000
  );
}

export function applyDefaultStageCamera(camera: THREE.PerspectiveCamera): void {
  applyCameraSnapshot(camera, {
    position: [0, 14, 28],
    rotation: [0, 0, 0],
    fov: 45,
    target: [0, 10, 0],
  });
}

export function syncMmdCameraMixerToFrame(
  mixer: THREE.AnimationMixer | undefined,
  frame: number,
  fps: number,
  camera: THREE.PerspectiveCamera,
  cameraTarget: THREE.Object3D
): void {
  const time = frameToTime(frame, fps);
  seekAnimationMixer(mixer, time);
  if (mixer) {
    mixer.update(0);
  }
  camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0);
  camera.up.applyQuaternion(camera.quaternion);
  camera.lookAt(cameraTarget.position);
}

export function syncOrbitFromCamera(
  camera: THREE.PerspectiveCamera,
  orbitTarget: THREE.Vector3,
  fallbackTarget: THREE.Vector3 = new THREE.Vector3(0, 10, 0)
): void {
  if (!Number.isFinite(camera.position.x)) return;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  if (direction.lengthSq() < 1e-8) {
    orbitTarget.copy(fallbackTarget);
    return;
  }

  const distance = Math.max(5, camera.position.distanceTo(fallbackTarget));
  orbitTarget.copy(camera.position).add(direction.multiplyScalar(distance));

  if (
    !Number.isFinite(orbitTarget.x) ||
    !Number.isFinite(orbitTarget.y) ||
    !Number.isFinite(orbitTarget.z)
  ) {
    orbitTarget.copy(fallbackTarget);
  }
}
