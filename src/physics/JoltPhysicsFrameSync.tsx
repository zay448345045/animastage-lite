import { useFrame } from '@react-three/fiber';
import { bumpRenderFrameId } from './physicsFrameGate';
import { resetJoltStepGuard } from './joltSharedWorld';

/** Resets shared Jolt step guard + physics dispatch gate once per render frame. */
export function JoltPhysicsFrameSync() {
  useFrame(() => {
    bumpRenderFrameId();
    resetJoltStepGuard();
  }, -1000);
  return null;
}
