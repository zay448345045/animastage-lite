import type { RenderTier } from '../types';

export interface PathTracerTierConfig {
  maxTriangles: number;
  maxTextures: number;
  textureSize: number;
  resolutionScale: number;
  maxInternalWidth: number;
  maxInternalHeight: number;
  maxBounces: number;
  videoSamplesPerFrame: number;
  enableBloom: boolean;
  enableDenoise: boolean;
  denoiseMaxRadius: number;
  /** Live RTX overlay while paused (very expensive — off on Lite). */
  previewEnabled: boolean;
  sceneUploadIntervalFrames: number;
  previewIntervalMs: number;
  previewMaxSamples: number;
  skipAlphaMaterials: boolean;
  sunIntensityScale: number;
  exposure: number;
  /** Direct sun sampling in shader (off = faster, softer). */
  enableNEE: boolean;
}

/** Minimal GPU footprint — RTX 2050 / 4 GB safe mode. */
export const PATH_TRACER_TIER_CONFIG: Record<RenderTier, PathTracerTierConfig> = {
  lite: {
    maxTriangles: 1_800,
    maxTextures: 6,
    textureSize: 64,
    resolutionScale: 0.2,
    maxInternalWidth: 400,
    maxInternalHeight: 225,
    maxBounces: 1,
    videoSamplesPerFrame: 1,
    enableBloom: false,
    enableDenoise: false,
    denoiseMaxRadius: 0,
    previewEnabled: false,
    sceneUploadIntervalFrames: 48,
    previewIntervalMs: 1200,
    previewMaxSamples: 4,
    skipAlphaMaterials: true,
    sunIntensityScale: 0.22,
    exposure: 0.75,
    enableNEE: false,
  },
  pro: {
    maxTriangles: 4_000,
    maxTextures: 12,
    textureSize: 128,
    resolutionScale: 0.25,
    maxInternalWidth: 480,
    maxInternalHeight: 270,
    maxBounces: 1,
    videoSamplesPerFrame: 1,
    enableBloom: false,
    enableDenoise: false,
    denoiseMaxRadius: 0,
    previewEnabled: false,
    sceneUploadIntervalFrames: 20,
    previewIntervalMs: 900,
    previewMaxSamples: 5,
    skipAlphaMaterials: true,
    sunIntensityScale: 0.28,
    exposure: 0.78,
    enableNEE: false,
  },
};

export function getPathTracerTierConfig(tier: RenderTier): PathTracerTierConfig {
  return PATH_TRACER_TIER_CONFIG[tier] ?? PATH_TRACER_TIER_CONFIG.lite;
}
