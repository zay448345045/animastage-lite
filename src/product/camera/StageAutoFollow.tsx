import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CameraFramingMode, CameraMode } from '../../types';
import {
  applyCameraSnapshot,
  applyCameraSnapshotDamped,
  isCameraPoseValid,
} from '../../components/CameraLogic';
import { resolveHeadTargetForCamera } from '../../scene/characterHeadRegistry';
import { buildFollowCameraSnapshotFromFocus, buildShortCameraSnapshot } from './frameShortCamera';
import { isRecordingCapture } from '../../video/recordingCapture';

const FOLLOW_ALPHA_PLAYBACK = 0.22;

interface StageAutoFollowProps {
  enabled: boolean;
  cameraMode: CameraMode;
  framing: CameraFramingMode;
  followModelId: string | null;
}

/**
 * Smooth stage framing in free mode (1 or 2 characters). Snaps every frame while recording.
 */
export default function StageAutoFollow({
  enabled,
  cameraMode,
  framing,
  followModelId,
}: StageAutoFollowProps) {
  const { camera, controls } = useThree();
  const goalPosition = useRef(new THREE.Vector3());
  const goalTarget = useRef(new THREE.Vector3());
  const fallback = useRef(new THREE.Vector3(0, 10, 0));
  const focusScratch = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!enabled || cameraMode !== 'free') return;
    const cam = camera as THREE.PerspectiveCamera;
    if (!(cam instanceof THREE.PerspectiveCamera)) return;

    const focus = focusScratch.current;
    const hasTarget = resolveHeadTargetForCamera(
      followModelId,
      framing,
      fallback.current,
      focus
    );

    const snapshot = hasTarget
      ? buildFollowCameraSnapshotFromFocus(focus, framing)
      : buildShortCameraSnapshot(framing);

    const capturing = isRecordingCapture();
    const alpha = capturing ? 1 : FOLLOW_ALPHA_PLAYBACK;

    if (capturing || alpha >= 1) {
      applyCameraSnapshot(cam, snapshot);
      goalPosition.current.set(
        snapshot.position[0],
        snapshot.position[1],
        snapshot.position[2]
      );
      goalTarget.current.set(snapshot.target[0], snapshot.target[1], snapshot.target[2]);
    } else {
      applyCameraSnapshotDamped(
        cam,
        snapshot,
        goalPosition.current,
        goalTarget.current,
        alpha
      );
    }

    const orbit = controls as OrbitControlsImpl | null;
    if (orbit?.target) {
      if (capturing) {
        orbit.target.set(snapshot.target[0], snapshot.target[1], snapshot.target[2]);
      } else {
        orbit.target.lerp(goalTarget.current, alpha);
      }
      orbit.update();
    }

    if (!isCameraPoseValid(cam)) {
      const safe = buildShortCameraSnapshot(framing);
      applyCameraSnapshot(cam, safe);
      goalPosition.current.set(safe.position[0], safe.position[1], safe.position[2]);
      goalTarget.current.set(safe.target[0], safe.target[1], safe.target[2]);
    }
  });

  return null;
}
