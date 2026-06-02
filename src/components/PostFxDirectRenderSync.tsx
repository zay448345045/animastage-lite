import { useEffect, useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * When EffectComposer unmounts, reset renderer to direct screen output.
 * Without this, demand frameloop + postprocessing can leave a black framebuffer.
 */
export default function PostFxDirectRenderSync({
  composerEnabled,
}: {
  composerEnabled: boolean;
}) {
  const { gl, invalidate } = useThree();
  const wasComposerRef = useRef(composerEnabled);

  const resetDirectRender = () => {
    gl.setRenderTarget(null);
    gl.autoClear = true;
    invalidate();
  };

  useLayoutEffect(() => {
    const hadComposer = wasComposerRef.current;
    wasComposerRef.current = composerEnabled;
    if (hadComposer && !composerEnabled) {
      resetDirectRender();
    }
    if (!composerEnabled) {
      resetDirectRender();
    }
  }, [composerEnabled, gl, invalidate]);

  useEffect(() => {
    if (!composerEnabled) {
      const id = requestAnimationFrame(() => invalidate());
      return () => cancelAnimationFrame(id);
    }
    invalidate();
  }, [composerEnabled, invalidate]);

  return null;
}
