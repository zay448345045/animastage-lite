import { getEffectiveDegradeLevel } from '../effectiveDegradeLevel';

/** Read-only render hints for Viewport — does not change animation. */
export function getPerfRenderAdaptation(): {
  enableShadows: boolean;
  dprMultiplier: number;
} {
  const level = getEffectiveDegradeLevel();
  if (level >= 2) {
    return { enableShadows: false, dprMultiplier: 0.85 };
  }
  if (level >= 1) {
    return { enableShadows: true, dprMultiplier: 0.92 };
  }
  return { enableShadows: true, dprMultiplier: 1 };
}
