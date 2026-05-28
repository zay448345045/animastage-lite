import type { JoltModule } from './joltLoader';

/** Emscripten-owned object that must be freed with `Jolt.destroy()`. */
export type JoltOwnedObject = object;

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function safeJoltDestroy(Jolt: JoltModule, object: unknown): void {
  if (object == null) return;
  try {
    Jolt.destroy(object as JoltOwnedObject);
  } catch {
    // Object already freed or owned by Jolt internals.
  }
}

/** Tracks temporary WASM allocations and frees them in reverse order. */
export class JoltDisposableStack {
  private readonly items: unknown[] = [];

  track<T extends JoltOwnedObject>(object: T): T {
    this.items.push(object);
    return object;
  }

  /** Remove an object from cleanup (e.g. after ownership transfer). */
  release(object: unknown): void {
    const index = this.items.indexOf(object);
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  dispose(Jolt: JoltModule): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      safeJoltDestroy(Jolt, this.items[i]);
    }
    this.items.length = 0;
  }
}

export function runJoltScoped<T>(
  Jolt: JoltModule,
  fn: (stack: JoltDisposableStack) => T
): T {
  const stack = new JoltDisposableStack();
  try {
    return fn(stack);
  } finally {
    stack.dispose(Jolt);
  }
}
