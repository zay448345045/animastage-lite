import type { MmdLiteConfig } from '../types';
import { mmdPhysicsSettings } from './mmdCharacterPhysics';

export type MmdPhysicsQualityPreset = 'default' | 'smooth' | 'cinematic' | 'safe';

const RATE = { min: 50, max: 80 };
const SUB = { min: 2, max: 20 };

function clampRate(r: number): number {
  return Math.min(RATE.max, Math.max(RATE.min, Math.round(r)));
}

function clampSub(s: number): number {
  return Math.min(SUB.max, Math.max(SUB.min, Math.round(s)));
}

/** mmd_rtx.html PHYS_PRESETS + applySafePhysDefaults */
export function applyMmdPhysicsQualityPreset(
  preset: MmdPhysicsQualityPreset
): Partial<MmdLiteConfig> {
  switch (preset) {
    case 'safe':
      return {
        stablePhys: true,
        physicsGravity: 1.0,
        physicsSwing: 0,
        physicsWind: 0,
      };
    case 'smooth':
      return {
        stablePhys: false,
        physicsGravity: 1.0,
        physicsSwing: 0.08,
        physicsWind: mmdPhysicsSettings.physicsWind,
      };
    case 'cinematic':
      return {
        stablePhys: false,
        physicsGravity: 1.0,
        physicsSwing: 0.18,
        physicsWind: mmdPhysicsSettings.physicsWind,
      };
    case 'default':
    default:
      return {
        stablePhys: true,
        physicsGravity: 1.0,
        physicsSwing: 0,
        physicsWind: mmdPhysicsSettings.physicsWind,
      };
  }
}

export function applyMmdPhysicsRatePreset(preset: 'default' | 'smooth' | 'cinematic'): void {
  const map = {
    default: { rate: 65, sub: 4 },
    smooth: { rate: 65, sub: 6 },
    cinematic: { rate: 80, sub: 6 },
  } as const;
  const p = map[preset];
  mmdPhysicsSettings.physicsRate = clampRate(p.rate);
  mmdPhysicsSettings.physicsSubsteps = clampSub(p.sub);
}
