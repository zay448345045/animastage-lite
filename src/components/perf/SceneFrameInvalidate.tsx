import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface SceneFrameInvalidateProps {
  /** When false, skip invalidation (continuous frameloop already redraws). */
  demandMode: boolean;
  currentFrame: number;
  isPlaying: boolean;
  cameraMode: string;
  modelCount: number;
  /** Post-FX / visual toggles — demand canvas must redraw after composer on/off. */
  visualFxRevision?: unknown;
}

/** One redraw per state change when Canvas uses frameloop="demand". */
export default function SceneFrameInvalidate({
  demandMode,
  currentFrame,
  isPlaying,
  cameraMode,
  modelCount,
  visualFxRevision,
}: SceneFrameInvalidateProps) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!demandMode) return;
    invalidate();
  }, [
    demandMode,
    invalidate,
    currentFrame,
    isPlaying,
    cameraMode,
    modelCount,
    visualFxRevision,
  ]);

  return null;
}
