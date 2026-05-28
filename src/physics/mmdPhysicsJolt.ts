import * as THREE from 'three';
import {
  acquireSharedJoltWorld,
  JoltSyncBuffers,
  releaseSharedJoltWorld,
  stepSharedJoltWorldSubstep,
} from './joltSharedWorld';
import type { SharedJoltWorld } from './joltSharedWorld';
import { MMDConstraintJolt } from './mmdConstraintJolt';
import { MMDRigidBodyJolt } from './mmdRigidBodyJolt';
import { createMmdPhysicsHelper } from './mmdPhysicsHelper';
import type { MMDConstraintDef, MMDPhysicsParams, MMDRigidBodyDef } from './mmdTypes';
import { MMD_BODY_KINEMATIC } from './mmdTypes';
import {
  buildDynamicBodySlots,
  buildMmdPhysicsBodyMappings,
  packAllBodyPoses,
  packKinematicBodyPoses,
  type MmdDynamicBodySlot,
  type MmdPhysicsBodyMapping,
} from './joltPhysicsBufferApply';
import { JOLT_POSE_STRIDE } from './joltWorkerProtocol';
import { disposePhysicsWorker, getPhysicsWorker, PhysicsWorker } from '../engine/PhysicsWorker';
import { startPhysicsLoadCooldown } from './physicsFrameGate';
import {
  disposeJoltWorker,
  ensureAllPosesBuffer,
  ensureKinematicPackBuffer,
  initJoltWorker,
  requestWorkerPhysicsFrame,
  requestWorkerReset,
} from './joltWorkerClient';

export class MMDPhysicsJolt {
  readonly mesh: THREE.SkinnedMesh;
  readonly bodies: MMDRigidBodyJolt[] = [];
  readonly unitStep: number;
  readonly maxStepNum: number;
  readonly gravity: THREE.Vector3;
  readonly syncBuffers: JoltSyncBuffers;

  private readonly world: SharedJoltWorld;
  private readonly constraints: MMDConstraintJolt[] = [];
  private readonly kinematicBodies: MMDRigidBodyJolt[] = [];
  private readonly dynamicBodies: MMDRigidBodyJolt[] = [];
  private simulationEnabled = true;
  private simulationEnabledApplied = true;
  private disposed = false;
  private timeAccumulator = 0;

  private readonly _decomposePos = new THREE.Vector3();
  private readonly _decomposeQuat = new THREE.Quaternion();
  private readonly _decomposeScale = new THREE.Vector3();
  private readonly _savedScale = new THREE.Vector3();

  private readonly rigidBodyParams: MMDRigidBodyDef[];
  private readonly constraintParams: MMDConstraintDef[];
  private readonly bodyMappings: MmdPhysicsBodyMapping[];
  private readonly dynamicSlots: MmdDynamicBodySlot[];
  private readonly kinematicCount: number;
  private workerMode = false;
  private sharedPhysicsMode = false;
  private workerInitStarted = false;
  private workerHandoffReady = false;

  constructor(
    mesh: THREE.SkinnedMesh,
    rigidBodyParams: MMDRigidBodyDef[] = [],
    constraintParams: MMDConstraintDef[] = [],
    params: MMDPhysicsParams = {}
  ) {
    this.mesh = mesh;
    this.rigidBodyParams = rigidBodyParams;
    this.constraintParams = constraintParams;
    this.unitStep = params.unitStep ?? 1 / 60;
    this.maxStepNum = params.maxStepNum ?? 3;
    this.gravity = params.gravity?.clone() ?? new THREE.Vector3(0, -98, 0);

    this.bodyMappings = buildMmdPhysicsBodyMappings(mesh, rigidBodyParams);
    this.dynamicSlots = buildDynamicBodySlots(this.bodyMappings);
    this.kinematicCount = rigidBodyParams.filter((p) => p.type === MMD_BODY_KINEMATIC).length;

    this.world = acquireSharedJoltWorld();
    this.syncBuffers = new JoltSyncBuffers(this.world.Jolt);
    this.setGravity(this.gravity);

    const savedParent = mesh.parent;
    const savedPos = mesh.position.clone();
    const savedQuat = mesh.quaternion.clone();
    const savedScale = mesh.scale.clone();

    if (savedParent) mesh.parent = null;
    mesh.position.set(0, 0, 0);
    mesh.quaternion.set(0, 0, 0, 1);
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrixWorld(true);

    for (const def of rigidBodyParams) {
      const body = new MMDRigidBodyJolt(mesh, this.world, def);
      this.bodies.push(body);
      if (def.type === MMD_BODY_KINEMATIC) {
        this.kinematicBodies.push(body);
      } else {
        this.dynamicBodies.push(body);
      }
    }

    mesh.updateMatrixWorld(true);
    if (mesh.skeleton) {
      mesh.skeleton.bones.forEach((bone) => bone.updateMatrixWorld(true));
      mesh.skeleton.update();
    }

    let constraintsCreated = 0;
    let constraintsSkipped = 0;

    for (const def of constraintParams) {
      const bodyA = this.bodies[def.rigidBodyIndex1];
      const bodyB = this.bodies[def.rigidBodyIndex2];
      const constraint = MMDConstraintJolt.tryCreate(
        this.world,
        bodyA,
        bodyB,
        def,
        this.bodies.length
      );
      if (constraint) {
        this.constraints.push(constraint);
        constraintsCreated++;
      } else {
        constraintsSkipped++;
      }
    }

    if (constraintsSkipped > 0) {
      console.info(
        `[MMD Jolt] Constraints: ${constraintsCreated} created, ${constraintsSkipped} skipped`
      );
    }

    if (savedParent) mesh.parent = savedParent;
    mesh.position.copy(savedPos);
    mesh.quaternion.copy(savedQuat);
    mesh.scale.copy(savedScale);
    mesh.updateMatrixWorld(true);

    this.reset();
  }

  /** True when worker (or main) physics is safe to step — avoids freeze during handoff. */
  canSimulate(): boolean {
    if (this.disposed || !this.simulationEnabled) return false;
    if (this.workerMode) return this.workerHandoffReady;
    if (this.workerInitStarted) return false;
    return this.bodies.length > 0;
  }

  /** Schedule worker handoff after load (idle) — do not call from constructor. */
  scheduleWorkerHandoff(): void {
    if (this.workerInitStarted || this.disposed || this.workerMode) return;
    this.workerInitStarted = true;

    const run = () => {
      if (!this.disposed) void this.tryEnableWorkerMode();
    };

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: 4000 });
    } else {
      window.setTimeout(run, 200);
    }
  }

  /** @deprecated Use {@link scheduleWorkerHandoff} */
  private ensureWorkerInit(): void {
    this.scheduleWorkerHandoff();
  }

  usesWorker(): boolean {
    return this.workerMode;
  }

  usesSharedPhysics(): boolean {
    return this.sharedPhysicsMode;
  }

  getDynamicSlots(): readonly MmdDynamicBodySlot[] {
    return this.dynamicSlots;
  }

  getKinematicCount(): number {
    return this.kinematicCount;
  }

  /** Spawn Jolt worker and hand off simulation when init succeeds. */
  private async tryEnableWorkerMode(): Promise<void> {
    if (this.disposed) return;

    const bodyCount = this.rigidBodyParams.length;
    const poses = ensureAllPosesBuffer(bodyCount);

    await new Promise<void>((resolve) => {
      const pack = () => {
        if (this.disposed) {
          resolve();
          return;
        }
        packAllBodyPoses(this.bodyMappings, poses, this.mesh);
        resolve();
      };
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(pack, { timeout: 3000 });
      } else {
        window.setTimeout(pack, 0);
      }
    });

    if (this.disposed) return;

    const initialPoses = new Float32Array(bodyCount * JOLT_POSE_STRIDE);
    initialPoses.set(poses.subarray(0, bodyCount * JOLT_POSE_STRIDE));

    let ok = false;
    if (PhysicsWorker.isSupported()) {
      ok = await getPhysicsWorker().init(
        this.rigidBodyParams,
        this.constraintParams,
        [this.gravity.x, this.gravity.y, this.gravity.z],
        this.unitStep,
        initialPoses
      );
      if (ok) {
        this.sharedPhysicsMode = true;
        console.info('[MMD Jolt] Physics in worker + SharedArrayBuffer ring buffer');
      }
    }

    if (!ok) {
      ok = await initJoltWorker(
        this.rigidBodyParams,
        this.constraintParams,
        [this.gravity.x, this.gravity.y, this.gravity.z],
        this.unitStep,
        initialPoses
      );
      if (ok) {
        console.info('[MMD Jolt] Physics in worker (transferable fallback — enable COOP/COEP for SAB)');
      }
    }

    if (!ok || this.disposed) {
      this.workerInitStarted = false;
      return;
    }

    this.disposeMainThreadSimulation();
    this.workerMode = true;
    this.workerHandoffReady = true;
    releaseSharedJoltWorld();
    startPhysicsLoadCooldown();
  }

  private disposeMainThreadSimulation(): void {
    for (const constraint of this.constraints) {
      constraint.dispose();
    }
    this.constraints.length = 0;

    for (const body of this.bodies) {
      body.dispose();
    }
    this.bodies.length = 0;
    this.kinematicBodies.length = 0;
    this.dynamicBodies.length = 0;

    this.syncBuffers.dispose(this.world.Jolt);
  }

  setSimulationEnabled(enabled: boolean): this {
    if (enabled === this.simulationEnabledApplied) {
      this.simulationEnabled = enabled;
      return this;
    }

    this.simulationEnabled = enabled;
    this.simulationEnabledApplied = enabled;

    if (this.workerMode || this.bodies.length === 0) {
      return this;
    }

    const { Jolt, bodyInterface } = this.world;

    for (const body of this.bodies) {
      if (body.params.type === MMD_BODY_KINEMATIC) continue;
      const motion = enabled ? Jolt.EMotionType_Dynamic : Jolt.EMotionType_Kinematic;
      bodyInterface.SetMotionType(body.bodyId, motion, Jolt.EActivation_Activate);
      if (!enabled) {
        body.syncBodyFromBone(this.syncBuffers);
      }
    }
    return this;
  }

  /**
   * Two-way matrix synchronization:
   * 1. Kinematic bodies <- bone world matrices
   * 2. Fixed-timestep Jolt sub-steps
   * 3. Dynamic bodies -> bone local transforms + skeleton refresh
   */
  updateTwoWaySync(delta: number, applyToBones = true): this {
    if (this.disposed) return this;
    this.timeAccumulator += delta > 0 ? Math.min(delta, 0.1) : 0;
    return this.stepFixedSync(this.timeAccumulator, this.maxStepNum, applyToBones);
  }

  /** Fixed-timestep sync with pre-filled accumulator value. */
  stepFixedSync(accumulator: number, maxSteps: number, applyToBones = true): this {
    if (this.disposed) return this;

    this.timeAccumulator = accumulator;

    /** Avoid main-thread Jolt WASM while the worker is still loading (prevents freeze on "Anytime"). */
    if (this.workerInitStarted && !this.workerMode) {
      return this;
    }

    if (this.workerMode) {
      return this.stepWorkerSync(maxSteps, applyToBones);
    }

    const parent = this.mesh.parent;

    this.mesh.matrixWorld.decompose(
      this._decomposePos,
      this._decomposeQuat,
      this._decomposeScale
    );
    const isNonDefaultScale =
      this._decomposeScale.x !== 1 ||
      this._decomposeScale.y !== 1 ||
      this._decomposeScale.z !== 1;

    if (isNonDefaultScale) {
      if (parent) this.mesh.parent = null;
      this._savedScale.copy(this._decomposeScale);
      this.mesh.scale.set(1, 1, 1);
      this.mesh.updateMatrixWorld(true);
      this.runTwoWaySyncPhases(maxSteps, applyToBones);
      if (parent) this.mesh.parent = parent;
      this.mesh.scale.copy(this._savedScale);
    } else {
      this.runTwoWaySyncPhases(maxSteps, applyToBones);
    }

    return this;
  }

  /** Worker path: pack kinematic poses, request STEP (SAB ring or transferable fallback). */
  private stepWorkerSync(maxSteps: number, _applyToBones: boolean): this {
    if (!this.workerMode || !this.workerHandoffReady || !this.simulationEnabled) {
      return this;
    }

    let steps = 0;
    while (this.timeAccumulator >= this.unitStep && steps < maxSteps) {
      this.timeAccumulator -= this.unitStep;
      steps++;
    }

    if (steps <= 0) {
      return this;
    }

    this.prepareSkeletonForPhysics();

    if (this.sharedPhysicsMode) {
      const pw = getPhysicsWorker();
      pw.packKinematic(this.bodyMappings, this.mesh);
      pw.requestStep(steps);
    } else {
      const kinBuf = ensureKinematicPackBuffer(this.kinematicCount);
      packKinematicBodyPoses(this.bodyMappings, kinBuf, this.mesh);
      requestWorkerPhysicsFrame(kinBuf, this.kinematicCount, steps);
    }

    return this;
  }
  consumeAccumulator(): number {
    return this.timeAccumulator;
  }

  resetAccumulator(): this {
    this.timeAccumulator = 0;
    return this;
  }

  update(delta: number): this {
    return this.updateTwoWaySync(delta);
  }

  private runTwoWaySyncPhases(maxSteps: number, applyToBones: boolean): void {
    this.prepareSkeletonForPhysics();

    for (const body of this.kinematicBodies) {
      body.syncKinematicToJolt(this.syncBuffers);
    }

    let steps = 0;
    if (this.simulationEnabled) {
      while (this.timeAccumulator >= this.unitStep && steps < maxSteps) {
        stepSharedJoltWorldSubstep(this.unitStep);
        this.timeAccumulator -= this.unitStep;
        steps++;
      }
    }

    if (applyToBones && this.simulationEnabled && steps > 0) {
      for (const body of this.dynamicBodies) {
        body.syncDynamicFromJolt(this.syncBuffers);
      }

      if (this.mesh.skeleton) {
        this.mesh.skeleton.update();
      }
      this.mesh.updateMatrixWorld(true);
    }
  }

  private prepareSkeletonForPhysics(): void {
    this.mesh.updateMatrixWorld(true);
    if (!this.mesh.skeleton) return;
    this.mesh.skeleton.update();
  }

  reset(): this {
    this.timeAccumulator = 0;
    this.prepareSkeletonForPhysics();

    if (this.workerMode) {
      const bodyCount = this.rigidBodyParams.length;
      const poses = ensureAllPosesBuffer(bodyCount);
      packAllBodyPoses(this.bodyMappings, poses, this.mesh);
      if (this.sharedPhysicsMode) {
        getPhysicsWorker().requestReset(poses, bodyCount);
      } else {
        requestWorkerReset(poses, bodyCount);
      }
      return this;
    }

    for (const body of this.bodies) {
      body.syncBodyFromBone(this.syncBuffers);
    }
    return this;
  }

  /** Align Jolt bodies with the current skeleton without simulating. */
  warmup(cycles: number): this {
    if (cycles <= 0) {
      this.reset();
      return this;
    }

    for (let i = 0; i < cycles; i++) {
      this.updateTwoWaySync(1 / 60, false);
    }
    this.reset();
    return this;
  }

  /** Bone names attached to dynamic MMD rigid bodies (type 1 or 2). */
  getDynamicBoneNames(): ReadonlySet<string> {
    const names = new Set<string>();
    if (this.workerMode) {
      for (const m of this.bodyMappings) {
        if (!m.isKinematic && m.params.boneIndex !== -1) {
          names.add(m.bone.name);
        }
      }
      return names;
    }
    for (const body of this.dynamicBodies) {
      if (body.params.boneIndex !== -1) {
        names.add(body.bone.name);
      }
    }
    return names;
  }

  setGravity(gravity: THREE.Vector3): this {
    this.gravity.copy(gravity);
    if (this.workerMode) {
      return this;
    }
    const { Jolt, physicsSystem } = this.world;
    const g = new Jolt.Vec3(gravity.x, gravity.y, gravity.z);
    physicsSystem.SetGravity(g);
    Jolt.destroy(g);
    return this;
  }

  createHelper(webgpu = false): THREE.Object3D {
    return createMmdPhysicsHelper(this.mesh, this, { webgpu });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timeAccumulator = 0;

    if (this.workerMode) {
      if (this.sharedPhysicsMode) {
        disposePhysicsWorker();
      } else {
        disposeJoltWorker();
      }
      return;
    }

    for (const constraint of this.constraints) {
      constraint.dispose();
    }
    this.constraints.length = 0;

    for (const body of this.bodies) {
      body.dispose();
    }
    this.bodies.length = 0;
    this.kinematicBodies.length = 0;
    this.dynamicBodies.length = 0;

    this.syncBuffers.dispose(this.world.Jolt);
    releaseSharedJoltWorld();
  }
}

export function setupMeshJoltPhysics(
  helper: import('three-stdlib').MMDAnimationHelper,
  mesh: THREE.SkinnedMesh,
  params: MMDPhysicsParams & { warmup?: number } = {}
): MMDPhysicsJolt | null {
  const mmd = mesh.geometry.userData.MMD as {
    rigidBodies?: MMDRigidBodyDef[];
    constraints?: MMDConstraintDef[];
  } | undefined;

  if (!mmd?.rigidBodies?.length) return null;

  const physics = new MMDPhysicsJolt(
    mesh,
    mmd.rigidBodies,
    mmd.constraints ?? [],
    params
  );

  type HelperObjects = import('three-stdlib').MMDAnimationHelper & {
    objects: WeakMap<THREE.SkinnedMesh, { physics?: MMDPhysicsJolt }>;
  };
  const objects = (helper as HelperObjects).objects.get(mesh);
  if (objects) {
    objects.physics = physics;
  }

  if (params.warmup !== undefined) {
    physics.warmup(params.warmup);
  } else {
    physics.warmup(0);
  }

  physics.scheduleWorkerHandoff();

  return physics;
}
