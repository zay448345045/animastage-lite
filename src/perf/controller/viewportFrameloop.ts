import type { PhysicsMode } from '../../types';
import { isModelLoadActive } from '../modelLoadProfile';

/** When R3F should run `frameloop="always"` vs idle `demand` (saves GPU when scene is static). */
export function resolveNeedsContinuousRender(params: {
  isPlaying: boolean;
  isRecordingVideo: boolean;
  physicsMode: PhysicsMode;
  visibleModelCount: number;
}): boolean {
  const { isPlaying, isRecordingVideo, physicsMode, visibleModelCount } = params;

  if (isPlaying || isRecordingVideo || isModelLoadActive()) return true;
  if (visibleModelCount === 0) return false;

  // Hair/cloth sim only needs a render loop while physics is actively stepping.
  if (physicsMode === 'anytime') return true;

  return false;
}
