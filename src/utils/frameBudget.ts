import { MESSAGE_HANDLER_FRAME_BUDGET_MS } from './messageHandlerScheduler';
import { setPreviousFrameOverBudget } from '../physics/physicsFrameGate';

let frameStartMs = 0;

export function beginRenderFrame(): void {
  frameStartMs = performance.now();
}

export function endRenderFrame(): void {
  const duration = performance.now() - frameStartMs;
  setPreviousFrameOverBudget(duration > MESSAGE_HANDLER_FRAME_BUDGET_MS * 2);
}
