import type { AppState } from '../types';
import { DEFAULT_VISUAL_FX } from '../templates/animationTemplates';
import { qualityModeToPatch } from '../product/scene/qualityMode';
import { isNativeApp } from '../utils/platform';

function normalizeBootPath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (base && pathname.startsWith(base)) {
    return pathname.slice(base.length) || '/';
  }
  return pathname || '/';
}

/** Capacitor shell opens Studio (`/app`) instead of the marketing landing page. */
export function bootstrapNativeRoute(): void {
  if (!isNativeApp()) return;

  const rel = normalizeBootPath(window.location.pathname);
  if (rel !== '/' && rel !== '') return;

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const target = `${base}/app`.replace(/\/{2,}/g, '/');
  window.history.replaceState({}, '', target);
}

/** Performance-first defaults for WebView — keeps VMD/physics core unchanged. */
export function nativeStudioStatePatch(): Partial<AppState> {
  const patch = qualityModeToPatch('balanced');
  return {
    characterQuality: patch.characterQuality,
    physicsMode: patch.physicsMode,
    rtxModeEnabled: patch.rtxModeEnabled,
    renderTier: 'lite',
    visualFx: { ...DEFAULT_VISUAL_FX, ...patch.visualFxPatch },
  };
}

export function isNativeStudioBoot(): boolean {
  return isNativeApp();
}
