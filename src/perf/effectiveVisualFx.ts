import type { AppState, ViewportFormat, VisualFxSettings } from '../types';
import { isPortraitFormat } from '../utils/characterQuality';
import { getEffectiveDegradeLevel } from './effectiveDegradeLevel';
import { isTemplateMotionActive } from './scenePerfPolicy';
import {
  getPerfGovernorFxGate,
  isPerfGovernorAutoEnabled,
} from './controller/perfGovernor';

/** Non-destructive post-FX view for render — user settings in appState stay intact. */
export function getEffectiveVisualFx(
  visualFx: VisualFxSettings,
  appState: AppState,
  viewportFormat: ViewportFormat = '16:9'
): VisualFxSettings {
  let base = visualFx;

  if (isPortraitFormat(viewportFormat)) {
    base = {
      ...base,
      bloomEnabled: false,
      dofEnabled: false,
      godRaysEnabled: false,
      ssaoEnabled: false,
    };
  }

  // Template playback in 9:16 only — 16:9 keeps full FX unless perf governor degrades.
  if (
    isPortraitFormat(viewportFormat) &&
    isTemplateMotionActive(appState) &&
    appState.isPlaying
  ) {
    base = {
      ...base,
      bloomEnabled: false,
      dofEnabled: false,
      godRaysEnabled: false,
      weatherPreset: 'clear',
    };
  }

  if (isPerfGovernorAutoEnabled()) {
    const gate = getPerfGovernorFxGate();
    base = {
      ...base,
      godRaysEnabled: gate.allowGodRays ? base.godRaysEnabled : false,
      ssaoEnabled: gate.allowSsao ? base.ssaoEnabled : false,
    };
  }

  const level = getEffectiveDegradeLevel();
  if (level <= 0) return base;

  const patch: Partial<VisualFxSettings> = {};

  if (level >= 1) {
    patch.bloomEnabled = false;
    patch.dofEnabled = false;
    if (appState.rtxModeEnabled) {
      // RTX is separate flag; only soften weather at level 1
    }
    if (visualFx.weatherPreset && visualFx.weatherPreset !== 'clear') {
      patch.weatherPreset = 'clear';
    }
  }

  if (level >= 2) {
    patch.materialDetailing = false;
    patch.materialSmoothing = Math.min(visualFx.materialSmoothing ?? 0.55, 0.35);
    patch.ssaoEnabled = false;
    patch.godRaysEnabled = false;
  }

  if (level >= 3) {
    patch.smaaEnabled = true;
    patch.bloomEnabled = false;
    patch.weatherPreset = 'clear';
  }

  return { ...base, ...patch };
}

export function isPostFxReduced(
  visualFx: VisualFxSettings,
  appState: AppState,
  viewportFormat: ViewportFormat = '16:9'
): boolean {
  const eff = getEffectiveVisualFx(visualFx, appState, viewportFormat);
  return (
    eff.bloomEnabled !== visualFx.bloomEnabled ||
    eff.dofEnabled !== visualFx.dofEnabled ||
    eff.weatherPreset !== visualFx.weatherPreset
  );
}
