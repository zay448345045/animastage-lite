import { useMemo } from 'react';
import * as THREE from 'three';

export interface StaticGroundShadowProps {
  enabled: boolean;
  size?: number;
  opacity?: number;
}

/**
 * Static shadow receiver for immovable floor — does not cast or update shadow maps.
 * Dynamic character shadows come from CSM cascades above.
 */
export default function StaticGroundShadow({
  enabled,
  size = 60,
  opacity = 0.35,
}: StaticGroundShadowProps) {
  const material = useMemo(
    () =>
      new THREE.ShadowMaterial({
        opacity,
        color: '#000000',
      }),
    [opacity]
  );

  if (!enabled) return null;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.002, 0]}
      receiveShadow
      castShadow={false}
      userData={{ staticShadow: true }}
    >
      <planeGeometry args={[size, size]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
