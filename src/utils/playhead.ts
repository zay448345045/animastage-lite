/** MMD / VMD standard timeline rate (do not confuse with display refresh rate). */
export const MMD_FPS = 30;

/** Shared playhead position in MMD frames (float during playback). Updated via rAF — no React re-render. */
export const playheadRef = { current: 0 };

export function getPlayheadFrame(): number {
  return playheadRef.current;
}

export function setPlayheadFrame(frame: number): void {
  playheadRef.current = frame;
}

export function frameToPlayheadTime(frame: number): number {
  return Math.max(0, frame / MMD_FPS);
}
