import { MOBILE_SAFE } from '../config/mobileSafeMode';
import { setRuntimeMaxTextureSize } from '../render/heavyMesh/memoryProfile';
import { setMobilePhysicsCap } from './physicsQualityControl';

let mobileCapsActive = false;

export function isMobileRuntimeCapsActive(): boolean {
  return mobileCapsActive;
}

export function enableMobileRuntimeCaps(): void {
  if (mobileCapsActive) return;
  mobileCapsActive = true;
  setRuntimeMaxTextureSize(MOBILE_SAFE.textureMax);
  setMobilePhysicsCap(MOBILE_SAFE.physicsMaxSteps);
}

export function disableMobileRuntimeCaps(): void {
  if (!mobileCapsActive) return;
  mobileCapsActive = false;
  setRuntimeMaxTextureSize(1024);
  setMobilePhysicsCap(null);
}

/** Extra DPR scale when SAFE mode is on (0.5–0.75 of resolved DPR). */
export function getMobileSafeDprScale(): number {
  if (!mobileCapsActive) return 1;
  if (typeof window === 'undefined') return MOBILE_SAFE.dprMax;
  const dpr = window.devicePixelRatio || 1;
  if (dpr >= 2) return MOBILE_SAFE.dprMin;
  if (dpr >= 1.5) return 0.65;
  return MOBILE_SAFE.dprMax;
}
