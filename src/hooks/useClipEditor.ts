import { useCallback, useRef } from 'react';
import { createUndoStack } from '../editor/undoRedo';
import {
  clearTrack,
  clearAllKeyframes,
  copyKeyframesAtFrame,
  pasteKeyframes,
  mirrorPasteKeyframes,
  timeStretchKeyframes,
  simplifyTrack,
  moveKeyframe,
} from '../editor/clipOperations';
import type { TimelineKeyframe, TimelineTrackId } from '../types';

export function useClipEditor() {
  const undo = useRef(createUndoStack<TimelineKeyframe[]>(100));
  const clipboard = useRef<{ keyframes: TimelineKeyframe[]; sourceFrame: number } | null>(null);

  const commit = useCallback((keyframes: TimelineKeyframe[]) => {
    undo.current.push(keyframes);
    return keyframes;
  }, []);

  const applyUndo = useCallback((current: TimelineKeyframe[]) => {
    const prev = undo.current.undo(current);
    return prev ?? current;
  }, []);

  const applyRedo = useCallback((current: TimelineKeyframe[]) => {
    const next = undo.current.redo(current);
    return next ?? current;
  }, []);

  const copyAtFrame = useCallback((keyframes: TimelineKeyframe[], frame: number) => {
    const copied = copyKeyframesAtFrame(keyframes, frame);
    clipboard.current = { keyframes: copied, sourceFrame: frame };
    return copied;
  }, []);

  const pasteAtFrame = useCallback(
    (keyframes: TimelineKeyframe[], targetFrame: number, mirror = false) => {
      if (!clipboard.current) return keyframes;
      const next = mirror
        ? mirrorPasteKeyframes(
            keyframes,
            clipboard.current.keyframes,
            targetFrame,
            clipboard.current.sourceFrame
          )
        : pasteKeyframes(
            keyframes,
            clipboard.current.keyframes,
            targetFrame,
            clipboard.current.sourceFrame
          );
      return commit(next);
    },
    [commit]
  );

  return {
    canUndo: () => undo.current.canUndo(),
    canRedo: () => undo.current.canRedo(),
    commit,
    applyUndo,
    applyRedo,
    clearUndo: () => undo.current.clear(),
    copyAtFrame,
    pasteAtFrame,
    hasClipboard: () => clipboard.current !== null,
    clearTrack: (kf: TimelineKeyframe[], track: TimelineTrackId) => commit(clearTrack(kf, track)),
    clearAll: () => commit(clearAllKeyframes()),
    simplify: (kf: TimelineKeyframe[], track: TimelineTrackId, tol?: number) =>
      commit(simplifyTrack(kf, track, tol)),
    stretch: (kf: TimelineKeyframe[], factor: number, max: number) =>
      commit(timeStretchKeyframes(kf, factor, max)),
    moveKey: (kf: TimelineKeyframe[], track: TimelineTrackId, from: number, to: number) =>
      commit(moveKeyframe(kf, track, from, to)),
  };
}
