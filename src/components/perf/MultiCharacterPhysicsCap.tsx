import { useFrame } from '@react-three/fiber';
import { applyMultiCharacterPhysicsSubstepCap } from '../../scene/scenePhysicsRegistry';

/** Runs before per-model physics updates — keeps multi-char substep cap in sync. */
export function MultiCharacterPhysicsCap() {
  useFrame(() => {
    applyMultiCharacterPhysicsSubstepCap();
  }, -500);
  return null;
}

export default MultiCharacterPhysicsCap;
