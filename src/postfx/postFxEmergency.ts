import type { VisualFxSettings } from '../types';

/** Legacy flag — emergency downgrades removed; discrete GPU keeps user settings on recovery. */
let emergencyLowActive = false;

const listeners = new Set<() => void>();

export function isPostFxEmergencyLow(): boolean {
  return emergencyLowActive;
}

export function subscribePostFxEmergency(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((l) => l());
}

/** No-op — context loss recovery no longer strips Post-FX on discrete GPU. */
export function activatePostFxEmergencyLow(): void {
  /* preserved for API compatibility */
}

export function resetPostFxEmergencyLow(): void {
  if (!emergencyLowActive) return;
  emergencyLowActive = false;
  notify();
}

export function getPostFxEmergencyVisualPatch(
  _visualFx: VisualFxSettings
): Partial<VisualFxSettings> {
  return {};
}
