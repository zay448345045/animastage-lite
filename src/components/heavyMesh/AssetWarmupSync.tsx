import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import type { MMDAnimationHelper } from 'three-stdlib';
import type { SkinnedMesh } from 'three';
import { runWhenIdle } from '../../perf/modelLoadProfile';
import { runAssetWarmupPipeline } from '../../render/assetWarmupPipeline';

interface AssetWarmupSyncProps {
  mesh: SkinnedMesh;
  ready: boolean;
  helper: MMDAnimationHelper | null;
  animationClip?: { duration: number } | null;
}

/** Hidden shader/texture compile before first play — render-only. */
export default function AssetWarmupSync({
  mesh,
  ready,
  helper,
  animationClip,
}: AssetWarmupSyncProps) {
  const { gl, scene, camera } = useThree();
  const warmedRef = useRef(false);

  useEffect(() => {
    if (!ready || !mesh || warmedRef.current) return;
    warmedRef.current = true;

    runWhenIdle(() => {
      void runAssetWarmupPipeline({
        mesh,
        renderer: gl,
        scene,
        camera,
        helper,
        animationClip: animationClip as import('three').AnimationClip | null,
      }).catch((err) => {
        console.warn('[AssetWarmup] skipped:', err);
      });
    }, 6000);
  }, [ready, mesh, gl, scene, camera, helper, animationClip]);

  return null;
}
