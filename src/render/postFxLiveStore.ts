import type { VisualFxSettings } from '../types';

/** Live GPU params — updated without React re-renders; read in useFrame. */
export interface PostFxLiveParams {
  toneExposure: number;
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomRadius: number;
  dofEnabled: boolean;
  dofFocusDistance: number;
  dofFocalLength: number;
  dofBokehScale: number;
  vignetteEnabled: boolean;
  vignetteIntensity: number;
  chromaticAberration: number;
}

export const postFxLive: PostFxLiveParams = {
  toneExposure: 0.95,
  bloomEnabled: false,
  bloomIntensity: 0.28,
  bloomThreshold: 0.78,
  bloomRadius: 0.35,
  dofEnabled: false,
  dofFocusDistance: 0.03,
  dofFocalLength: 0.008,
  dofBokehScale: 1.1,
  vignetteEnabled: false,
  vignetteIntensity: 0.4,
  chromaticAberration: 0,
};

const LIVE_KEYS: (keyof PostFxLiveParams)[] = [
  'toneExposure',
  'bloomEnabled',
  'bloomIntensity',
  'bloomThreshold',
  'bloomRadius',
  'dofEnabled',
  'dofFocusDistance',
  'dofFocalLength',
  'dofBokehScale',
  'vignetteEnabled',
  'vignetteIntensity',
  'chromaticAberration',
];

export function patchPostFxLive(patch: Partial<PostFxLiveParams>): void {
  for (const key of LIVE_KEYS) {
    if (patch[key] !== undefined) {
      (postFxLive as Record<string, unknown>)[key] = patch[key];
    }
  }
}

export function patchPostFxLiveFromVisualFxPatch(patch: Partial<VisualFxSettings>): void {
  const live: Partial<PostFxLiveParams> = {};
  if (patch.toneExposure !== undefined) live.toneExposure = patch.toneExposure;
  if (patch.bloomEnabled !== undefined) live.bloomEnabled = patch.bloomEnabled;
  if (patch.bloomIntensity !== undefined) live.bloomIntensity = patch.bloomIntensity;
  if (patch.bloomThreshold !== undefined) live.bloomThreshold = patch.bloomThreshold;
  if (patch.bloomRadius !== undefined) live.bloomRadius = patch.bloomRadius;
  if (patch.dofEnabled !== undefined) live.dofEnabled = patch.dofEnabled;
  if (patch.dofFocusDistance !== undefined) live.dofFocusDistance = patch.dofFocusDistance;
  if (patch.dofFocalLength !== undefined) live.dofFocalLength = patch.dofFocalLength;
  if (patch.dofBokehScale !== undefined) live.dofBokehScale = patch.dofBokehScale;
  if (patch.vignetteEnabled !== undefined) live.vignetteEnabled = patch.vignetteEnabled;
  if (patch.vignetteIntensity !== undefined) live.vignetteIntensity = patch.vignetteIntensity;
  if (patch.chromaticAberration !== undefined) live.chromaticAberration = patch.chromaticAberration;
  if (Object.keys(live).length > 0) patchPostFxLive(live);
}

export function syncPostFxLiveFromSettings(visualFx: VisualFxSettings): void {
  patchPostFxLive({
    toneExposure: visualFx.toneExposure ?? 0.95,
    bloomEnabled: visualFx.bloomEnabled === true,
    bloomIntensity: visualFx.bloomIntensity ?? 0.28,
    bloomThreshold: visualFx.bloomThreshold ?? 0.78,
    bloomRadius: visualFx.bloomRadius ?? 0.35,
    dofEnabled: visualFx.dofEnabled === true,
    dofFocusDistance: visualFx.dofFocusDistance ?? 0.03,
    dofFocalLength: visualFx.dofFocalLength ?? 0.008,
    dofBokehScale: visualFx.dofBokehScale ?? 1.1,
    vignetteEnabled: visualFx.vignetteEnabled === true,
    vignetteIntensity: visualFx.vignetteIntensity ?? 0.4,
    chromaticAberration: visualFx.chromaticAberration ?? 0,
  });
}

