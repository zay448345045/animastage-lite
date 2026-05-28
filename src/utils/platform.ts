import { Capacitor } from '@capacitor/core';

/** Running inside Capacitor (Android/iOS shell). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** Phone/tablet runtime — native app or mobile browser. */
export function isMobileRuntime(): boolean {
  if (isNativeApp()) return true;
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
}

/** RTX / path tracer — desktop only. */
export function isRtxFeatureAvailable(): boolean {
  return !isMobileRuntime();
}

/** Prefer WebGL on mobile WebView (WebGPU unreliable / heavy). */
export function preferWebGlRenderer(): boolean {
  return isMobileRuntime();
}
