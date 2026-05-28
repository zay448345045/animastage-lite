import { useCallback, useRef, useState } from 'react';
import { MMD_FPS, playheadRef, setPlayheadFrame } from '../utils/playhead';
import type { ViewportFormat } from '../types';
import {
  abortVideoRender,
  renderOfflineMp4,
  startLiveRecord,
  type LiveRecordHandle,
  type VideoRecordOptions,
  type VideoRecordProgress,
} from '../video/mmdVideoRecorder';
import { isRecordingCapture } from '../video/recordingCapture';

export interface UseVideoRecorderOptions {
  getCanvas: () => HTMLCanvasElement | null;
  invalidateScene?: () => void;
  maxFrames: number;
  viewportFormat: ViewportFormat;
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (playing: boolean) => void;
  loopIn?: number;
  loopOut?: number;
}

export function useVideoRecorder({
  getCanvas,
  invalidateScene,
  maxFrames,
  viewportFormat,
  setCurrentFrame,
  setIsPlaying,
  loopIn,
  loopOut,
}: UseVideoRecorderOptions) {
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'idle' | 'offline' | 'live'>('idle');
  const [progress, setProgress] = useState<VideoRecordProgress>({
    phase: 'idle',
    progress: 0,
    message: '',
  });

  const liveRef = useRef<LiveRecordHandle | null>(null);
  const liveEndFrameRef = useRef(0);
  const liveStartFrameRef = useRef(0);
  const savedPlayingRef = useRef(false);

  const buildOpts = useCallback(
    (partial?: Partial<VideoRecordOptions>): VideoRecordOptions => ({
      fps: MMD_FPS,
      bitrateMbps: viewportFormat === '9:16' ? 28 : 40,
      range: 'full',
      maxFrames,
      loopIn,
      loopOut,
      viewportFormat,
      ...partial,
    }),
    [maxFrames, viewportFormat, loopIn, loopOut]
  );

  const advanceFrame = useCallback(
    async (frame: number) => {
      setPlayheadFrame(frame);
      invalidateScene?.();
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    },
    [invalidateScene]
  );

  const stopLive = useCallback(() => {
    liveRef.current?.stop();
    liveRef.current = null;
    setMode('idle');
    setBusy(false);
    setIsPlaying(savedPlayingRef.current);
    setProgress({ phase: 'idle', progress: 0, message: '' });
  }, [setIsPlaying]);

  const startOffline = useCallback(async () => {
    const canvas = getCanvas();
    if (!canvas || busy) {
      if (busy) abortVideoRender();
      return;
    }

    setBusy(true);
    setMode('offline');
    savedPlayingRef.current = false;
    setIsPlaying(false);

    // Let React hide transform gizmos before the first captured frame.
    await new Promise<void>((r) => {
      requestAnimationFrame(() => requestAnimationFrame(() => r()));
    });

    const ok = await renderOfflineMp4(
      canvas,
      advanceFrame,
      buildOpts(),
      (p) => setProgress(p)
    );

    setBusy(false);
    setMode('idle');
    const endFrame = Math.max(0, maxFrames - 1);
    setPlayheadFrame(endFrame);
    setCurrentFrame(endFrame);
  }, [
    getCanvas,
    busy,
    advanceFrame,
    buildOpts,
    maxFrames,
    setCurrentFrame,
    setIsPlaying,
  ]);

  const startLive = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas || busy) return;

    const { start, end } = (() => {
      const max = Math.max(1, maxFrames);
      if (loopOut != null && loopIn != null && loopOut > loopIn) {
        return { start: Math.floor(loopIn), end: Math.min(max, Math.ceil(loopOut)) };
      }
      return { start: 0, end: max };
    })();

    liveStartFrameRef.current = start;
    liveEndFrameRef.current = end;

    savedPlayingRef.current = true;
    setBusy(true);
    setMode('live');

    void (async () => {
      await advanceFrame(start);
      await new Promise<void>((r) => {
        requestAnimationFrame(() => requestAnimationFrame(() => r()));
      });

      const handle = startLiveRecord(
        canvas,
        buildOpts({ bitrateMbps: viewportFormat === '9:16' ? 24 : 32 }),
        () => {
          liveRef.current = null;
          setMode('idle');
          setBusy(false);
          setIsPlaying(savedPlayingRef.current);
          setProgress({ phase: 'done', progress: 1, message: 'Recording saved' });
          setTimeout(() => setProgress({ phase: 'idle', progress: 0, message: '' }), 3000);
        }
      );

      if (!handle) {
        setBusy(false);
        setMode('idle');
        setProgress({
          phase: 'error',
          progress: 0,
          message: 'MediaRecorder is not supported',
        });
        return;
      }

      liveRef.current = handle;
      setIsPlaying(true);
      setProgress({ phase: 'render', progress: 0, message: 'Live recording…' });
    })();
  }, [
    getCanvas,
    busy,
    maxFrames,
    loopIn,
    loopOut,
    advanceFrame,
    buildOpts,
    viewportFormat,
    setIsPlaying,
  ]);

  /** Call each frame while live recording — stops at end frame. */
  const tickLiveRecord = useCallback(() => {
    if (mode !== 'live' || !liveRef.current) return;
    const end = liveEndFrameRef.current;
    const start = liveStartFrameRef.current;
    const t = playheadRef.current;
    const pct = (t - start) / Math.max(end - start, 1);
    setProgress({
      phase: 'render',
      progress: Math.min(1, pct),
      message: `Recording ${(t - start).toFixed(1)} / ${(end - start).toFixed(1)} s`,
    });
    if (t >= end - 0.05) {
      stopLive();
    }
  }, [mode, stopLive]);

  const cancel = useCallback(() => {
    if (mode === 'offline') abortVideoRender();
    else if (mode === 'live') stopLive();
  }, [mode, stopLive]);

  return {
    busy,
    mode,
    progress,
    isRecording: busy || isRecordingCapture(),
    startOffline,
    startLive,
    stopLive,
    cancel,
    tickLiveRecord,
  };
}
