import * as THREE from 'three';
import { JOLT_POSE_STRIDE } from './joltWorkerProtocol';
import type { JoltWorkerInMessage, JoltWorkerOutMessage } from './joltWorkerProtocol';
import type { MMDConstraintDef, MMDRigidBodyDef } from './mmdTypes';
import { applyDynamicPhysicsBuffer } from './joltPhysicsBufferApply';
import type { MMDPhysicsJolt } from './mmdPhysicsJolt';
import { tryAcquirePhysicsDispatchSlot } from './physicsFrameGate';
import {
  createJoltWorkerInitListener,
  createJoltWorkerOnMessage,
  postJoltFrameAck,
} from './joltWorkerMessageHandlers';
import { deferMessageWorkToAnimationFrame } from '../utils/messageHandlerScheduler';

/** Latest transferable physics readback — assigned only in onmessage (zero-copy). */
export const latestPhysicsBuffer: { current: Float32Array | null } = { current: null };

/** True when a new transferable buffer has not yet been consumed by useFrame. */
export const physicsUpdatePending: { current: boolean } = { current: false };

export const lastAppliedPhysicsFrameId: { current: number } = { current: -1 };

let worker: Worker | null = null;
let initPromise: Promise<boolean> | null = null;
const workerReadyRef = { current: false };
const frameInFlightRef = { current: false };
let frameCounter = 0;

let kinematicPackA: Float32Array | null = null;
let kinematicPackB: Float32Array | null = null;
let kinematicWrite: Float32Array | null = null;

let allPosesBuffer: Float32Array | null = null;

const inboundState = {
  latestPhysicsBuffer,
  physicsUpdatePending,
  frameInFlight: frameInFlightRef,
  workerReady: workerReadyRef,
  postFrameAck: (frameId: number) => postJoltFrameAck(worker, frameId),
  releaseSupersededBuffer: (buffer: Float32Array) => releasePhysicsBufferToWorker(buffer),
};

function ensureWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./jolt.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = createJoltWorkerOnMessage(inboundState);
    worker.onerror = (err) => {
      console.error('[Jolt Worker]', err);
      frameInFlightRef.current = false;
    };
  }
  return worker;
}

export function isJoltWorkerReady(): boolean {
  return workerReadyRef.current;
}

export function isJoltWorkerFrameInFlight(): boolean {
  return frameInFlightRef.current;
}

export function canSendWorkerPhysicsFrame(): boolean {
  return (
    workerReadyRef.current &&
    !!worker &&
    !frameInFlightRef.current &&
    !physicsUpdatePending.current &&
    tryAcquirePhysicsDispatchSlot()
  );
}

export function initJoltWorker(
  rigidBodies: MMDRigidBodyDef[],
  constraints: MMDConstraintDef[],
  gravity: [number, number, number],
  unitStep: number,
  initialPoses: Float32Array
): Promise<boolean> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve(false);
  }

  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    const w = ensureWorker();
    frameInFlightRef.current = true;

    const onInit = createJoltWorkerInitListener((ok) => {
      w.removeEventListener('message', onInit);
      workerReadyRef.current = ok;
      frameInFlightRef.current = false;
      resolve(ok);
    });
    w.addEventListener('message', onInit);

    const msg: JoltWorkerInMessage = {
      type: 'INIT',
      rigidBodies,
      constraints,
      gravity,
      unitStep,
      initialPoses,
    };
    w.postMessage(msg, [initialPoses.buffer]);
  });

  return initPromise;
}

export function ensureKinematicPackBuffer(kinematicCount: number): Float32Array {
  const need = kinematicCount * JOLT_POSE_STRIDE;
  if (
    !kinematicPackA ||
    kinematicPackA.byteLength === 0 ||
    kinematicPackA.length < need
  ) {
    kinematicPackA = new Float32Array(need);
    kinematicPackB = new Float32Array(need);
    kinematicWrite = kinematicPackA;
  }
  if (!kinematicPackB || kinematicPackB.byteLength === 0 || kinematicPackB.length < need) {
    kinematicPackB = new Float32Array(need);
  }
  if (!kinematicWrite || kinematicWrite.byteLength === 0) {
    kinematicWrite = kinematicPackA;
  }
  return kinematicWrite;
}

function swapKinematicWriteBuffer(): void {
  if (!kinematicPackA || !kinematicPackB || !kinematicWrite) return;
  kinematicWrite = kinematicWrite === kinematicPackA ? kinematicPackB : kinematicPackA;
}

export function ensureAllPosesBuffer(bodyCount: number): Float32Array {
  const need = bodyCount * JOLT_POSE_STRIDE;
  if (!allPosesBuffer || allPosesBuffer.byteLength === 0 || allPosesBuffer.length < need) {
    allPosesBuffer = new Float32Array(need);
  }
  return allPosesBuffer;
}

/**
 * Request one worker physics step (throttled: one dispatch per render frame).
 */
export function requestWorkerPhysicsFrame(
  kinematicBuffer: Float32Array,
  kinematicCount: number,
  steps: number
): boolean {
  if (!canSendWorkerPhysicsFrame()) {
    return false;
  }

  frameCounter += 1;
  frameInFlightRef.current = true;

  const slice = kinematicBuffer.subarray(0, kinematicCount * JOLT_POSE_STRIDE);

  const msg: JoltWorkerInMessage = {
    type: 'FRAME_READY',
    kinematicBuffer: slice,
    steps,
    frameId: frameCounter,
  };

  worker!.postMessage(msg, [slice.buffer]);
  swapKinematicWriteBuffer();
  return true;
}

function releasePhysicsBufferToWorker(buf: Float32Array): void {
  if (!worker || buf.byteLength === 0) return;
  const msg: JoltWorkerInMessage = { type: 'RELEASE_BUFFER', buffer: buf };
  worker.postMessage(msg, [buf.buffer]);
}

/**
 * Apply pending worker physics in useFrame (deferred from message handler).
 */
export function applyAndReleaseWorkerPhysics(
  mesh: THREE.SkinnedMesh,
  physics: MMDPhysicsJolt
): void {
  if (!physics.usesWorker() || physics.usesSharedPhysics()) return;
  if (!physicsUpdatePending.current) return;

  const buf = latestPhysicsBuffer.current;
  if (!buf) return;

  applyDynamicPhysicsBuffer(buf, physics.getDynamicSlots());

  if (mesh.skeleton) {
    mesh.skeleton.update();
  }
  mesh.updateMatrixWorld(true);

  latestPhysicsBuffer.current = null;
  physicsUpdatePending.current = false;
  lastAppliedPhysicsFrameId.current = frameCounter;

  deferMessageWorkToAnimationFrame(() => releasePhysicsBufferToWorker(buf));
}

export function requestWorkerReset(poses: Float32Array, bodyCount: number): void {
  if (!workerReadyRef.current || !worker) return;
  const slice = poses.subarray(0, bodyCount * JOLT_POSE_STRIDE);
  const msg: JoltWorkerInMessage = {
    type: 'RESET',
    poses: slice,
  };
  worker.postMessage(msg, [slice.buffer]);
}

export function disposeJoltWorker(): void {
  if (worker) {
    worker.postMessage({ type: 'DISPOSE' } satisfies JoltWorkerInMessage);
    worker.terminate();
    worker = null;
  }
  initPromise = null;
  workerReadyRef.current = false;
  frameInFlightRef.current = false;
  latestPhysicsBuffer.current = null;
  physicsUpdatePending.current = false;
  kinematicPackA = null;
  kinematicPackB = null;
  kinematicWrite = null;
  allPosesBuffer = null;
}

/** @deprecated Use applyAndReleaseWorkerPhysics */
export const latestPhysicsData = latestPhysicsBuffer;

/** @deprecated */
export function markPhysicsUpdateApplied(frameId?: number): void {
  physicsUpdatePending.current = false;
  if (frameId !== undefined) {
    lastAppliedPhysicsFrameId.current = frameId;
  }
}

/** @deprecated Use requestWorkerPhysicsFrame */
export function requestWorkerPhysicsSync(
  kinematicBuffer: Float32Array,
  kinematicCount: number,
  steps: number
): boolean {
  return requestWorkerPhysicsFrame(kinematicBuffer, kinematicCount, steps);
}

export function isJoltWorkerBusy(): boolean {
  return frameInFlightRef.current || physicsUpdatePending.current;
}
