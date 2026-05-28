import { Suspense, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneBackgroundSettings } from '../types';

const BG_DISTANCE = 100;

interface BackgroundPlateProps {
  url: string;
  opacity: number;
}

function BackgroundPlate({ url, opacity }: BackgroundPlateProps) {
  const texture = useTexture(url);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame(() => {
    const mesh = meshRef.current;
    const cam = camera as THREE.PerspectiveCamera;
    if (!mesh || !(cam instanceof THREE.PerspectiveCamera)) return;

    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    mesh.position.copy(cam.position).addScaledVector(dir, BG_DISTANCE);
    mesh.quaternion.copy(cam.quaternion);

    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const viewH = 2 * Math.tan(vFov / 2) * BG_DISTANCE;
    const viewW = viewH * cam.aspect;

    const img = texture.image as HTMLImageElement | undefined;
    const imgAspect =
      img && img.width > 0 && img.height > 0 ? img.width / img.height : cam.aspect;
    const viewAspect = cam.aspect;

    // object-fit: cover — fill the entire 9:16 frame without letterboxing
    let planeW = viewW;
    let planeH = viewH;
    if (imgAspect > viewAspect) {
      planeW = viewH * imgAspect;
    } else {
      planeH = viewW / imgAspect;
    }

    mesh.scale.set(planeW, planeH, 1);
  });

  return (
    <mesh ref={meshRef} renderOrder={-2000} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}

interface CameraSceneBackgroundProps {
  background: SceneBackgroundSettings;
}

export default function CameraSceneBackground({ background }: CameraSceneBackgroundProps) {
  const url = background.imageUrl;
  const opacity = background.opacity;

  if (!url || opacity <= 0) return null;

  return (
    <Suspense fallback={null}>
      <BackgroundPlate url={url} opacity={opacity} />
    </Suspense>
  );
}

/** Keeps perspective camera aspect matched to the 9:16 (or any) viewport. */
export function CameraAspectSync() {
  const { camera, size } = useThree();

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!(cam instanceof THREE.PerspectiveCamera)) return;
    const nextAspect = size.width / Math.max(size.height, 1);
    if (Math.abs(cam.aspect - nextAspect) > 1e-4) {
      cam.aspect = nextAspect;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
