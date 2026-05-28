/** Snapshot-based undo/redo (reze-studio pattern, max 100). */

export interface UndoStack<T> {
  push: (snapshot: T) => void;
  undo: (current: T) => T | null;
  redo: (current: T) => T | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export function createUndoStack<T>(maxSize = 100): UndoStack<T> {
  const past: T[] = [];
  const future: T[] = [];

  return {
    push(snapshot: T) {
      past.push(structuredClone(snapshot));
      if (past.length > maxSize) past.shift();
      future.length = 0;
    },
    undo(current: T) {
      if (past.length === 0) return null;
      future.push(structuredClone(current));
      return past.pop() ?? null;
    },
    redo(current: T) {
      if (future.length === 0) return null;
      past.push(structuredClone(current));
      return future.pop() ?? null;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    clear: () => {
      past.length = 0;
      future.length = 0;
    },
  };
}
