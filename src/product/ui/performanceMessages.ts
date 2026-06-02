/** UI-only performance hint — reads HUD stats, never touches governor. */
export function getPerformanceMessage(
  autoScale: string,
  fps: string,
  frameMs?: string
): string | null {
  const scale = parseInt(autoScale, 10);
  const fpsNum = parseInt(fps, 10);
  const frameNum = frameMs != null ? parseFloat(frameMs) : NaN;

  if (!Number.isNaN(frameNum) && frameNum > 25) {
    return 'Reducing quality to maintain smooth playback';
  }
  if (!Number.isNaN(fpsNum) && fpsNum < 24) return 'Reducing quality to maintain FPS';
  if (!Number.isNaN(scale) && scale < 95) return 'Optimizing for your device';
  return null;
}
