/**
 * Lite one-click looks inspired by mmd_rtx.html STYLE_PRESETS.
 * Maps heavy RTX stack (SSAO, volumetrics, TAA) → existing VisualFxSettings + lower GPU cost.
 */
import type { VisualFxSettings } from '../types';
import { DEFAULT_VISUAL_FX } from './visualFxPresets';

export type MmdRtxLiteStyleId = 'realistic' | 'anime' | 'dramatic' | 'neon' | 'dawn';

export interface MmdRtxLiteStylePreset {
  id: MmdRtxLiteStyleId;
  label: string;
  description: string;
  patch: Partial<VisualFxSettings>;
}

/** Bloom/DOF capped for WebGL Lite — no volumetric pass. */
export const MMD_RTX_LITE_STYLES: MmdRtxLiteStylePreset[] = [
  {
    id: 'realistic',
    label: 'Realistic',
    description: 'Soft bloom · neutral grade · studio light',
    patch: {
      bloomEnabled: true,
      bloomIntensity: 0.28,
      bloomThreshold: 0.82,
      vignetteEnabled: true,
      vignetteIntensity: 0.2,
      dofEnabled: false,
      chromaticAberration: 0,
      colorGrade: 'neutral',
      scenePreset: 'studio',
      lightPreset: 'natural',
      particlesEnabled: false,
      environmentIntensity: 0.85,
      floorReflection: 0.72,
      aoIntensity: 3.2,
      toneExposure: 1.0,
    },
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Blue rim · warm fill · sparkles (mmd_rtx anime)',
    patch: {
      bloomEnabled: true,
      bloomIntensity: 0.45,
      bloomThreshold: 0.52,
      vignetteEnabled: true,
      vignetteIntensity: 0.38,
      dofEnabled: false,
      chromaticAberration: 0,
      colorGrade: 'anime',
      scenePreset: 'studio',
      lightPreset: 'anime',
      particlesEnabled: true,
      particlePreset: 'sparkles',
      particleIntensity: 0.45,
      environmentIntensity: 0.78,
      floorReflection: 0.68,
      toneExposure: 1.05,
    },
  },
  {
    id: 'dramatic',
    label: 'Dramatic',
    description: 'Strong vignette · warehouse · rim light',
    patch: {
      bloomEnabled: true,
      bloomIntensity: 0.38,
      bloomThreshold: 0.48,
      vignetteEnabled: true,
      vignetteIntensity: 0.58,
      dofEnabled: true,
      dofFocusDistance: 0.016,
      dofBokehScale: 2.4,
      chromaticAberration: 0.0008,
      colorGrade: 'cinematic',
      scenePreset: 'warehouse',
      lightPreset: 'rim',
      particlesEnabled: false,
      environmentIntensity: 0.55,
      floorReflection: 0.8,
      aoIntensity: 4.0,
      toneExposure: 0.95,
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    description: 'Club lights · vaporwave · confetti',
    patch: {
      bloomEnabled: true,
      bloomIntensity: 0.52,
      bloomThreshold: 0.42,
      vignetteEnabled: true,
      vignetteIntensity: 0.48,
      dofEnabled: false,
      chromaticAberration: 0.0015,
      colorGrade: 'vaporwave',
      scenePreset: 'nightclub',
      lightPreset: 'neon',
      particlesEnabled: true,
      particlePreset: 'confetti',
      particleIntensity: 0.55,
      environmentIntensity: 0.58,
      floorReflection: 0.88,
      toneExposure: 1.08,
    },
  },
  {
    id: 'dawn',
    label: 'Soft dawn',
    description: 'Warm sunset · petals · gentle bloom',
    patch: {
      bloomEnabled: true,
      bloomIntensity: 0.32,
      bloomThreshold: 0.58,
      vignetteEnabled: true,
      vignetteIntensity: 0.26,
      dofEnabled: true,
      dofFocusDistance: 0.014,
      dofBokehScale: 2.2,
      chromaticAberration: 0.0005,
      colorGrade: 'warm',
      scenePreset: 'sunset',
      lightPreset: 'rim',
      particlesEnabled: true,
      particlePreset: 'petals',
      particleIntensity: 0.35,
      environmentIntensity: 0.8,
      floorReflection: 0.74,
      toneExposure: 1.02,
    },
  },
];

export function applyMmdRtxLiteStyle(id: MmdRtxLiteStyleId): VisualFxSettings {
  const preset = MMD_RTX_LITE_STYLES.find((s) => s.id === id);
  if (!preset) return { ...DEFAULT_VISUAL_FX };
  return { ...DEFAULT_VISUAL_FX, ...preset.patch };
}
