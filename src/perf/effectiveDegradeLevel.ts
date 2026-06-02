import { getDegradeLevel } from './adaptiveQuality';
import { getGpuDegradeLevel } from './gpuAdaptive';

/** Combined CPU frame-budget + GPU adaptive degrade (0–4). */
export function getEffectiveDegradeLevel(): number {
  return Math.max(getDegradeLevel(), getGpuDegradeLevel());
}
