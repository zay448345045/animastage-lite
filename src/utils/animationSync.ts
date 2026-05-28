import * as THREE from 'three';

export function frameToTime(frame: number, fps: number): number {
  if (fps <= 0) return 0;
  return Math.max(0, frame / fps);
}

/** Seek every action on a mixer to an absolute time (seconds). */
export function seekAnimationMixer(mixer: THREE.AnimationMixer | undefined, time: number): void {
  if (!mixer) return;
  mixer.setTime(time);
  const actions = (mixer as THREE.AnimationMixer & { _actions?: THREE.AnimationAction[] })._actions;
  if (!actions) return;
  for (let i = 0; i < actions.length; i++) {
    actions[i].time = time;
    actions[i].paused = false;
  }
}

export function seekAnimationMixers(mixers: Array<THREE.AnimationMixer | undefined>, time: number): void {
  for (const mixer of mixers) {
    seekAnimationMixer(mixer, time);
  }
}
