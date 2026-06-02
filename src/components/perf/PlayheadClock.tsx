import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MMD_FPS, playheadRef } from '../../utils/playhead';

interface PlayheadClockProps {
  playing: boolean;
  maxFrames: number;
  /** UI timeline index (integer) — throttled, not every rAF. */
  onFrameIndex?: (frame: number) => void;
}

/**
 * Advances MMD playhead in the same R3F frame as mesh pose (smooth sub-frame motion).
 * Replaces a separate document rAF loop that could run out of phase with WebGL.
 */
export default function PlayheadClock({ playing, maxFrames, onFrameIndex }: PlayheadClockProps) {
  const lastIndexRef = useRef(-1);

  useFrame((_, delta) => {
    if (!playing || maxFrames <= 0) return;

    const capped = Math.min(delta, 0.1);
    playheadRef.current += capped * MMD_FPS;

    if (playheadRef.current >= maxFrames) {
      playheadRef.current = 0;
      lastIndexRef.current = -1;
    }

    if (!onFrameIndex) return;

    const idx = Math.floor(playheadRef.current);
    if (idx !== lastIndexRef.current) {
      lastIndexRef.current = idx;
      onFrameIndex(idx);
    }
  });

  return null;
}
