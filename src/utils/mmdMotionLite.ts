/**
 * Lite port of mmd-character-motion.js helpers (animation install, opacity, twist freeze).
 * Heavy paths (bone explorer, capture, full physics dispose) stay in MMDModelWrapper.
 */
import * as THREE from 'three';
import type { MMDAnimationHelper, MMDPhysics } from 'three-stdlib';
import type { MmdLiteConfig } from '../types';
import {
  getAnimHelperObjects,
  getPhysicsAddParams,
  applyIkFixOnly,
  applyPhysicsLiveSettings,
  configureArmPhysicsForAnimation,
  mmdPhysicsSettings,
} from './mmdCharacterPhysics';

export type { MmdPhysicsSettings } from './mmdCharacterPhysics';

/** Sync React app state into the module-level physics tuning used by helper.add(). */
export function syncMmdLitePhysicsConfig(cfg: MmdLiteConfig): void {
  mmdPhysicsSettings.stablePhys = cfg.stablePhys;
  mmdPhysicsSettings.physicsGravity = cfg.physicsGravity;
  mmdPhysicsSettings.physicsSwing = cfg.physicsSwing;
  mmdPhysicsSettings.physicsWind = cfg.physicsWind;
}

export function clearAnimMixerState(
  helper: MMDAnimationHelper,
  mesh: THREE.SkinnedMesh
): void {
  const objects = getAnimHelperObjects(helper, mesh) as
    | {
        backupBones?: unknown;
        sortedBonesData?: unknown;
        looped?: boolean;
        activeClip?: THREE.AnimationClip | null;
      }
    | undefined;
  if (!objects) return;
  delete objects.backupBones;
  delete objects.sortedBonesData;
  objects.looped = false;
  objects.activeClip = null;
}

export function resetMeshBindPose(mesh: THREE.SkinnedMesh): void {
  if (!mesh?.skeleton) return;
  const posed = mesh as THREE.SkinnedMesh & { pose?: () => void };
  if (typeof posed.pose === 'function') posed.pose();
  mesh.updateMatrixWorld(true);
  mesh.skeleton.update();
}

export function stopMeshMixer(helper: MMDAnimationHelper, mesh: THREE.SkinnedMesh): void {
  const objects = getAnimHelperObjects(helper, mesh) as
    | { mixer?: THREE.AnimationMixer; activeClip?: THREE.AnimationClip | null }
    | undefined;
  if (!objects?.mixer) return;
  const mixer = objects.mixer;
  try {
    mixer.stopAllAction();
    if (objects.activeClip) mixer.uncacheClip(objects.activeClip);
    mixer.uncacheRoot(mesh);
  } catch {
    /* mixer may already be torn down */
  }
  objects.mixer = undefined;
  objects.activeClip = null;
}

/** Swap clip on an already-registered mesh without rebuilding Bullet bodies. */
export function replaceMeshAnimation(
  helper: MMDAnimationHelper,
  mesh: THREE.SkinnedMesh,
  clip: THREE.AnimationClip
): boolean {
  const objects = getAnimHelperObjects(helper, mesh) as
    | { mixer?: THREE.AnimationMixer; activeClip?: THREE.AnimationClip | null }
    | undefined;
  if (!objects || helper.meshes.indexOf(mesh) < 0) return false;

  stopMeshMixer(helper, mesh);
  resetMeshBindPose(mesh);

  objects.mixer = new THREE.AnimationMixer(mesh);
  const action = objects.mixer.clipAction(clip);
  action.reset();
  action.play();
  objects.activeClip = clip;
  clearAnimMixerState(helper, mesh);
  return true;
}

export function installMeshAnimation(
  helper: MMDAnimationHelper,
  mesh: THREE.SkinnedMesh,
  clip: THREE.AnimationClip,
  physicsEnabled: boolean
): void {
  if (replaceMeshAnimation(helper, mesh, clip)) {
    helper.enable('animation', true);
    return;
  }

  try {
    helper.remove(mesh);
  } catch {
    /* not registered */
  }

  resetMeshBindPose(mesh);
  helper.add(
    mesh,
    getPhysicsAddParams(physicsEnabled, mmdPhysicsSettings, {
      animation: clip,
      animationWarmup: false,
    }) as Parameters<MMDAnimationHelper['add']>[1]
  );
  applyIkFixOnly(mesh, helper);
  const meshState = getAnimHelperObjects(helper, mesh);
  if (meshState?.physics) {
    applyPhysicsLiveSettings(meshState.physics as MMDPhysics);
    configureArmPhysicsForAnimation(mesh, helper);
  }
  helper.enable('animation', true);
  helper.enable('ik', true);
  helper.enable('grant', true);
  helper.enable('physics', physicsEnabled);
}

export function applyModelOpacity(root: THREE.Object3D, alpha: number): void {
  const a = Math.max(0.05, Math.min(1, alpha));
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const mesh = o as THREE.Mesh;
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      const ud = m.userData as Record<string, unknown>;
      const orig = (ud._origOpacity as number | undefined) ?? 1;
      const out = orig * a;
      (m as THREE.Material & { opacity?: number }).opacity = out;
      (m as THREE.Material & { transparent?: boolean }).transparent =
        out < 0.995 || Boolean(ud._origTransparent);
      (m as THREE.Material & { depthWrite?: boolean }).depthWrite =
        out > 0.12 && (ud._origDepthWrite as boolean | undefined) !== false;
    });
  });
}

/** PMX twist bones (捩) — optional stabilize pass from mmd-character-motion. */
export function freezeTwistBones(mesh: THREE.SkinnedMesh): void {
  if (!mesh?.skeleton) return;
  for (const bone of mesh.skeleton.bones) {
    const name = bone.name;
    if (name.includes('捩') || name.toLowerCase().includes('twist')) {
      bone.quaternion.set(0, 0, 0, 1);
    }
  }
  mesh.updateMatrixWorld(true);
}
