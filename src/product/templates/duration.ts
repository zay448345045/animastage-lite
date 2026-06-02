import { MMD_FPS } from '../../utils/playhead';

/** Default scene / template roll length (product layer). */
export const DEFAULT_TEMPLATE_DURATION_SEC = 50;

/** Generate Short / vertical export target length. */
export const SHORTS_DURATION_SEC = 50;

export const MIN_TEMPLATE_DURATION_SEC = 20;
export const MAX_TEMPLATE_DURATION_SEC = 90;

export function durationSecToFrames(sec: number, fps = MMD_FPS): number {
  return Math.max(10, Math.round(sec * fps));
}
