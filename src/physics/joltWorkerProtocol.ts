import type { MMDConstraintDef, MMDRigidBodyDef } from './mmdTypes';

/** Floats per rigid-body world pose: px, py, pz, qx, qy, qz, qw */
export const JOLT_POSE_STRIDE = 7;

export type JoltWorkerInMessage =
  | {
      type: 'INIT';
      rigidBodies: MMDRigidBodyDef[];
      constraints: MMDConstraintDef[];
      gravity: [number, number, number];
      unitStep: number;
      /** All bodies × {@link JOLT_POSE_STRIDE} initial world COM poses (transferable) */
      initialPoses: Float32Array;
    }
  | {
      type: 'FRAME_READY';
      /** Kinematic bodies × {@link JOLT_POSE_STRIDE} (transferable) */
      kinematicBuffer: Float32Array;
      steps: number;
      frameId: number;
    }
  | { type: 'FRAME_ACK'; frameId: number }
  | {
      type: 'RELEASE_BUFFER';
      /** Dynamic readback buffer returned to worker pool (transferable) */
      buffer: Float32Array;
    }
  | { type: 'RESET'; poses: Float32Array }
  | { type: 'DISPOSE' };

export type JoltWorkerOutMessage =
  | {
      type: 'INIT_DONE';
      kinematicCount: number;
      dynamicCount: number;
      bodyCount: number;
    }
  | {
      type: 'PHYSICS_DATA';
      buffer: Float32Array;
      frameId: number;
    }
  /** @deprecated Alias kept for older worker builds */
  | {
      type: 'PHYSICS_UPDATE';
      buffer: Float32Array;
      frameId: number;
    }
  | { type: 'ERROR'; message: string }
  | { type: 'DISPOSED' };
