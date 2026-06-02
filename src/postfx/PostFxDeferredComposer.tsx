import { EffectComposer } from '@react-three/postprocessing';
import { useEffect, useState, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { isWebGlContextReady } from './isWebGlContextReady';
import { usePostFxGlReady } from './usePostFxGlReady';

const WARMUP_FRAMES = 4;

interface PostFxDeferredComposerProps {
  enabled: boolean;
  composerKey: string;
  multisampling?: number;
  enableNormalPass?: boolean;
  children: ReactNode;
}

/**
 * Mount EffectComposer only after WebGL context + a few frames (avoids alpha null crash).
 */
export default function PostFxDeferredComposer({
  enabled,
  composerKey,
  multisampling = 0,
  enableNormalPass = false,
  children,
}: PostFxDeferredComposerProps) {
  const gl = useThree((s) => s.gl);
  const glReady = usePostFxGlReady();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!enabled || !glReady) {
      setArmed(false);
      return;
    }

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      if (frame >= WARMUP_FRAMES && isWebGlContextReady(gl)) {
        setArmed(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      setArmed(false);
    };
  }, [enabled, glReady, gl, composerKey]);

  if (!enabled || !glReady || !armed) {
    return null;
  }

  return (
    <EffectComposer
      key={composerKey}
      multisampling={multisampling}
      enableNormalPass={enableNormalPass}
    >
      {children}
    </EffectComposer>
  );
}
