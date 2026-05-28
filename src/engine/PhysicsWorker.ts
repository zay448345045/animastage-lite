import * as THREE from 'three';
import {
  attachPhysicsSabViews,
  computePhysicsSabByteLength,
  initPhysicsSabHeader,
  isSharedPhysicsAvailable,
  PhysCommand,
  PhysHeaderIndex,
  PHYS_RING_SLOTS,
  PHYS_STRIDE,
  ringSlotForSeq,
  type PhysicsSabViews,
} from './physicsSharedLayout';
import { applyDynamicPhysicsBuffer } from '../physics/joltPhysicsBufferApply';
import type { MmdDynamicBodySlot, MmdPhysicsBodyMapping } from '../physics/joltPhysicsBufferApply';
import { packKinematicBodyPoses } from '../physics/joltPhysicsBufferApply';
import { tryAcquirePhysicsDispatchSlot } from '../physics/physicsFrameGate';
import { MMD_BODY_KINEMATIC, type MMDConstraintDef, type MMDRigidBodyDef } from '../physics/mmdTypes';
import { guardMessageHandler, deferMessageWork } from '../utils/messageHandlerScheduler';

type SabWorkerOutMessage =
  | { type: 'INIT_DONE'; dynamicCount: number; kinematicCount: number }
  | { type: 'ERROR'; message: string }
  | { type: 'DISPOSED' };

/**
 * Main-thread facade for Jolt physics in a worker with SharedArrayBuffer ring readback.
 * Control messages only — dynamics poses are read via {@link getDynamicPoseView} in useFrame.
 */
export class PhysicsWorker {
  private worker: Worker | null = null;
  private sab: SharedArrayBuffer | null = null;
  private views: PhysicsSabViews | null = null;
  private ready = false;
  private initPromise: Promise<boolean> | null = null;
  private lastConsumedSeq = 0;
  private dynamicCount = 0;
  private kinematicCount = 0;

  static isSupported(): boolean {
    return isSharedPhysicsAvailable();
  }

  isReady(): boolean {
    return this.ready;
  }

  /** Kinematic input region — pack poses here before {@link requestStep}. */
  getKinematicView(): Float32Array | null {
    return this.views?.kinematic ?? null;
  }

  /**
   * Zero-copy view of the latest completed dynamics slot, or null if nothing new.
   * Call only from useFrame / render thread.
   */
  getDynamicPoseView(): Float32Array | null {
    if (!this.views) return null;

    const writeSeq = Atomics.load(this.views.header, PhysHeaderIndex.WriteSeq);
    if (writeSeq <= this.lastConsumedSeq) return null;

    const slot = ringSlotForSeq(writeSeq, PHYS_RING_SLOTS);
    return this.views.ringSlots[slot] ?? null;
  }

  hasPendingDynamics(): boolean {
    if (!this.views) return false;
    const writeSeq = Atomics.load(this.views.header, PhysHeaderIndex.WriteSeq);
    return writeSeq > this.lastConsumedSeq;
  }

  markDynamicsConsumed(): void {
    if (!this.views) return;
    const writeSeq = Atomics.load(this.views.header, PhysHeaderIndex.WriteSeq);
    if (writeSeq <= this.lastConsumedSeq) return;
    this.lastConsumedSeq = writeSeq;
    Atomics.store(this.views.header, PhysHeaderIndex.ReadSeq, writeSeq);
  }

  packKinematic(
    mappings: readonly MmdPhysicsBodyMapping[],
    mesh: THREE.SkinnedMesh
  ): void {
    const kin = this.views?.kinematic;
    if (!kin) return;
    packKinematicBodyPoses(mappings, kin, mesh);
  }

  async init(
    rigidBodies: MMDRigidBodyDef[],
    constraints: MMDConstraintDef[],
    gravity: [number, number, number],
    unitStep: number,
    initialPoses: Float32Array
  ): Promise<boolean> {
    if (!PhysicsWorker.isSupported()) {
      return false;
    }

    if (this.initPromise) return this.initPromise;

    this.dynamicCount = rigidBodies.filter((p) => p.type !== MMD_BODY_KINEMATIC).length;
    this.kinematicCount = rigidBodies.filter((p) => p.type === MMD_BODY_KINEMATIC).length;

    const byteLength = computePhysicsSabByteLength(this.dynamicCount, this.kinematicCount);
    this.sab = new SharedArrayBuffer(byteLength);
    this.views = attachPhysicsSabViews(this.sab, this.dynamicCount, this.kinematicCount);
    initPhysicsSabHeader(this.views.header, this.dynamicCount, this.kinematicCount);

    this.initPromise = new Promise((resolve) => {
      const w = this.ensureWorker();
    const onInit = (event: MessageEvent<SabWorkerOutMessage>) => {
      guardMessageHandler('physicsSAB.init', () => {
        const type = event.data.type;
        if (type === 'INIT_DONE') {
          deferMessageWork(() => {
            w.removeEventListener('message', onInit);
            this.ready = true;
            resolve(true);
          });
        } else if (type === 'ERROR') {
          deferMessageWork(() => {
            w.removeEventListener('message', onInit);
            resolve(false);
          });
        }
      });
    };
    w.addEventListener('message', onInit);

      w.postMessage(
        {
          type: 'INIT',
          sab: this.sab,
          rigidBodies,
          constraints,
          gravity,
          unitStep,
          initialPoses,
        },
        [initialPoses.buffer]
      );
    });

    return this.initPromise;
  }

  /**
   * Request simulation step — tiny postMessage only; kinematic data must already be in SAB.
   */
  requestStep(steps: number): boolean {
    if (!this.ready || !this.worker || !this.views) return false;
    if (!tryAcquirePhysicsDispatchSlot()) return false;

    const header = this.views.header;
    const writeSeq = Atomics.load(header, PhysHeaderIndex.WriteSeq);
    const readSeq = Atomics.load(header, PhysHeaderIndex.ReadSeq);
    if (writeSeq - readSeq >= PHYS_RING_SLOTS) {
      return false;
    }
    if (Atomics.load(header, PhysHeaderIndex.WorkerBusy) === 1) {
      return false;
    }

    Atomics.store(header, PhysHeaderIndex.StepCount, steps);
    Atomics.store(header, PhysHeaderIndex.Command, PhysCommand.Step);
    this.worker.postMessage({ type: 'STEP' });
    return true;
  }

  /**
   * Apply latest ring-buffer dynamics to bones (useFrame). No postMessage / no array copy.
   */
  applyPendingDynamics(mesh: THREE.SkinnedMesh, dynamicSlots: readonly MmdDynamicBodySlot[]): void {
    const view = this.getDynamicPoseView();
    if (!view) return;

    applyDynamicPhysicsBuffer(view, dynamicSlots);

    if (mesh.skeleton) {
      mesh.skeleton.update();
    }
    mesh.updateMatrixWorld(true);

    this.markDynamicsConsumed();
  }

  requestReset(poses: Float32Array, bodyCount: number): void {
    if (!this.ready || !this.worker) return;
    const slice = poses.subarray(0, bodyCount * PHYS_STRIDE);
    this.worker.postMessage({ type: 'RESET', poses: slice });
    this.lastConsumedSeq = 0;
    if (this.views) {
      Atomics.store(this.views.header, PhysHeaderIndex.WriteSeq, 0);
      Atomics.store(this.views.header, PhysHeaderIndex.ReadSeq, 0);
    }
  }

  dispose(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'DISPOSE' });
      this.worker.terminate();
      this.worker = null;
    }
    this.initPromise = null;
    this.ready = false;
    this.sab = null;
    this.views = null;
    this.lastConsumedSeq = 0;
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./physicsSAB.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.onerror = (err) => {
        console.error('[PhysicsWorker SAB]', err);
      };
    }
    return this.worker;
  }
}

let sharedPhysicsWorker: PhysicsWorker | null = null;

export function getPhysicsWorker(): PhysicsWorker {
  if (!sharedPhysicsWorker) {
    sharedPhysicsWorker = new PhysicsWorker();
  }
  return sharedPhysicsWorker;
}

export function disposePhysicsWorker(): void {
  sharedPhysicsWorker?.dispose();
  sharedPhysicsWorker = null;
}
