import { initAmmo } from '../utils/ammoLoader';
import { isAmmoPhysicsBroken } from '../utils/mmdCharacterPhysics';

/** Bootstrap Ammo (legacy). Main-thread Jolt loads on demand if the worker fails. */
export async function initMmdPhysicsRuntime(): Promise<boolean> {
  try {
    await initAmmo().catch((err) => {
      console.warn('[MMD] Ammo preload optional failed:', err);
    });
    return isMmdPhysicsRuntimeReady();
  } catch (err) {
    console.warn('[MMD] Physics runtime init failed:', err);
    return false;
  }
}

export function isMmdPhysicsRuntimeReady(): boolean {
  return !isAmmoPhysicsBroken();
}
