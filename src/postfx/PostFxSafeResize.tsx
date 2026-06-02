import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import type { EffectComposer } from 'postprocessing';
import { safeComposerResize } from './mmdPostProcessing';

interface PostFxSafeResizeProps {
  composerRef: React.RefObject<EffectComposer | null>;
}

/** Safe composer resize on canvas/DPR changes — disposes stale GPU caches first. */
export default function PostFxSafeResize({ composerRef }: PostFxSafeResizeProps) {
  const { gl, size } = useThree();
  const prev = useRef({ w: 0, h: 0, dpr: 0 });

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    const dpr = gl.getPixelRatio();
    if (
      prev.current.w === size.width &&
      prev.current.h === size.height &&
      prev.current.dpr === dpr
    ) {
      return;
    }

    safeComposerResize(gl, composer, size.width, size.height);
    prev.current = { w: size.width, h: size.height, dpr };
  }, [composerRef, gl, size.width, size.height]);

  return null;
}
