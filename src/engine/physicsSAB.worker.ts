/**
 * Jolt physics worker — reads/writes poses via SharedArrayBuffer ring (no large postMessage).
 */
import initJolt from 'jolt-physics/wasm-compat';
import { Bone } from 'three';
import { setupJoltCollisionLayers, objectLayerForMmdBody, LAYER_STATIC } from '../physics/joltCollisionLayers';
import { createMmdJoltShape } from '../physics/mmdJoltShapes';
import { MMDConstraintJolt } from '../physics/mmdConstraintJolt';
import {
  attachPhysicsSabViews,
  initPhysicsSabHeader,
  PHYS_SAB_MAGIC,
  PHYS_STRIDE,
  PhysCommand,
  PhysHeaderIndex,
  ringSlotForSeq,
} from './physicsSharedLayout';
import { MMD_BODY_KINEMATIC, type MMDConstraintDef, type MMDRigidBodyDef } from '../physics/mmdTypes';
import type { JoltModule } from '../physics/joltLoader';
import {
  guardMessageHandler,
  WORKER_MESSAGE_HANDLER_BUDGET_MS,
} from '../utils/messageHandlerScheduler';

type BodyStub = {
  bodyId: JoltModule['BodyID'];
  params: MMDRigidBodyDef;
  bone: Bone;
};

type WorkerInMessage =
  | {
      type: 'INIT';
      sab: SharedArrayBuffer;
      rigidBodies: MMDRigidBodyDef[];
      constraints: MMDConstraintDef[];
      gravity: [number, number, number];
      unitStep: number;
      initialPoses: Float32Array;
    }
  | { type: 'STEP' }
  | { type: 'RESET'; poses: Float32Array }
  | { type: 'DISPOSE' };

type WorkerOutMessage =
  | { type: 'INIT_DONE'; dynamicCount: number; kinematicCount: number }
  | { type: 'ERROR'; message: string }
  | { type: 'DISPOSED' };

let Jolt: JoltModule | null = null;
let joltInterface: JoltModule['JoltInterface'] | null = null;
let bodyInterface: JoltModule['BodyInterface'] | null = null;
let unitStep = 1 / 60;

let header: Int32Array | null = null;
let kinematicView: Float32Array | null = null;
let ringSlots: Float32Array[] = [];

const bodyStubs: BodyStub[] = [];
const kinematicBodyIndices: number[] = [];
const dynamicBodyIndices: number[] = [];

const wasmPos = { x: 0, y: 0, z: 0 };
const wasmRot = { x: 0, y: 0, z: 0, w: 1 };
const scratchPos = { x: 0, y: 0, z: 0 };
const scratchRot = { x: 0, y: 0, z: 0, w: 1 };
let scratchKinematicPos: JoltModule['RVec3'] | null = null;
let scratchKinematicRot: JoltModule['Quat'] | null = null;
let scratchDynamicPos: JoltModule['RVec3'] | null = null;
let scratchDynamicRot: JoltModule['Quat'] | null = null;

function postOut(msg: WorkerOutMessage): void {
  self.postMessage(msg);
}

function postError(message: string): void {
  postOut({ type: 'ERROR', message });
}

function ensureStaticFloor(): void {
  if (!Jolt || !bodyInterface) return;

  const halfExtent = new Jolt.Vec3(50, 0.5, 50);
  const shape = new Jolt.BoxShape(halfExtent, 0.05, null);
  Jolt.destroy(halfExtent);

  const pos = new Jolt.RVec3(0, -0.5, 0);
  const rot = new Jolt.Quat(0, 0, 0, 1);
  const settings = new Jolt.BodyCreationSettings(
    shape,
    pos,
    rot,
    Jolt.EMotionType_Static,
    LAYER_STATIC
  );
  Jolt.destroy(pos);
  Jolt.destroy(rot);

  const body = bodyInterface.CreateBody(settings);
  Jolt.destroy(settings);
  bodyInterface.AddBody(body.GetID(), Jolt.EActivation_DontActivate);
}

function setBodyPoseFromBuffer(bodyIndex: number, poses: Float32Array, poseIndex: number): void {
  if (!Jolt || !bodyInterface) return;
  const o = poseIndex * PHYS_STRIDE;
  wasmPos.x = poses[o];
  wasmPos.y = poses[o + 1];
  wasmPos.z = poses[o + 2];
  wasmRot.x = poses[o + 3];
  wasmRot.y = poses[o + 4];
  wasmRot.z = poses[o + 5];
  wasmRot.w = poses[o + 6];

  if (!scratchKinematicPos || !scratchKinematicRot) return;

  scratchKinematicPos.Set(wasmPos.x, wasmPos.y, wasmPos.z);
  scratchKinematicRot.Set(wasmRot.x, wasmRot.y, wasmRot.z, wasmRot.w);
  bodyInterface.SetPositionAndRotation(
    bodyStubs[bodyIndex].bodyId,
    scratchKinematicPos,
    scratchKinematicRot,
    Jolt.EActivation_Activate
  );
}

function fillDynamicSlot(out: Float32Array): void {
  if (!Jolt || !bodyInterface || !scratchDynamicPos || !scratchDynamicRot) return;

  const dynamicCount = dynamicBodyIndices.length;

  for (let d = 0; d < dynamicCount; d++) {
    const bodyIndex = dynamicBodyIndices[d];
    bodyInterface.GetPositionAndRotation(
      bodyStubs[bodyIndex].bodyId,
      scratchDynamicPos,
      scratchDynamicRot
    );
    const offset = d * PHYS_STRIDE;
    out[offset] = scratchDynamicPos.GetX();
    out[offset + 1] = scratchDynamicPos.GetY();
    out[offset + 2] = scratchDynamicPos.GetZ();
    out[offset + 3] = scratchDynamicRot.GetX();
    out[offset + 4] = scratchDynamicRot.GetY();
    out[offset + 5] = scratchDynamicRot.GetZ();
    out[offset + 6] = scratchDynamicRot.GetW();
  }
}

async function handleInit(msg: Extract<WorkerInMessage, { type: 'INIT' }>): Promise<void> {
  disposeWorld();

  const dynamicCount = msg.rigidBodies.filter((p) => p.type !== MMD_BODY_KINEMATIC).length;
  const kinematicCount = msg.rigidBodies.filter((p) => p.type === MMD_BODY_KINEMATIC).length;

  const views = attachPhysicsSabViews(msg.sab, dynamicCount, kinematicCount);
  header = views.header;
  kinematicView = views.kinematic;
  ringSlots = views.ringSlots;
  initPhysicsSabHeader(header, dynamicCount, kinematicCount);

  if (header[PhysHeaderIndex.Magic] !== PHYS_SAB_MAGIC) {
    postError('Invalid SharedArrayBuffer magic');
    return;
  }

  Jolt = await initJolt();
  scratchKinematicPos = new Jolt.RVec3(0, 0, 0);
  scratchKinematicRot = new Jolt.Quat(0, 0, 0, 1);
  scratchDynamicPos = new Jolt.RVec3(0, 0, 0);
  scratchDynamicRot = new Jolt.Quat(0, 0, 0, 1);
  const settings = new Jolt.JoltSettings();
  settings.mMaxWorkerThreads = 0;

  const layers = setupJoltCollisionLayers(Jolt);
  settings.mObjectLayerPairFilter = layers.objectFilter;
  settings.mBroadPhaseLayerInterface = layers.bpInterface;
  settings.mObjectVsBroadPhaseLayerFilter = layers.objectVsBp;

  joltInterface = new Jolt.JoltInterface(settings);
  Jolt.destroy(settings);

  const physicsSystem = joltInterface.GetPhysicsSystem();
  bodyInterface = physicsSystem.GetBodyInterface();
  unitStep = msg.unitStep;

  const g = new Jolt.Vec3(msg.gravity[0], msg.gravity[1], msg.gravity[2]);
  physicsSystem.SetGravity(g);
  Jolt.destroy(g);

  ensureStaticFloor();

  kinematicBodyIndices.length = 0;
  dynamicBodyIndices.length = 0;
  bodyStubs.length = 0;

  const sharedWorld = { Jolt, joltInterface, physicsSystem, bodyInterface };

  for (let i = 0; i < msg.rigidBodies.length; i++) {
    const params = msg.rigidBodies[i];
    const o = i * PHYS_STRIDE;
    wasmPos.x = msg.initialPoses[o];
    wasmPos.y = msg.initialPoses[o + 1];
    wasmPos.z = msg.initialPoses[o + 2];
    wasmRot.x = msg.initialPoses[o + 3];
    wasmRot.y = msg.initialPoses[o + 4];
    wasmRot.z = msg.initialPoses[o + 5];
    wasmRot.w = msg.initialPoses[o + 6];

    const shape = createMmdJoltShape(Jolt, params);
    const pos = new Jolt.RVec3(wasmPos.x, wasmPos.y, wasmPos.z);
    const rot = new Jolt.Quat(wasmRot.x, wasmRot.y, wasmRot.z, wasmRot.w);

    const motionType =
      params.type === MMD_BODY_KINEMATIC
        ? Jolt.EMotionType_Kinematic
        : Jolt.EMotionType_Dynamic;

    const creation = new Jolt.BodyCreationSettings(
      shape,
      pos,
      rot,
      motionType,
      objectLayerForMmdBody(params.type)
    );
    Jolt.destroy(pos);
    Jolt.destroy(rot);

    creation.mFriction = params.friction;
    creation.mRestitution = params.restitution;
    creation.mLinearDamping = params.positionDamping;
    creation.mAngularDamping = params.rotationDamping;
    creation.mMass = params.type === MMD_BODY_KINEMATIC ? 0 : Math.max(params.weight, 0.001);

    const body = bodyInterface.CreateBody(creation);
    Jolt.destroy(creation);
    const bodyId = body.GetID();
    bodyInterface.AddBody(bodyId, Jolt.EActivation_Activate);

    bodyStubs.push({ bodyId, params, bone: new Bone() });

    if (params.type === MMD_BODY_KINEMATIC) {
      kinematicBodyIndices.push(i);
    } else {
      dynamicBodyIndices.push(i);
    }
  }

  for (const def of msg.constraints) {
    const bodyA = bodyStubs[def.rigidBodyIndex1];
    const bodyB = bodyStubs[def.rigidBodyIndex2];
    MMDConstraintJolt.tryCreate(
      sharedWorld,
      bodyA as unknown as import('../physics/mmdRigidBodyJolt').MMDRigidBodyJolt,
      bodyB as unknown as import('../physics/mmdRigidBodyJolt').MMDRigidBodyJolt,
      def,
      bodyStubs.length
    );
  }

  postOut({
    type: 'INIT_DONE',
    dynamicCount,
    kinematicCount,
  });
}

function handleStep(): void {
  if (!Jolt || !joltInterface || !bodyInterface || !header || !kinematicView) {
    postError('Worker not initialized');
    return;
  }

  if (Atomics.load(header, PhysHeaderIndex.WorkerBusy) === 1) {
    return;
  }

  const writeSeq = Atomics.load(header, PhysHeaderIndex.WriteSeq);
  const readSeq = Atomics.load(header, PhysHeaderIndex.ReadSeq);
  if (writeSeq - readSeq >= ringSlots.length) {
    return;
  }

  Atomics.store(header, PhysHeaderIndex.WorkerBusy, 1);

  const kin = kinematicView;
  for (let k = 0; k < kinematicBodyIndices.length; k++) {
    setBodyPoseFromBuffer(kinematicBodyIndices[k], kin, k);
  }

  const steps = Math.max(1, Math.min(Atomics.load(header, PhysHeaderIndex.StepCount), 3));
  for (let s = 0; s < steps; s++) {
    joltInterface.Step(unitStep, 1);
  }

  const nextSeq = Atomics.add(header, PhysHeaderIndex.WriteSeq, 1);
  const slot = ringSlotForSeq(nextSeq, ringSlots.length);
  fillDynamicSlot(ringSlots[slot]!);

  Atomics.store(header, PhysHeaderIndex.Command, PhysCommand.Idle);
  Atomics.store(header, PhysHeaderIndex.WorkerBusy, 0);
}

function handleReset(msg: Extract<WorkerInMessage, { type: 'RESET' }>): void {
  if (!bodyInterface) return;
  for (let i = 0; i < bodyStubs.length; i++) {
    setBodyPoseFromBuffer(i, msg.poses, i);
  }
}

function disposeWorld(): void {
  if (Jolt && joltInterface) {
    try {
      Jolt.destroy(joltInterface);
    } catch {
      // already destroyed
    }
  }
  if (scratchKinematicPos) {
    Jolt.destroy(scratchKinematicPos);
    scratchKinematicPos = null;
  }
  if (scratchKinematicRot) {
    Jolt.destroy(scratchKinematicRot);
    scratchKinematicRot = null;
  }
  if (scratchDynamicPos) {
    Jolt.destroy(scratchDynamicPos);
    scratchDynamicPos = null;
  }
  if (scratchDynamicRot) {
    Jolt.destroy(scratchDynamicRot);
    scratchDynamicRot = null;
  }
  Jolt = null;
  joltInterface = null;
  bodyInterface = null;
  bodyStubs.length = 0;
  kinematicBodyIndices.length = 0;
  dynamicBodyIndices.length = 0;
  header = null;
  kinematicView = null;
  ringSlots = [];
}

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  if (msg.type === 'STEP') {
    setTimeout(() => handleStep(), 0);
    return;
  }
  if (msg.type === 'FRAME_ACK') {
    return;
  }

  guardMessageHandler(
    'physicsSAB.worker.onmessage',
    () => {
      try {
        switch (msg.type) {
          case 'INIT':
            void handleInit(msg);
            break;
          case 'RESET':
            handleReset(msg);
            break;
          case 'DISPOSE':
            disposeWorld();
            postOut({ type: 'DISPOSED' });
            break;
          default:
            break;
        }
      } catch (error) {
        postError(error instanceof Error ? error.message : String(error));
      }
    },
    WORKER_MESSAGE_HANDLER_BUDGET_MS
  );
};

export {};
