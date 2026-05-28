import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

interface WebGLContextGuardProps {
  onContextLost: () => void;
  onContextRestored: () => void;
}

/**
 * Prevents default context-loss navigation and notifies the viewport to remount.
 */
export default function WebGLContextGuard({
  onContextLost,
  onContextRestored,
}: WebGLContextGuardProps) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleLost = (event: Event) => {
      event.preventDefault();
      gl.setAnimationLoop(null);
      onContextLost();
    };

    const handleRestored = () => {
      onContextRestored();
    };

    canvas.addEventListener('webglcontextlost', handleLost, false);
    canvas.addEventListener('webglcontextrestored', handleRestored, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
    };
  }, [gl, onContextLost, onContextRestored]);

  return null;
}

/** Cap DPR to reduce VRAM pressure when RTX / heavy post-processing is active. */
export function getViewportDpr(heavyGpu: boolean): number | [number, number] {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio || 1;
  if (heavyGpu) {
    return Math.min(dpr, 1.25);
  }
  return Math.min(dpr, 2);
}
