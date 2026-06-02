import { useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { isWebGlContextReady } from './isWebGlContextReady';

/**
 * Postprocessing EffectComposer calls gl.getContext().getContextAttributes() on init.
 * If the canvas context is not ready yet (remount / context loss), that throws on `.alpha`.
 */
export function usePostFxGlReady(): boolean {
  const { gl, size } = useThree();
  const [ready, setReady] = useState(() => isWebGlContextReady(gl));

  useEffect(() => {
    const canvas = gl.domElement;

    const onRestored = () => setReady(isWebGlContextReady(gl));
    const onLost = () => setReady(false);

    onRestored();
    canvas.addEventListener('webglcontextrestored', onRestored);
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      canvas.removeEventListener('webglcontextrestored', onRestored);
      canvas.removeEventListener('webglcontextlost', onLost);
    };
  }, [gl]);

  useFrame(() => {
    if (!ready && isWebGlContextReady(gl)) {
      setReady(true);
    }
  });

  return ready && size.width > 0 && size.height > 0;
}
