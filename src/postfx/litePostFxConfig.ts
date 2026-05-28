import type { ViewportFormat, VisualFxSettings } from '../types';
import type { RtxSettings } from '../utils/rtxSettings';
import { isPortraitFormat } from '../utils/characterQuality';

export interface LitePostFxTuning {
  enableComposer: boolean;
  ssao: boolean;
  smaa: boolean;
  godRays: boolean;
  bloom: boolean;
  dof: boolean;
  vignette: boolean;
  chromatic: boolean;
  ssaoIntensity: number;
  ssaoRadius: number;
  ssaoResolutionScale: number;
  godRaysSamples: number;
  godRaysDensity: number;
  godRaysDecay: number;
  bloomIntensityMul: number;
  multisampling: number;
}

export function getLitePostFxTuning(
  visualFx: VisualFxSettings,
  viewportFormat: ViewportFormat,
  rtxModeEnabled: boolean,
  pauseRtx: boolean
): LitePostFxTuning {
  const portrait = isPortraitFormat(viewportFormat);
  const rtxLive = rtxModeEnabled && !pauseRtx;
  const master = visualFx.postFxStackEnabled !== false;
  const cinematic =
    master &&
    (visualFx.ssaoEnabled ||
      visualFx.smaaEnabled ||
      visualFx.godRaysEnabled ||
      visualFx.bloomEnabled ||
      visualFx.dofEnabled ||
      visualFx.vignetteEnabled ||
      rtxLive);

  if (portrait) {
    return {
      enableComposer: master && (visualFx.smaaEnabled || visualFx.vignetteEnabled),
      ssao: false,
      smaa: visualFx.smaaEnabled !== false,
      godRays: false,
      bloom: false,
      dof: false,
      vignette: visualFx.vignetteEnabled === true,
      chromatic: false,
      ssaoIntensity: 0,
      ssaoRadius: 0.28,
      ssaoResolutionScale: 0.5,
      godRaysSamples: 0,
      godRaysDensity: 0,
      godRaysDecay: 0,
      bloomIntensityMul: 0.5,
      multisampling: 0,
    };
  }

  return {
    enableComposer: cinematic,
    ssao: visualFx.ssaoEnabled !== false && master,
    smaa: visualFx.smaaEnabled !== false,
    godRays: visualFx.godRaysEnabled !== false && master,
    bloom: visualFx.bloomEnabled || rtxLive,
    dof: visualFx.dofEnabled === true,
    vignette: visualFx.vignetteEnabled !== false,
    chromatic: (visualFx.chromaticAberration ?? 0) > 0.0001,
    ssaoIntensity: visualFx.ssaoIntensity ?? (rtxLive ? 1.8 : 1.1),
    ssaoRadius: visualFx.ssaoRadius ?? 0.32,
    ssaoResolutionScale: visualFx.ssaoHalfRes !== false ? 0.5 : 1,
    godRaysSamples: visualFx.godRaysSamples ?? 24,
    godRaysDensity: visualFx.godRaysDensity ?? 0.65,
    godRaysDecay: visualFx.godRaysDecay ?? 0.94,
    bloomIntensityMul: rtxLive ? 0.42 : 1,
    multisampling: 0,
  };
}

export function resolveBloomParams(
  visualFx: VisualFxSettings,
  tuning: LitePostFxTuning,
  rtxSettings?: RtxSettings,
  rtxLive?: boolean
): { intensity: number; threshold: number; radius: number } {
  const rtxBloom = rtxSettings?.rtxBloomStrength ?? 0.14;
  const intensity =
    (rtxLive
      ? Math.min(rtxBloom, visualFx.bloomIntensity * tuning.bloomIntensityMul)
      : visualFx.bloomIntensity) * tuning.bloomIntensityMul;
  const threshold = Math.max(rtxLive ? 0.88 : 0.72, visualFx.bloomThreshold);
  return {
    intensity,
    threshold,
    radius: visualFx.bloomRadius ?? 0.35,
  };
}
