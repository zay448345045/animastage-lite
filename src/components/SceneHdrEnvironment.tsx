import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { disposeHdrEnvironment, loadHdrEnvironmentFromFile } from '../utils/hdrEnvironment';

interface SceneHdrEnvironmentProps {
  /** Object URL from dropped .hdr file */
  hdrBlobUrl: string | null;
  intensity?: number;
  showAsBackground?: boolean;
}

export default function SceneHdrEnvironment({
  hdrBlobUrl,
  intensity = 1,
  showAsBackground = false,
}: SceneHdrEnvironmentProps) {
  const { scene, gl } = useThree();
  const hdrRef = useRef<Awaited<ReturnType<typeof loadHdrEnvironmentFromFile>> | null>(null);
  const savedBg = useRef<THREE.Color | THREE.Texture | null>(null);

  useEffect(() => {
    if (!hdrBlobUrl) {
      if (hdrRef.current) {
        disposeHdrEnvironment(hdrRef.current);
        hdrRef.current = null;
      }
      scene.environment = null;
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(hdrBlobUrl);
        const blob = await res.blob();
        const file = new File([blob], 'environment.hdr', { type: 'application/octet-stream' });
        const loaded = await loadHdrEnvironmentFromFile(file, gl, { pmremSize: 128 });
        if (cancelled) {
          disposeHdrEnvironment(loaded);
          return;
        }
        if (hdrRef.current) disposeHdrEnvironment(hdrRef.current);
        hdrRef.current = loaded;
        scene.environment = loaded.envMap;
        scene.environmentIntensity = intensity;
        if (showAsBackground) {
          savedBg.current = scene.background;
          scene.background = loaded.envMap;
        }
      } catch (e) {
        console.warn('[HDR] Environment load failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hdrBlobUrl, gl, scene, showAsBackground]);

  useEffect(() => {
    scene.environmentIntensity = intensity;
  }, [intensity, scene]);

  useEffect(() => {
    return () => {
      if (hdrRef.current) {
        disposeHdrEnvironment(hdrRef.current);
        hdrRef.current = null;
      }
      scene.environment = null;
      if (savedBg.current !== null) {
        scene.background = savedBg.current;
      }
    };
  }, [scene]);

  return null;
}
