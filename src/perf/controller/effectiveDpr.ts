import type { CharacterQuality, ViewportFormat } from '../types';
import {
  getCharacterQualityDpr,
  getCharacterQualityGpu,
} from '../../utils/characterQuality';
import { getEffectiveDegradeLevel } from '../effectiveDegradeLevel';
import { isModelLoadActive } from '../modelLoadProfile';
import { getPlaybackDprFloor } from '../playbackPerfMode';
import { getPerfGovernorScale, MIN_GOVERNOR_RENDER_SCALE } from './perfGovernor';

/** Hard floor — never go below ~70% effective DPR (readable on 1080p+). */
const MIN_EFFECTIVE_DPR = 0.68;

export function getEffectiveDprMultiplier(): number {
  if (isModelLoadActive()) return 0.72;

  const level = getEffectiveDegradeLevel();
  let degradeMul = 1;
  if (level >= 4) degradeMul = 0.72;
  else if (level >= 3) degradeMul = 0.78;
  else if (level >= 2) degradeMul = 0.84;
  else if (level >= 1) degradeMul = 0.92;

  let mul = Math.min(getPerfGovernorScale(), degradeMul);
  mul = Math.max(mul, MIN_GOVERNOR_RENDER_SCALE);
  const playbackFloor = getPlaybackDprFloor();
  if (playbackFloor > 0) {
    mul = Math.max(mul, playbackFloor);
  }
  return mul;
}

export function resolveEffectiveCanvasDpr(
  quality: CharacterQuality,
  viewportFormat: ViewportFormat
): number | [number, number] {
  const base = getCharacterQualityDpr(quality, viewportFormat);
  const mul = getEffectiveDprMultiplier();

  if (mul >= 0.999) return base;

  if (Array.isArray(base)) {
    return [base[0], Math.min(2, base[1] * mul)];
  }
  return Math.max(MIN_EFFECTIVE_DPR, Math.min(2, base * mul));
}

export function resolveEffectiveShadowMapSize(
  quality: CharacterQuality,
  viewportFormat: ViewportFormat
): number {
  const base = getCharacterQualityGpu(quality, viewportFormat).shadowMapSize;
  const level = getEffectiveDegradeLevel();
  if (level >= 2) return Math.max(512, Math.floor(base * 0.5));
  if (level >= 1) return Math.max(768, Math.floor(base * 0.65));
  return base;
}
