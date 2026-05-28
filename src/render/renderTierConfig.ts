import type { RenderTier, VisualFxSettings } from '../types';
import { applyLookPreset, DEFAULT_VISUAL_FX } from '../visualFx/visualFxPresets';

export interface RenderTierGpuSettings {
  maxDpr: number;
  shadowMapSize: number;
  antialias: boolean;
  logarithmicDepthBuffer: boolean;
  textureAnisotropy: number;
  environmentResolution: number;
  mirrorFloorResolution: number;
  n8aoHalfRes: boolean;
  n8aoQuality: 'medium' | 'high' | 'ultra';
  n8aoSamples: number;
  contactShadowResolution: number;
}

export interface RenderTierPostSettings {
  enableFullRtxStack: boolean;
  autoApplyCinematicLook: boolean;
  /** SMAA in post stack even when RTX toggle is off (PRO only). */
  smaaWhenIdle: boolean;
}

export interface RenderTierConfig {
  id: RenderTier;
  label: string;
  subtitle: string;
  gpu: RenderTierGpuSettings;
  post: RenderTierPostSettings;
}

export const RENDER_TIER_CONFIG: Record<RenderTier, RenderTierConfig> = {
  lite: {
    id: 'lite',
    label: 'Lite',
    subtitle: 'WebGL · fast · stable on any GPU',
    gpu: {
      maxDpr: 1.25,
      shadowMapSize: 1024,
      antialias: true,
      logarithmicDepthBuffer: true,
      textureAnisotropy: 2,
      environmentResolution: 128,
      mirrorFloorResolution: 512,
      n8aoHalfRes: true,
      n8aoQuality: 'medium',
      n8aoSamples: 6,
      contactShadowResolution: 256,
    },
    post: {
      enableFullRtxStack: false,
      autoApplyCinematicLook: false,
      smaaWhenIdle: false,
    },
  },
  pro: {
    id: 'pro',
    label: 'PRO',
    subtitle: 'WebGL HQ · N8AO ultra · IBL · mirror · cinematic FX',
    gpu: {
      maxDpr: 2,
      shadowMapSize: 2048,
      antialias: false,
      logarithmicDepthBuffer: false,
      textureAnisotropy: 16,
      environmentResolution: 512,
      mirrorFloorResolution: 2048,
      n8aoHalfRes: false,
      n8aoQuality: 'ultra',
      n8aoSamples: 14,
      contactShadowResolution: 1024,
    },
    post: {
      enableFullRtxStack: true,
      autoApplyCinematicLook: true,
      smaaWhenIdle: true,
    },
  },
};

export function getRenderTierConfig(tier: RenderTier): RenderTierConfig {
  return RENDER_TIER_CONFIG[tier] ?? RENDER_TIER_CONFIG.lite;
}

export function getTierDpr(tier: RenderTier, heavyGpu: boolean): number {
  const cfg = getRenderTierConfig(tier);
  const cap = heavyGpu ? Math.min(cfg.gpu.maxDpr, 1.75) : cfg.gpu.maxDpr;
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, cap);
}

/** Visual FX applied when user switches to PRO (keeps timeline logic unchanged). */
export function visualFxForRenderTier(tier: RenderTier): VisualFxSettings {
  if (tier === 'pro') {
    return applyLookPreset('cinematic');
  }
  return { ...DEFAULT_VISUAL_FX };
}

export function isDefaultVisualFx(fx: VisualFxSettings): boolean {
  const d = DEFAULT_VISUAL_FX;
  return (
    fx.bloomEnabled === d.bloomEnabled &&
    fx.scenePreset === d.scenePreset &&
    fx.colorGrade === d.colorGrade &&
    fx.lightPreset === d.lightPreset &&
    !fx.particlesEnabled &&
    !fx.dofEnabled
  );
}
