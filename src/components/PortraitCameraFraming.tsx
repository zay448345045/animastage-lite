import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraFramingMode, CameraMode, ViewportFormat } from '../types';
import { getStageTargetVector } from '../scene/cameraFraming';

const PORTRAIT_TARGET = new THREE.Vector3(0, 11, 0);
const PORTRAIT_CAMERA_POS = new THREE.Vector3(0, 12.5, 20);
const PORTRAIT_FOV = 42;
const DUO_PORTRAIT_FOV = 48;

interface PortraitCameraFramingProps {
  format: ViewportFormat;
  cameraMode: CameraMode;
  cameraFraming?: CameraFramingMode;
  modelOffset?: { x: number; y: number; z: number };
  /** When true, StageAutoFollow owns framing — only sync canvas aspect here. */
  autoFocusEnabled?: boolean;
}

/** Syncs perspective aspect to canvas size and reframes for vertical portrait. */
export default function PortraitCameraFraming({
  format,
  cameraMode,
  cameraFraming = 'single',
  modelOffset = { x: 0, y: 0, z: 0 },
  autoFocusEnabled = false,
}: PortraitCameraFramingProps) {
  const { camera, size, controls } = useThree();
  const appliedPortraitRef = useRef(false);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!(cam instanceof THREE.PerspectiveCamera)) return;

    const nextAspect = size.width / Math.max(size.height, 1);
    if (Math.abs(cam.aspect - nextAspect) > 1e-4) {
      cam.aspect = nextAspect;
      cam.updateProjectionMatrix();
    }
  });

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!(cam instanceof THREE.PerspectiveCamera)) return;

    if (format !== '9:16') {
      appliedPortraitRef.current = false;
      return;
    }

    if (autoFocusEnabled) {
      appliedPortraitRef.current = false;
      return;
    }

    if (cameraMode !== 'free' || appliedPortraitRef.current) return;

    const stageCenter =
      cameraFraming === 'duo'
        ? getStageTargetVector(new THREE.Vector3())
        : PORTRAIT_TARGET.clone().add(
            new THREE.Vector3(modelOffset.x, modelOffset.y, modelOffset.z)
          );

    const position = PORTRAIT_CAMERA_POS.clone();
    if (cameraFraming === 'duo') {
      position.x = stageCenter.x;
      position.z = stageCenter.z + 22;
      position.y = stageCenter.y + 2;
    } else {
      position.add(new THREE.Vector3(modelOffset.x, modelOffset.y * 0.5, modelOffset.z));
    }

    cam.position.copy(position);
    cam.fov = cameraFraming === 'duo' ? DUO_PORTRAIT_FOV : PORTRAIT_FOV;
    cam.lookAt(stageCenter);
    cam.updateProjectionMatrix();

    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null;
    if (orbit?.target) {
      orbit.target.copy(stageCenter);
      orbit.update?.();
    }

    appliedPortraitRef.current = true;
  }, [
    camera,
    controls,
    format,
    cameraMode,
    cameraFraming,
    modelOffset.x,
    modelOffset.y,
    modelOffset.z,
    autoFocusEnabled,
  ]);

  useEffect(() => {
    if (format === '16:9') {
      appliedPortraitRef.current = false;
    }
  }, [format, modelOffset.x, modelOffset.y, modelOffset.z]);

  return null;
}
