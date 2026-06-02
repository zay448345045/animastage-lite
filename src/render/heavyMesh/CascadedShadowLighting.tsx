import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CSM } from 'three/addons/csm/CSM.js';
import {
  getUltraHeavyMeshSnapshot,
  resolveUltraHeavyCsmCascades,
  subscribeUltraHeavyMesh,
} from './heavyMeshOptimizer';
import { HEAVY_MESH_MEMORY } from './memoryProfile';

export interface CascadedShadowLightingProps {
  enabled: boolean;
  shadowMapSize: number;
  lightIntensity?: number;
  cascades?: number;
  maxFar?: number;
}

/**
 * Cascade Shadow Maps for large open scenes (450k+ poly models).
 * Replaces a single directional shadow frustum with multiple cascades.
 */
export default function CascadedShadowLighting({
  enabled,
  shadowMapSize,
  lightIntensity = 2.1,
  cascades = resolveUltraHeavyCsmCascades(),
  maxFar = 80,
}: CascadedShadowLightingProps) {
  const { scene, camera } = useThree();
  const csmRef = useRef<CSM | null>(null);
  const patchedMaterials = useRef<WeakSet<THREE.Material>>(new WeakSet());
  const effectiveMapSize = Math.min(shadowMapSize, HEAVY_MESH_MEMORY.csmShadowMapCap);

  useEffect(() => {
    if (!enabled) return;

    const csm = new CSM({
      camera,
      parent: scene,
      cascades,
      maxFar,
      shadowMapSize: effectiveMapSize,
      lightDirection: new THREE.Vector3(-1, -1.2, -0.8).normalize(),
      lightIntensity,
      lightNear: 0.5,
      lightFar: 120,
      lightMargin: 120,
      mode: 'practical',
    });
    csm.fade = true;
    csmRef.current = csm;

    return () => {
      csm.remove();
      csm.dispose();
      csmRef.current = null;
      patchedMaterials.current = new WeakSet();
    };
  }, [enabled, scene, camera, cascades, maxFar, effectiveMapSize, lightIntensity]);

  useFrame(() => {
    const csm = csmRef.current;
    if (!enabled || !csm) return;

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.SkinnedMesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (!mat || patchedMaterials.current.has(mat)) continue;
        csm.setupMaterial(mat);
        patchedMaterials.current.add(mat);
      }
    });

    csm.update();
  }, 1);

  return null;
}

/** Re-renders when an ultra-heavy mesh activates the GPU pipeline. */
export function useCascadedShadowsEnabled(
  baseEnabled: boolean,
  portraitLite: boolean
): boolean {
  const ultraHeavy = useSyncExternalStore(
    subscribeUltraHeavyMesh,
    getUltraHeavyMeshSnapshot
  );
  return baseEnabled && !portraitLite && ultraHeavy;
}
