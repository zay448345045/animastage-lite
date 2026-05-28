/** Chrome DevTools flags handlers blocking the main thread longer than this. */
export const MESSAGE_HANDLER_FRAME_BUDGET_MS = 16;

/** Worker Jolt WASM steps may legitimately take longer — warn only above this on workers. */
export const WORKER_MESSAGE_HANDLER_BUDGET_MS = 50;

export interface MessageHandlerPerfMeta {
  readonly handlerName: string;
  readonly durationMs: number;
  readonly exceededBudget: boolean;
}

let perfWarnCallback: ((meta: MessageHandlerPerfMeta) => void) | null = null;

export function setMessageHandlerPerfWarn(
  callback: ((meta: MessageHandlerPerfMeta) => void) | null
): void {
  perfWarnCallback = callback;
}

/**
 * Wrap a synchronous message handler: measure time, warn if over frame budget.
 * Keep the inner function minimal — defer heavy work with {@link deferMessageWork}.
 */
export function guardMessageHandler<T>(
  handlerName: string,
  fn: () => T,
  budgetMs: number = MESSAGE_HANDLER_FRAME_BUDGET_MS
): T {
  const start = performance.now();
  const result = fn();
  const durationMs = performance.now() - start;
  if (durationMs > budgetMs) {
    const meta: MessageHandlerPerfMeta = {
      handlerName,
      durationMs,
      exceededBudget: true,
    };
    perfWarnCallback?.(meta);
    if (import.meta.env.DEV) {
      console.warn(
        `[MessageHandler] "${handlerName}" exceeded frame budget:`,
        durationMs.toFixed(2),
        'ms'
      );
    }
  }
  return result;
}

/** Defer non-critical work out of the message handler turn. */
export function deferMessageWork(fn: () => void): void {
  queueMicrotask(fn);
}

/** Defer rendering / DOM / canvas work to the next frame. */
export function deferMessageWorkToAnimationFrame(fn: () => void): void {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => fn());
  } else {
    setTimeout(fn, 0);
  }
}

/** Defer to a macrotask when microtask queue must drain first. */
export function deferMessageWorkToTask(fn: () => void): void {
  setTimeout(fn, 0);
}

export type WorkerMessageHandler<T> = (data: T, event: MessageEvent<T>) => void;

/**
 * Build a Worker `onmessage` handler: guard + optional defer for heavy branches.
 */
export function createWorkerMessageHandler<T>(
  handlerName: string,
  route: WorkerMessageHandler<T>,
  options: { defer?: boolean } = {}
): (event: MessageEvent<T>) => void {
  const { defer = false } = options;
  return (event: MessageEvent<T>) => {
    if (!defer) {
      guardMessageHandler(handlerName, () => route(event.data, event));
      return;
    }
    guardMessageHandler(handlerName, () => {
      const data = event.data;
      deferMessageWork(() => route(data, event));
    });
  };
}

export type WindowMessageHandler<T> = (data: T, event: MessageEvent<T>) => void;

export function createWindowMessageHandler<T>(
  handlerName: string,
  route: WindowMessageHandler<T>,
  options: { defer?: boolean } = {}
): (event: MessageEvent<T>) => void {
  return createWorkerMessageHandler(handlerName, route, options);
}
