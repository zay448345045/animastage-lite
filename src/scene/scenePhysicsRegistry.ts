/**
 * Multi-character physics substep cap — ported from AnimaStage Pro (mmd-character-motion.js).
 * Prevents substep death-spiral when 2+ cloth/hair PMX models simulate together.
 */
import type { MMDPhysics } from 'three-stdlib';
import { getEffectivePhysicsMaxSteps } from '../perf/physicsQualityControl';

const activePhysics = new Set<MMDPhysics>();

export function registerScenePhysics(physics: MMDPhysics): () => void {
  activePhysics.add(physics);
  applyMultiCharacterPhysicsSubstepCap();
  return () => {
    activePhysics.delete(physics);
    applyMultiCharacterPhysicsSubstepCap();
  };
}

export function getActivePhysicsCount(): number {
  return activePhysics.size;
}

export function refreshScenePhysicsSubstepCaps(): void {
  applyMultiCharacterPhysicsSubstepCap();
}

export function applyMultiCharacterPhysicsSubstepCap(): void {
  const meshes = [...activePhysics];
  const want = getEffectivePhysicsMaxSteps();

  if (meshes.length >= 2) {
    for (const ph of meshes) {
      if (ph.maxStepNum > 2) ph.maxStepNum = 2;
    }
    return;
  }

  if (meshes.length === 1 && meshes[0]!.maxStepNum !== want) {
    meshes[0]!.maxStepNum = want;
  }
}
