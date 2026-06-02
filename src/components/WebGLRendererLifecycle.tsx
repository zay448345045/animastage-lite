import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import {
  attachWebGlCanvasGuard,
  detachWebGlCanvasGuard,
} from '../render/webglLifecycleStore';
import {
  clearWebGlRecoveryState,
  isGpuSuspended,
  isWebGlRecoveryInFlight,
} from '../render/graphicsSystemStore';

interface WebGLRendererLifecycleProps {
  onContextRestored: () => void;
}

/** Ensures canvas guard is attached from inside the R3F tree. */
export default function WebGLRendererLifecycle({
  onContextRestored,
}: WebGLRendererLifecycleProps) {
  const { gl } = useThree();

  useEffect(() => {
    attachWebGlCanvasGuard(gl.domElement, gl);
    return () => detachWebGlCanvasGuard(gl.domElement);
  }, [gl]);

  useEffect(() => {
    if (isGpuSuspended() || isWebGlRecoveryInFlight()) return;

    const canvas = gl.domElement;
    const onRestored = () => {
      clearWebGlRecoveryState();
      onContextRestored();
    };
    canvas.addEventListener('webglcontextrestored', onRestored, false);
    return () => canvas.removeEventListener('webglcontextrestored', onRestored);
  }, [gl, onContextRestored]);

  return null;
}
