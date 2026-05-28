import type { JoltWorkerInMessage, JoltWorkerOutMessage } from './joltWorkerProtocol';
import { guardMessageHandler, deferMessageWork } from '../utils/messageHandlerScheduler';

export interface JoltWorkerInboundState {
  latestPhysicsBuffer: { current: Float32Array | null };
  physicsUpdatePending: { current: boolean };
  frameInFlight: { current: boolean };
  workerReady: { current: boolean };
  postFrameAck: (frameId: number) => void;
  releaseSupersededBuffer: (buffer: Float32Array) => void;
}

/**
 * Minimal synchronous work for transferable physics readback.
 * Heavy bone apply runs in useFrame, not here.
 */
export function handleJoltWorkerOutMessage(
  msg: JoltWorkerOutMessage,
  state: JoltWorkerInboundState
): void {
  switch (msg.type) {
    case 'PHYSICS_DATA':
    case 'PHYSICS_UPDATE': {
      const prev = state.latestPhysicsBuffer.current;
      state.latestPhysicsBuffer.current = msg.buffer;
      state.physicsUpdatePending.current = true;
      state.frameInFlight.current = false;

      if (prev && prev !== msg.buffer) {
        deferMessageWork(() => state.releaseSupersededBuffer(prev));
      }

      deferMessageWork(() => state.postFrameAck(msg.frameId));
      break;
    }
    case 'INIT_DONE':
      state.workerReady.current = true;
      state.frameInFlight.current = false;
      break;
    case 'ERROR':
      if (import.meta.env.DEV) {
        console.warn('[Jolt Worker]', msg.message);
      }
      state.frameInFlight.current = false;
      break;
    case 'DISPOSED':
      state.workerReady.current = false;
      state.frameInFlight.current = false;
      break;
    default:
      break;
  }
}

export function createJoltWorkerOnMessage(
  state: JoltWorkerInboundState
): (event: MessageEvent<JoltWorkerOutMessage>) => void {
  return (event: MessageEvent<JoltWorkerOutMessage>) => {
    guardMessageHandler('joltWorker.onmessage', () => {
      handleJoltWorkerOutMessage(event.data, state);
    });
  };
}

export function createJoltWorkerInitListener(
  onResult: (ok: boolean) => void
): (event: MessageEvent<JoltWorkerOutMessage>) => void {
  return (event: MessageEvent<JoltWorkerOutMessage>) => {
    guardMessageHandler('joltWorker.init', () => {
      const type = event.data.type;
      if (type === 'INIT_DONE') {
        deferMessageWork(() => onResult(true));
      } else if (type === 'ERROR') {
        deferMessageWork(() => onResult(false));
      }
    });
  };
}

export function postJoltFrameAck(
  worker: Worker | null,
  frameId: number
): void {
  if (!worker) return;
  const msg: JoltWorkerInMessage = { type: 'FRAME_ACK', frameId };
  worker.postMessage(msg);
}
