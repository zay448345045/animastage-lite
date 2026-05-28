/**
 * Jolt WASM physics worker — double-buffered transferable readback + frame sync.
 */
import initJolt from 'jolt-physics/wasm-compat';
import { Bone } from 'three';
import { setupJoltCollisionLayers, objectLayerForMmdBody, LAYER_STATIC } from './joltCollisionLayers';
import { createMmdJoltShape } from './mmdJoltShapes';
import { MMDConstraintJolt } from './mmdConstraintJolt';
import { JOLT_POSE_STRIDE } from './joltWorkerProtocol';
import type { JoltWorkerInMessage, JoltWorkerOutMessage } from './joltWorkerProtocol';
import {
  MMD_BODY_KINEMATIC,
  type MMDConstraintDef,
  type MMDRigidBodyDef,
} from './mmdTypes';
import type { JoltModule } from './joltLoader';
import {
  guardMessageHandler,
  WORKER_MESSAGE_HANDLER_BUDGET_MS,
} from '../utils/messageHandlerScheduler';

type BodyStub = {
  bodyId: JoltModule['BodyID'];
  params: MMDRigidBodyDef;
  bone: Bone;
};

let Jolt: JoltModule | null = null;
let joltInterface: JoltModule['JoltInterface'] | null = null;
let bodyInterface: JoltModule['BodyInterface'] | null = null;
let physicsSystem: JoltModule['PhysicsSystem'] | null = null;
let unitStep = 1 / 60;

const bodyStubs: BodyStub[] = [];
const kinematicBodyIndices: number[] = [];
const dynamicBodyIndices: number[] = [];

/** True after PHYSICS_DATA post until main returns buffer via RELEASE_BUFFER. */
let isWaitingForFrame = false;

/** Pool of dynamic readback buffers (double buffering). */
const dynamicBufferPool: Float32Array[] = [];
/** Buffer currently being filled for the next postMessage. */
let writeBuffer: Float32Array | null = null;

let scratchPos: JoltModule['RVec3'] | null = null;
let scratchRot: JoltModule['Quat'] | null = null;

const wasmPos = { x: 0, y: 0, z: 0 };
const wasmRot = { x: 0, y: 0, z: 0, w: 1 };

function postOut(msg: JoltWorkerOutMessage, transfer?: Transferable[]): void {
  if (transfer?.length) {
    self.postMessage(msg, transfer);
  } else {
    self.postMessage(msg);
  }
}

function postError(message: string): void {
  postOut({ type: 'ERROR', message });
}

function takeDynamicBuffer(): Float32Array | null {
  return dynamicBufferPool.pop() ?? null;
}

function returnDynamicBuffer(buf: Float32Array): void {
  if (buf.byteLength === 0) return;
  dynamicBufferPool.push(buf);
}

function initDynamicBufferPool(dynamicCount: number): void {
  dynamicBufferPool.length = 0;
  writeBuffer = null;
  isWaitingForFrame = false;

  if (dynamicCount <= 0) return;

  const size = dynamicCount * JOLT_POSE_STRIDE;
  const a = new Float32Array(size);
  const b = new Float32Array(size);
  dynamicBufferPool.push(a, b);
  writeBuffer = takeDynamicBuffer();
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
  if (!Jolt || !bodyInterface || !scratchPos || !scratchRot) return;
  const o = poseIndex * JOLT_POSE_STRIDE;
  scratchPos.Set(poses[o], poses[o + 1], poses[o + 2]);
  scratchRot.Set(poses[o + 3], poses[o + 4], poses[o + 5], poses[o + 6]);
  bodyInterface.SetPositionAndRotation(
    bodyStubs[bodyIndex].bodyId,
    scratchPos,
    scratchRot,
    Jolt.EActivation_Activate
  );
}

function fillDynamicReadback(out: Float32Array): void {
  if (!Jolt || !bodyInterface || !scratchPos || !scratchRot) return;

  const dynamicCount = dynamicBodyIndices.length;
  for (let d = 0; d < dynamicCount; d++) {
    const bodyIndex = dynamicBodyIndices[d];
    bodyInterface.GetPositionAndRotation(bodyStubs[bodyIndex].bodyId, scratchPos, scratchRot);
    const offset = d * JOLT_POSE_STRIDE;
    out[offset] = scratchPos.GetX();
    out[offset + 1] = scratchPos.GetY();
    out[offset + 2] = scratchPos.GetZ();
    out[offset + 3] = scratchRot.GetX();
    out[offset + 4] = scratchRot.GetY();
    out[offset + 5] = scratchRot.GetZ();
    out[offset + 6] = scratchRot.GetW();
  }
}

async function handleInit(msg: Extract<JoltWorkerInMessage, { type: 'INIT' }>): Promise<void> {
  disposeWorld();

  Jolt = await initJolt();
  const settings = new Jolt.JoltSettings();
  settings.mMaxWorkerThreads = 0;

  const layers = setupJoltCollisionLayers(Jolt);
  settings.mObjectLayerPairFilter = layers.objectFilter;
  settings.mBroadPhaseLayerInterface = layers.bpInterface;
  settings.mObjectVsBroadPhaseLayerFilter = layers.objectVsBp;

  joltInterface = new Jolt.JoltInterface(settings);
  Jolt.destroy(settings);

  physicsSystem = joltInterface.GetPhysicsSystem();
  bodyInterface = physicsSystem.GetBodyInterface();
  unitStep = msg.unitStep;

  scratchPos = new Jolt.RVec3(0, 0, 0);
  scratchRot = new Jolt.Quat(0, 0, 0, 1);

  const g = new Jolt.Vec3(msg.gravity[0], msg.gravity[1], msg.gravity[2]);
  physicsSystem.SetGravity(g);
  Jolt.destroy(g);

  ensureStaticFloor();

  kinematicBodyIndices.length = 0;
  dynamicBodyIndices.length = 0;
  bodyStubs.length = 0;

  const sharedWorld = {
    Jolt,
    joltInterface,
    physicsSystem,
    bodyInterface,
  };

  const initPos = new Jolt.RVec3(0, 0, 0);
  const initRot = new Jolt.Quat(0, 0, 0, 1);

  for (let i = 0; i < msg.rigidBodies.length; i++) {
    const params = msg.rigidBodies[i];
    const o = i * JOLT_POSE_STRIDE;
    initPos.Set(msg.initialPoses[o], msg.initialPoses[o + 1], msg.initialPoses[o + 2]);
    initRot.Set(
      msg.initialPoses[o + 3],
      msg.initialPoses[o + 4],
      msg.initialPoses[o + 5],
      msg.initialPoses[o + 6]
    );

    const shape = createMmdJoltShape(Jolt, params);
    const motionType =
      params.type === MMD_BODY_KINEMATIC
        ? Jolt.EMotionType_Kinematic
        : Jolt.EMotionType_Dynamic;

    const creation = new Jolt.BodyCreationSettings(
      shape,
      initPos,
      initRot,
      motionType,
      objectLayerForMmdBody(params.type)
    );

    creation.mFriction = params.friction;
    creation.mRestitution = params.restitution;
    creation.mLinearDamping = params.positionDamping;
    creation.mAngularDamping = params.rotationDamping;
    creation.mMass = params.type === MMD_BODY_KINEMATIC ? 0 : Math.max(params.weight, 0.001);

    const body = bodyInterface.CreateBody(creation);
    Jolt.destroy(creation);
    const bodyId = body.GetID();
    bodyInterface.AddBody(bodyId, Jolt.EActivation_Activate);

    const stub: BodyStub = {
      bodyId,
      params,
      bone: new Bone(),
    };
    bodyStubs.push(stub);

    if (params.type === MMD_BODY_KINEMATIC) {
      kinematicBodyIndices.push(i);
    } else {
      dynamicBodyIndices.push(i);
    }
  }

  Jolt.destroy(initPos);
  Jolt.destroy(initRot);

  let constraintsCreated = 0;
  for (const def of msg.constraints) {
    const bodyA = bodyStubs[def.rigidBodyIndex1];
    const bodyB = bodyStubs[def.rigidBodyIndex2];
    const c = MMDConstraintJolt.tryCreate(
      sharedWorld,
      bodyA as unknown as import('./mmdRigidBodyJolt').MMDRigidBodyJolt,
      bodyB as unknown as import('./mmdRigidBodyJolt').MMDRigidBodyJolt,
      def,
      bodyStubs.length
    );
    if (c) constraintsCreated++;
  }

  initDynamicBufferPool(dynamicBodyIndices.length);

  postOut({
    type: 'INIT_DONE',
    kinematicCount: kinematicBodyIndices.length,
    dynamicCount: dynamicBodyIndices.length,
    bodyCount: bodyStubs.length,
  });

  console.info(
    `[Jolt Worker] Init: ${bodyStubs.length} bodies, ${constraintsCreated} constraints, pool=${dynamicBufferPool.length}`
  );
}

function handleFrameReady(msg: Extract<JoltWorkerInMessage, { type: 'FRAME_READY' }>): void {
  if (!Jolt || !joltInterface || !bodyInterface) {
    postError('Worker not initialized');
    return;
  }

  if (isWaitingForFrame) {
    return;
  }

  if (!writeBuffer) {
    writeBuffer = takeDynamicBuffer();
  }
  if (!writeBuffer) {
    return;
  }

  const kin = msg.kinematicBuffer;
  for (let k = 0; k < kinematicBodyIndices.length; k++) {
    setBodyPoseFromBuffer(kinematicBodyIndices[k], kin, k);
  }

  const steps = Math.max(1, Math.min(msg.steps, 3));
  for (let s = 0; s < steps; s++) {
    joltInterface.Step(unitStep, 1);
  }

  fillDynamicReadback(writeBuffer);

  const out = writeBuffer;
  writeBuffer = takeDynamicBuffer();
  isWaitingForFrame = true;

  postOut(
    {
      type: 'PHYSICS_DATA',
      buffer: out,
      frameId: msg.frameId,
    },
    [out.buffer]
  );
}

function handleReleaseBuffer(msg: Extract<JoltWorkerInMessage, { type: 'RELEASE_BUFFER' }>): void {
  returnDynamicBuffer(msg.buffer);
  isWaitingForFrame = false;

  if (!writeBuffer) {
    writeBuffer = takeDynamicBuffer();
  }
}

function handleReset(msg: Extract<JoltWorkerInMessage, { type: 'RESET' }>): void {
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
  if (Jolt && scratchPos) {
    Jolt.destroy(scratchPos);
  }
  if (Jolt && scratchRot) {
    Jolt.destroy(scratchRot);
  }
  scratchPos = null;
  scratchRot = null;
  Jolt = null;
  joltInterface = null;
  bodyInterface = null;
  physicsSystem = null;
  bodyStubs.length = 0;
  kinematicBodyIndices.length = 0;
  dynamicBodyIndices.length = 0;
  dynamicBufferPool.length = 0;
  writeBuffer = null;
  isWaitingForFrame = false;
}

self.onmessage = (event: MessageEvent<JoltWorkerInMessage>) => {
  const msg = event.data;
  if (msg.type === 'FRAME_READY') {
    setTimeout(() => handleFrameReady(msg), 0);
    return;
  }
  if (msg.type === 'FRAME_ACK' || msg.type === 'RELEASE_BUFFER') {
    if (msg.type === 'RELEASE_BUFFER') {
      handleReleaseBuffer(msg);
    }
    return;
  }

  guardMessageHandler(
    'jolt.worker.onmessage',
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
