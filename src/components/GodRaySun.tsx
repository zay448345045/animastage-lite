import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Emissive sun mesh for postprocessing GodRays (mmd_rtx). */
const GodRaySun = forwardRef<THREE.Mesh, { enabled: boolean }>(function GodRaySun(
  { enabled },
  ref
) {
  const meshRef = useRef<THREE.Mesh>(null);

  useImperativeHandle(ref, () => meshRef.current as THREE.Mesh, []);

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 0.96, 0.88),
        toneMapped: false,
        depthWrite: false,
      }),
    []
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || !enabled) return;
    const t = state.clock.elapsedTime * 0.06;
    mesh.position.set(
      16 + Math.sin(t) * 2.5,
      20 + Math.cos(t * 0.65) * 1.2,
      10 + Math.cos(t * 0.45) * 2
    );
    mesh.visible = enabled;
  });

  if (!enabled) return null;

  return (
    <mesh ref={meshRef} material={mat} renderOrder={9999} frustumCulled={false}>
      <sphereGeometry args={[2.5, 10, 10]} />
    </mesh>
  );
});

export default GodRaySun;
