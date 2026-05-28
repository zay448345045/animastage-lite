import * as THREE from 'three';
import type { MMDAnimationHelper } from 'three-stdlib';
import type { MMDPhysicsJolt } from '../physics';
import { playheadRef, MMD_FPS } from '../utils/playhead';
import { frameToTime, seekAnimationMixer } from '../utils/animationSync';
import {
  type TimelineEvaluated,
  type TimelineLiveValues,
  buildDefaultsInto,
  evaluateTimelineInto,
  applyTimelineEvaluatedFast,
  buildMmdTimelineApplyCache,
  type MmdTimelineApplyCache,
  TimelineTrackCache,
  restorePhysicsDrivenBonePoses,
  restoreMmdRestPose,
} from './TimelineLogic';
import type { TimelineKeyframe } from '../types';

/** Fixed Jolt sub-step (60 Hz). */
export const PHYSICS_FIXED_STEP = 1 / 60;
/** Max physics sub-steps per render frame — prevents spiral-of-death. */
export const PHYSICS_MAX_STEPS = 3;
/** Cap raw delta fed into the accumulator (100 ms). */
export const PHYSICS_DELTA_CAP = 0.1;

const DEG2RAD = Math.PI / 180;

export const enum MmdAnimSource {
  None = 0,
  Vmd = 1,
  Timeline = 2,
}

export interface MmdHelperMeshState {
  physics?: MMDPhysicsJolt;
  ikSolver?: { update: () => void };
  mixer?: THREE.AnimationMixer;
}

export interface MmdFrameLoopState {
  physicsAccumulator: number;
  wasPlaying: boolean;
  sanitizeFrame: number;
  /** True while Jolt sim ran last frame — avoids physics.reset() every idle frame. */
  physicsWasSimulating: boolean;
  /** Last applied root transform used to detect manual model moves/rotations. */
  prevRootQuaternion: THREE.Quaternion;
  prevRootScale: THREE.Vector3;
}

export interface MmdFrameLoopRefs {
  helper: MMDAnimationHelper;
  mesh: THREE.SkinnedMesh;
  meshState: MmdHelperMeshState | undefined;
  timelineKeyframes: TimelineKeyframe[];
  timelineLive: TimelineLiveValues;
  timelineTrackCache: TimelineTrackCache;
  timelineEval: TimelineEvaluated;
  timelineApplyCache: MmdTimelineApplyCache | null;
  loopState: MmdFrameLoopState;
  prevRootPos: THREE.Vector3;
  rootGroup: THREE.Group | null;
  joltReady: boolean;
  physicsMode: 'anytime' | 'playtime' | 'off';
  isPlaying: boolean;
  animationReady: boolean;
  vmdBlobUrls: string[] | undefined;
  vmdPlaybackEnabled: boolean;
  currentFrame: number;
  gizmoDragging: boolean;
  selectedBoneId: string;
  boneRotationDeg: { x: number; y: number; z: number };
}

export function createTimelineEvalBuffer(): TimelineEvaluated {
  return {
    morph_eyes: 0,
    morph_mouth: 0,
    morph_brow: 0,
    bone_head_y: 0,
    bone_neck_x: 0,
    bone_spine_y: 0,
    bone_spine_z: 0,
    bone_waist_y: 0,
    bone_l_arm_x: 0,
    bone_l_arm_z: 0,
    bone_r_arm_x: 0,
    bone_r_arm_z: 0,
  };
}

function resolveAnimSource(ctx: MmdFrameLoopRefs): {
  source: MmdAnimSource;
  playing: boolean;
  activeFrame: number;
  hasManualTimeline: boolean;
} {
  const hasManualTimeline = ctx.timelineKeyframes.length > 0;
  const hasVmd = ctx.animationReady && (ctx.vmdBlobUrls?.length ?? 0) > 0;
  const playing = ctx.isPlaying;
  const activeFrame = playing ? playheadRef.current : ctx.currentFrame;

  if (hasVmd && ctx.vmdPlaybackEnabled) {
    return { source: MmdAnimSource.Vmd, playing, activeFrame, hasManualTimeline };
  }
  if (hasManualTimeline) {
    return { source: MmdAnimSource.Timeline, playing, activeFrame, hasManualTimeline };
  }
  return { source: MmdAnimSource.None, playing, activeFrame, hasManualTimeline };
}

function refreshBoneMatrices(mesh: THREE.SkinnedMesh): void {
  mesh.updateMatrixWorld(false);
  const bones = mesh.skeleton?.bones;
  if (!bones) return;
  for (let i = 0; i < bones.length; i++) {
    bones[i].updateMatrixWorld(false);
  }
}

/** Push skinned mesh state to WebGPU / WebGL skinning pipeline. */
export function finalizeSkinnedMeshForGpu(mesh: THREE.SkinnedMesh): void {
  if (mesh.skeleton) {
    mesh.skeleton.update();
  }
  if (mesh.matrixWorldNeedsUpdate) {
    mesh.updateMatrixWorld(false);
  }
}

function applyVmdAnimation(
  ctx: MmdFrameLoopRefs,
  playing: boolean,
  activeFrame: number,
  delta: number
): void {
  const { helper, meshState } = ctx;
  helper.enable('animation', true);
  helper.enable('ik', true);
  helper.enable('grant', true);

  const mixer = meshState?.mixer;
  const time = frameToTime(activeFrame, MMD_FPS);
  const speedFactor = Math.max(0.001, ctx.playSpeed / MMD_FPS);

  // Double-influence fix: when physics is 'anytime', prevent VMD from changing
  // rotations of bones that are physics-driven. Store and restore those quaternions.
  const physicsBones: THREE.Bone[] = [];
  if (meshState?.physics && ctx.physicsMode === 'anytime') {
    try {
      const names = meshState.physics.getDynamicBoneNames();
      if (mesh.skeleton) {
        for (const b of mesh.skeleton.bones) {
          if (names.has(b.name) || b.userData?.hasPhysics) {
            physicsBones.push(b);
          }
        }
      }
    } catch {
      // ignore if API unavailable
    }
  }

  const savedRot: THREE.Quaternion[] = [];
  if (physicsBones.length) {
    for (let i = 0; i < physicsBones.length; i++) {
      savedRot.push(physicsBones[i].quaternion.clone());
    }
  }

  if (playing) {
    if (!ctx.loopState.wasPlaying && mixer) {
      seekAnimationMixer(mixer, time);
    }
    helper.update(delta * speedFactor);
  } else {
    if (mixer) {
      seekAnimationMixer(mixer, time);
    }
    helper.update(0);
  }

  if (physicsBones.length) {
    for (let i = 0; i < physicsBones.length; i++) {
      physicsBones[i].quaternion.copy(savedRot[i]);
    }
  }
}

function applyTimelineAnimation(ctx: MmdFrameLoopRefs, activeFrame: number): void {
  const { helper, mesh, meshState, timelineTrackCache, timelineEval, timelineLive } = ctx;
  helper.enable('animation', false);
  helper.enable('ik', false);
  helper.enable('grant', false);

  meshState?.mixer?.stopAllAction();

  buildDefaultsInto(timelineLive, timelineEval);
  evaluateTimelineInto(timelineTrackCache, timelineLive, activeFrame, timelineEval);

  let applyCache = ctx.timelineApplyCache;
  if (!applyCache) {
    applyCache = buildMmdTimelineApplyCache(mesh);
    ctx.timelineApplyCache = applyCache;
  }
  applyTimelineEvaluatedFast(mesh, timelineEval, applyCache);
}

function applyGizmoBoneOverride(ctx: MmdFrameLoopRefs, mesh: THREE.SkinnedMesh): void {
  if (!ctx.gizmoDragging || !ctx.selectedBoneId || !mesh.skeleton) return;

  const bones = mesh.skeleton.bones;
  let bone: THREE.Bone | undefined;
  for (let i = 0; i < bones.length; i++) {
    const b = bones[i];
    if (b.name === ctx.selectedBoneId || b.uuid === ctx.selectedBoneId) {
      bone = b;
      break;
    }
  }
  if (!bone) return;

  const rot = ctx.boneRotationDeg;
  bone.rotation.x = rot.x * DEG2RAD;
  bone.rotation.y = rot.y * DEG2RAD;
  bone.rotation.z = rot.z * DEG2RAD;
  ctx.meshState?.ikSolver?.update();
}

function runPhysicsPass(
  ctx: MmdFrameLoopRefs,
  mesh: THREE.SkinnedMesh,
  playing: boolean,
  delta: number
): void {
  const physics = ctx.meshState?.physics;
  if (!physics || !ctx.joltReady || ctx.physicsMode === 'off') {
    ctx.loopState.physicsAccumulator = 0;
    return;
  }

  const runPhysics =
    ctx.physicsMode === 'anytime' || (ctx.physicsMode === 'playtime' && playing);

  physics.setSimulationEnabled(runPhysics);

  if (
    runPhysics &&
    (playing || ctx.physicsMode === 'anytime') &&
    physics.canSimulate()
  ) {
    ctx.loopState.physicsWasSimulating = true;

    // Strict Hierarchy: ensure skeleton pose is the baseline for physics input
    if (mesh.skeleton && typeof mesh.skeleton.pose === 'function') {
      mesh.skeleton.pose();
    }

    // Snap COM of dynamic bodies to their bones if they drift too far
    try {
      const threshold = 0.5;
      if ((meshState?.physics as any)?.bodies) {
        const bodies = (meshState?.physics as any).bodies as any[];
        const buffers = (meshState?.physics as any).syncBuffers as any;
        const tmp = new THREE.Vector3();
        for (const b of bodies) {
          if (!b || b.params?.type === undefined) continue;
          if (b.params.type === undefined) continue;
          // skip kinematic bodies (type value depends on enum)
          if (b.params.type === 0) continue;
          if (typeof b.getCenterOfMass === 'function') {
            b.getCenterOfMass(buffers, tmp);
            const bone = b.bone as THREE.Bone;
            const boneWorld = new THREE.Vector3();
            bone.getWorldPosition(boneWorld);
            if (boneWorld.distanceTo(tmp) > threshold) {
              // snap physics body to bone to avoid explosions
              if (typeof b.syncBodyFromBone === 'function') {
                b.syncBodyFromBone(buffers);
              }
            }
          }
        }
      }
    } catch {
      // best-effort only
    }

    if (ctx.physicsMode === 'anytime') {
      const add =
        playing && delta > 0
          ? delta > PHYSICS_DELTA_CAP
            ? PHYSICS_DELTA_CAP
            : delta
          : PHYSICS_FIXED_STEP;
      ctx.loopState.physicsAccumulator += add;
    } else if (playing && delta > 0) {
      const capped = delta > PHYSICS_DELTA_CAP ? PHYSICS_DELTA_CAP : delta;
      ctx.loopState.physicsAccumulator += capped;
    }

    if (!physics.usesWorker()) {
      refreshBoneMatrices(mesh);
    }

    const maxSteps =
      ctx.physicsMode === 'anytime' && !playing ? 1 : PHYSICS_MAX_STEPS;

    physics.stepFixedSync(ctx.loopState.physicsAccumulator, maxSteps, true);
    ctx.loopState.physicsAccumulator = physics.consumeAccumulator();
  } else {
    if (ctx.loopState.physicsWasSimulating) {
      refreshBoneMatrices(mesh);
      restorePhysicsDrivenBonePoses(mesh, physics.getDynamicBoneNames());
      physics.reset();
      ctx.loopState.physicsWasSimulating = false;
    }
    ctx.loopState.physicsAccumulator = 0;
  }

  // After physics: ensure matrices are up-to-date before render
  mesh.updateMatrixWorld(true);
  if (mesh.skeleton) mesh.skeleton.update();
}

function quickSanitizeSkeleton(mesh: THREE.SkinnedMesh): void {
  const bones = mesh.skeleton?.bones;
  if (!bones) return;
  for (let i = 0; i < bones.length; i++) {
    const e = bones[i].matrixWorld.elements;
    if (
      !Number.isFinite(e[0]) ||
      !Number.isFinite(e[5]) ||
      !Number.isFinite(e[10]) ||
      !Number.isFinite(e[15])
    ) {
      restoreMmdRestPose(mesh);
      mesh.skeleton?.update();
      mesh.updateMatrixWorld(true);
      return;
    }
  }
}

/**
 * Zero-allocation per-frame update for MMD SkinnedMesh + Jolt + timeline/VMD.
 * Order: animation source → physics → gizmo → GPU skinning finalize.
 */
export function runMmdSkinnedMeshFrame(ctx: MmdFrameLoopRefs, delta: number): void {
  const mesh = ctx.mesh;
  const helper = ctx.helper;
  const { source, playing, activeFrame, hasManualTimeline } = resolveAnimSource(ctx);

  helper.enable('physics', false);

  switch (source) {
    case MmdAnimSource.Vmd:
      applyVmdAnimation(ctx, playing, activeFrame, delta);
      break;
    case MmdAnimSource.Timeline:
      applyTimelineAnimation(ctx, activeFrame);
      break;
    default:
      helper.enable('animation', false);
      helper.enable('ik', !hasManualTimeline);
      helper.enable('grant', !hasManualTimeline);
      helper.update(0);
      break;
  }

  runPhysicsPass(ctx, mesh, playing, delta);

  const root = ctx.rootGroup;
  if (root) {
    const rootMoved =
      !ctx.prevRootPos.equals(root.position) ||
      !ctx.loopState.prevRootQuaternion.equals(root.quaternion) ||
      !ctx.loopState.prevRootScale.equals(root.scale);

    if (rootMoved) {
      ctx.prevRootPos.copy(root.position);
      ctx.loopState.prevRootQuaternion.copy(root.quaternion);
      ctx.loopState.prevRootScale.copy(root.scale);
      refreshBoneMatrices(mesh);
      ctx.meshState?.physics?.reset();
      ctx.loopState.physicsAccumulator = 0;
    }
  }

  if (source !== MmdAnimSource.Vmd || !playing) {
    applyGizmoBoneOverride(ctx, mesh);
  }

  ctx.loopState.wasPlaying = playing;

  ctx.loopState.sanitizeFrame += 1;
  if (ctx.loopState.sanitizeFrame % 24 === 0) {
    quickSanitizeSkeleton(mesh);
  }

  finalizeSkinnedMeshForGpu(mesh);
}
