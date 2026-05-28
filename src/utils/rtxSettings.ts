import type { ViewportFormat } from '../types';

export type RtxAoQuality = 'performance' | 'low' | 'medium' | 'high' | 'ultra';

export interface RtxSettings {
  aoIntensity: number;
  aoRadius: number;
  aoQuality: RtxAoQuality;
  /** Extra bloom when RTX is on (0 = off). */
  rtxBloomStrength: number;
  /** Half-res AO — faster, slightly softer. */
  halfResAo: boolean;
}

export const DEFAULT_RTX_SETTINGS: RtxSettings = {
  aoIntensity: 2.2,
  aoRadius: 0.35,
  aoQuality: 'medium',
  rtxBloomStrength: 0.14,
  halfResAo: true,
};

/** Legacy panel preset — kept for manual FX tuning in 16:9. */
export const PORTRAIT_RTX_SETTINGS: RtxSettings = {
  aoIntensity: 3,
  aoRadius: 0.42,
  aoQuality: 'high',
  rtxBloomStrength: 0.1,
  halfResAo: false,
};

/** Lite RTX for 9:16 preview — half-res AO only if RTX is explicitly enabled. */
export const PORTRAIT_LITE_RTX_SETTINGS: RtxSettings = {
  aoIntensity: 1.4,
  aoRadius: 0.28,
  aoQuality: 'performance',
  rtxBloomStrength: 0,
  halfResAo: true,
};

export function resolveRtxSettings(
  settings: RtxSettings,
  viewportFormat: ViewportFormat
): RtxSettings {
  if (viewportFormat !== '9:16') return settings;
  return {
    ...settings,
    ...PORTRAIT_LITE_RTX_SETTINGS,
    aoIntensity: Math.min(settings.aoIntensity, PORTRAIT_LITE_RTX_SETTINGS.aoIntensity),
    rtxBloomStrength: 0,
    halfResAo: true,
    aoQuality: 'performance',
  };
}
