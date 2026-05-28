import { useEffect } from 'react';
import { playheadRef, setPlayheadFrame } from '../utils/playhead';

export interface EditorKeyboardHandlers {
  onPlayPause: () => void;
  onStepFrame: (delta: number) => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onMirrorPaste: () => void;
  onDeleteKey: () => void;
  maxFrames: number;
  enabled?: boolean;
}

export function useEditorKeyboard({
  onPlayPause,
  onStepFrame,
  onJumpStart,
  onJumpEnd,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onMirrorPaste,
  onDeleteKey,
  maxFrames,
  enabled = true,
}: EditorKeyboardHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const mod = e.ctrlKey || e.metaKey;

      if (e.code === 'Space') {
        e.preventDefault();
        onPlayPause();
        return;
      }
      if (e.key === 'ArrowLeft' && !mod) {
        e.preventDefault();
        onStepFrame(e.shiftKey ? -10 : -1);
        return;
      }
      if (e.key === 'ArrowRight' && !mod) {
        e.preventDefault();
        onStepFrame(e.shiftKey ? 10 : 1);
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        onJumpStart();
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        onJumpEnd();
        return;
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo();
        return;
      }
      if (mod && e.key === 'c') {
        e.preventDefault();
        onCopy();
        return;
      }
      if (mod && e.key === 'v' && !e.shiftKey) {
        e.preventDefault();
        onPaste();
        return;
      }
      if (mod && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        onMirrorPaste();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDeleteKey();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    enabled,
    onPlayPause,
    onStepFrame,
    onJumpStart,
    onJumpEnd,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onMirrorPaste,
    onDeleteKey,
    maxFrames,
  ]);
}

export function stepPlayhead(delta: number, maxFrames: number): number {
  const next = Math.max(0, Math.min(maxFrames, playheadRef.current + delta));
  setPlayheadFrame(next);
  return next;
}
