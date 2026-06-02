/**
 * MP4 export — WebCodecs + mp4-muxer (mmd_rtx renderOfflineMp4) with MediaRecorder fallback.
 */
import { MMD_FPS } from '../utils/playhead';
import {
  SHORTS_EXPORT_HEIGHT,
  SHORTS_EXPORT_WIDTH,
  VIEWPORT_916_HEIGHT,
  VIEWPORT_916_WIDTH,
} from '../utils/viewportFormat';
import type { ViewportFormat } from '../types';
import { beginRecordingCapture, endRecordingCapture } from './recordingCapture';

export type VideoRecordRange = 'full' | 'timeline';

export interface VideoRecordOptions {
  fps?: number;
  bitrateMbps?: number;
  range?: VideoRecordRange;
  viewportFormat?: ViewportFormat;
  maxFrames: number;
  loopIn?: number;
  loopOut?: number;
}

export interface VideoRecordProgress {
  phase: 'idle' | 'render' | 'finalize' | 'done' | 'cancelled' | 'error';
  progress: number;
  message: string;
}

export type FrameAdvanceCallback = (frame: number) => void | Promise<void>;

/** Recreate encoder before Chrome reclaims it (~60s without encode calls). */
const ENCODER_IDLE_RECYCLE_MS = 45_000;

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

function timestampName(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function resolveFrameRange(
  opts: VideoRecordOptions
): { start: number; end: number } {
  const max = Math.max(1, opts.maxFrames);
  if (opts.range === 'timeline' && opts.loopOut != null && opts.loopIn != null && opts.loopOut > opts.loopIn) {
    return {
      start: Math.max(0, Math.floor(opts.loopIn)),
      end: Math.min(max, Math.ceil(opts.loopOut)),
    };
  }
  return { start: 0, end: max };
}

function exportDimensions(
  canvas: HTMLCanvasElement,
  format: ViewportFormat
): { width: number; height: number } {
  if (format === '9:16') {
    return { width: SHORTS_EXPORT_WIDTH, height: SHORTS_EXPORT_HEIGHT };
  }
  return { width: canvas.width, height: canvas.height };
}

async function pickH264Codec(
  w: number,
  h: number,
  bitrate: number,
  fps: number
): Promise<string | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  const candidates = ['avc1.640028', 'avc1.4d002a', 'avc1.42E01E'];
  for (const codec of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec,
        width: w,
        height: h,
        bitrate,
        framerate: fps,
      });
      if (support.supported) return codec;
    } catch {
      /* try next */
    }
  }
  return null;
}

function pickRecorderMime(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return '';
}

function waitFrames(n: number): Promise<void> {
  return new Promise((resolve) => {
    let c = 0;
    const tick = () => {
      c += 1;
      if (c >= n) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function captureVideoFrame(
  canvas: HTMLCanvasElement,
  targetW: number,
  targetH: number,
  timestamp: number
): VideoFrame {
  if (canvas.width === targetW && canvas.height === targetH) {
    return new VideoFrame(canvas, { timestamp });
  }
  const oc = new OffscreenCanvas(targetW, targetH);
  const ctx = oc.getContext('2d');
  if (!ctx) {
    return new VideoFrame(canvas, { timestamp });
  }
  ctx.drawImage(canvas, 0, 0, targetW, targetH);
  return new VideoFrame(oc, { timestamp });
}

function isCodecReclaimedError(e: unknown): boolean {
  if (!(e instanceof DOMException)) {
    if (e instanceof Error) {
      return /reclaimed|inactivity|QuotaExceeded/i.test(e.message);
    }
    return false;
  }
  return (
    e.name === 'QuotaExceededError' ||
    /reclaimed|inactivity/i.test(e.message)
  );
}

async function drainEncoder(encoder: VideoEncoder, maxSpins = 12_000): Promise<void> {
  if (encoder.state === 'closed') return;
  let spins = 0;
  while (encoder.encodeQueueSize > 0 && spins < maxSpins) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    spins += 1;
  }
}

type MuxerLike = import('mp4-muxer').Muxer<import('mp4-muxer').ArrayBufferTarget>;

interface EncoderBundle {
  encoder: VideoEncoder;
  lastEncodeAt: number;
  fatalError: Error | null;
}

function createEncoderBundle(
  muxer: MuxerLike,
  config: VideoEncoderConfig
): EncoderBundle {
  const bundle: EncoderBundle = {
    encoder: null as unknown as VideoEncoder,
    lastEncodeAt: Date.now(),
    fatalError: null,
  };
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      bundle.fatalError = e instanceof Error ? e : new Error(String(e));
    },
  });
  encoder.configure(config);
  bundle.encoder = encoder;
  return bundle;
}

function closeEncoderSafe(encoder: VideoEncoder | undefined): void {
  if (!encoder || encoder.state === 'closed') return;
  try {
    encoder.close();
  } catch {
    /* ignore */
  }
}

async function flushEncoderSafe(encoder: VideoEncoder): Promise<void> {
  if (encoder.state === 'closed') return;
  try {
    await encoder.flush();
  } catch {
    /* ignore — may already be closed after reclaim */
  }
}

async function recycleEncoder(
  bundle: EncoderBundle,
  muxer: MuxerLike,
  config: VideoEncoderConfig
): Promise<EncoderBundle> {
  await drainEncoder(bundle.encoder);
  await flushEncoderSafe(bundle.encoder);
  closeEncoderSafe(bundle.encoder);
  return createEncoderBundle(muxer, config);
}

function encoderNeedsRecycle(bundle: EncoderBundle): boolean {
  if (bundle.encoder.state === 'closed') return true;
  if (bundle.fatalError) return true;
  return Date.now() - bundle.lastEncodeAt > ENCODER_IDLE_RECYCLE_MS;
}

/**
 * Encode one frame; always closes VideoFrame. Recreates encoder if codec was reclaimed.
 */
async function encodeCapturedFrame(
  bundle: EncoderBundle,
  muxer: MuxerLike,
  config: VideoEncoderConfig,
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
  timestamp: number,
  requestKeyFrame: boolean
): Promise<{ bundle: EncoderBundle; keyFrame: boolean }> {
  let keyFrame = requestKeyFrame;
  let active = bundle;

  if (encoderNeedsRecycle(active)) {
    active = await recycleEncoder(active, muxer, config);
    keyFrame = true;
  }

  let vf: VideoFrame | null = null;
  try {
    vf = captureVideoFrame(canvas, w, h, timestamp);

    const runEncode = () => {
      if (active.encoder.state === 'closed') {
        throw new DOMException('VideoEncoder closed', 'InvalidStateError');
      }
      if (active.fatalError) {
        throw active.fatalError;
      }
      active.encoder.encode(vf!, { keyFrame });
    };

    try {
      runEncode();
    } catch (e) {
      if (!isCodecReclaimedError(e)) throw e;
      active = await recycleEncoder(active, muxer, config);
      keyFrame = true;
      runEncode();
    }

    await drainEncoder(active.encoder);
    active.lastEncodeAt = Date.now();
    active.fatalError = null;
    return { bundle: active, keyFrame: false };
  } finally {
    try {
      vf?.close();
    } catch {
      /* ignore */
    }
  }
}

let abortFlag = false;

export function abortVideoRender(): void {
  abortFlag = true;
}

export function isVideoRenderAborted(): boolean {
  return abortFlag;
}

/**
 * Offline frame-by-frame MP4 (HQ) — one WebCodecs encode per timeline frame.
 */
export async function renderOfflineMp4(
  canvas: HTMLCanvasElement,
  onAdvanceFrame: FrameAdvanceCallback,
  opts: VideoRecordOptions,
  onProgress?: (p: VideoRecordProgress) => void
): Promise<boolean> {
  abortFlag = false;
  const fps = Math.max(1, Math.min(60, opts.fps ?? MMD_FPS));
  const bitrate = Math.max(8_000_000, Math.min(80_000_000, (opts.bitrateMbps ?? 35) * 1_000_000));
  const { start, end } = resolveFrameRange(opts);
  const totalFrames = Math.max(1, end - start);
  const format = opts.viewportFormat ?? '16:9';
  const { width: w, height: h } = exportDimensions(canvas, format);

  const codec = await pickH264Codec(w, h, bitrate, fps);
  if (!codec) {
    onProgress?.({ phase: 'error', progress: 0, message: 'WebCodecs H.264 unavailable — use Live record (Chrome/Edge).' });
    return false;
  }

  let Muxer: typeof import('mp4-muxer').Muxer;
  let ArrayBufferTarget: typeof import('mp4-muxer').ArrayBufferTarget;
  try {
    const mod = await import('mp4-muxer');
    Muxer = mod.Muxer;
    ArrayBufferTarget = mod.ArrayBufferTarget;
  } catch {
    onProgress?.({ phase: 'error', progress: 0, message: 'mp4-muxer failed to load.' });
    return false;
  }

  beginRecordingCapture();
  onProgress?.({ phase: 'render', progress: 0, message: `Frames 0 / ${totalFrames}` });

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: w, height: h },
    fastStart: 'in-memory',
  });

  const encoderConfig: VideoEncoderConfig = {
    codec,
    width: w,
    height: h,
    bitrate,
    framerate: fps,
    latencyMode: 'quality',
    hardwareAcceleration: 'prefer-hardware',
  };

  let bundle: EncoderBundle;
  try {
    bundle = createEncoderBundle(muxer, encoderConfig);
  } catch (e) {
    endRecordingCapture();
    onProgress?.({
      phase: 'error',
      progress: 0,
      message: `Encoder: ${(e as Error).message}`,
    });
    return false;
  }

  let needKeyFrame = true;

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (abortFlag) break;
      const frame = start + i;
      await onAdvanceFrame(frame);
      await waitFrames(1);

      const timestamp = Math.round(i * (1_000_000 / fps));
      const keyFrameRequest = needKeyFrame || i === 0 || i % (fps * 2) === 0;
      const result = await encodeCapturedFrame(
        bundle,
        muxer,
        encoderConfig,
        canvas,
        w,
        h,
        timestamp,
        keyFrameRequest
      );
      bundle = result.bundle;
      needKeyFrame = result.keyFrame;

      const pct = (i + 1) / totalFrames;
      if (i % 2 === 0 || i === totalFrames - 1) {
        onProgress?.({
          phase: 'render',
          progress: pct,
          message: `Frames ${i + 1} / ${totalFrames} (${Math.round(pct * 100)}%)`,
        });
      }
    }

    if (!abortFlag) {
      onProgress?.({ phase: 'finalize', progress: 0.98, message: 'Muxing MP4…' });
      await drainEncoder(bundle.encoder);
      await flushEncoderSafe(bundle.encoder);
      closeEncoderSafe(bundle.encoder);
      muxer.finalize();
      const buffer = muxer.target.buffer;
      downloadBlob(new Blob([buffer], { type: 'video/mp4' }), `mmd-render-${timestampName()}.mp4`);
      onProgress?.({
        phase: 'done',
        progress: 1,
        message: `Done — ${totalFrames} frames @ ${fps} FPS`,
      });
    } else {
      await drainEncoder(bundle.encoder);
      closeEncoderSafe(bundle.encoder);
      onProgress?.({ phase: 'cancelled', progress: 0, message: 'Cancelled' });
    }
  } catch (e) {
    closeEncoderSafe(bundle.encoder);
    const msg = isCodecReclaimedError(e)
      ? 'Export stopped — video codec was reclaimed. Keep the tab focused and try again, or use a shorter duration.'
      : (e as Error).message;
    onProgress?.({ phase: 'error', progress: 0, message: msg });
    endRecordingCapture();
    return false;
  } finally {
    endRecordingCapture();
  }

  return !abortFlag;
}

export interface LiveRecordHandle {
  stop: () => void;
  mime: string;
}

/**
 * Real-time capture via canvas.captureStream + MediaRecorder (mmd_rtx startLiveRecord).
 */
export function startLiveRecord(
  canvas: HTMLCanvasElement,
  opts: VideoRecordOptions,
  onStop?: (blob: Blob, ext: string) => void
): LiveRecordHandle | null {
  const mime = pickRecorderMime();
  if (!mime || typeof MediaRecorder === 'undefined') {
    return null;
  }

  const fps = Math.max(1, Math.min(60, opts.fps ?? MMD_FPS));
  const bitrate = Math.max(4_000_000, (opts.bitrateMbps ?? 28) * 1_000_000);
  const stream = canvas.captureStream(fps);

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
  } catch {
    try {
      recorder = new MediaRecorder(stream, { videoBitsPerSecond: bitrate });
    } catch {
      return null;
    }
  }

  const chunks: Blob[] = [];
  const finalMime = recorder.mimeType || mime;
  const ext = finalMime.includes('mp4') ? 'mp4' : 'webm';

  recorder.ondataavailable = (e) => {
    if (e.data?.size) chunks.push(e.data);
  };
  recorder.onstop = () => {
    endRecordingCapture();
    stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks, { type: finalMime });
    downloadBlob(blob, `mmd-record-${timestampName()}.${ext}`);
    onStop?.(blob, ext);
  };

  beginRecordingCapture();
  recorder.start(250);

  return {
    mime: finalMime,
    stop: () => {
      if (recorder.state !== 'inactive') recorder.stop();
    },
  };
}

export function getPreviewExportSize(format: ViewportFormat): { width: number; height: number } {
  if (format === '9:16') {
    return { width: VIEWPORT_916_WIDTH, height: VIEWPORT_916_HEIGHT };
  }
  return { width: 1920, height: 1080 };
}
