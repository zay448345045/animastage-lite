/**
 * Video → timeline keyframes via MediaPipe Pose Landmarker (browser).
 * Lite mapping to AnimaStage timeline tracks (not full VMD skeleton).
 */
import type { TimelineKeyframe } from '../types';
import { MMD_FPS } from '../utils/playhead';

export interface MocapProgress {
  phase: 'idle' | 'loading' | 'processing' | 'done' | 'error';
  progress: number;
  message: string;
}

type PoseLandmarker = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number
  ) => { landmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number }>> };
  close: () => void;
};

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const { PoseLandmarker, FilesetResolver } = vision;
      const wasm = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      return PoseLandmarker.createFromOptions(wasm, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      }) as Promise<PoseLandmarker>;
    })();
  }
  return landmarkerPromise;
}

function createKeyframeId(): string {
  return `mocap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function landmarksToTracks(
  lm: Array<{ x: number; y: number; visibility?: number }>,
  frame: number
): TimelineKeyframe[] {
  const vis = (i: number) => (lm[i]?.visibility ?? 1) > 0.4;
  const keys: TimelineKeyframe[] = [];

  if (vis(0) && lm[0]) {
    keys.push({
      id: createKeyframeId(),
      frame,
      track: 'bone_head_y',
      value: (lm[0].x - 0.5) * 40,
    });
  }

  const lShoulder = lm[11];
  const rShoulder = lm[12];
  const lElbow = lm[13];
  const rElbow = lm[14];

  if (lShoulder && lElbow && vis(11) && vis(13)) {
    const angle = Math.atan2(lElbow.y - lShoulder.y, lElbow.x - lShoulder.x);
    keys.push({
      id: createKeyframeId(),
      frame,
      track: 'bone_l_arm_z',
      value: (angle * 180) / Math.PI,
    });
  }
  if (rShoulder && rElbow && vis(12) && vis(14)) {
    const angle = Math.atan2(rElbow.y - rShoulder.y, rElbow.x - rShoulder.x);
    keys.push({
      id: createKeyframeId(),
      frame,
      track: 'bone_r_arm_z',
      value: (-angle * 180) / Math.PI,
    });
  }

  if (lShoulder && rShoulder && vis(11) && vis(12)) {
    const lean = ((lShoulder.y + rShoulder.y) / 2 - 0.45) * 60;
    keys.push({
      id: createKeyframeId(),
      frame,
      track: 'bone_spine_z',
      value: lean,
    });
  }

  return keys;
}

export async function extractMocapFromVideo(
  file: File,
  onProgress?: (p: MocapProgress) => void
): Promise<TimelineKeyframe[]> {
  onProgress?.({ phase: 'loading', progress: 0, message: 'Loading MediaPipe…' });

  const landmarker = await getPoseLandmarker();
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Could not open video'));
  });

  const duration = video.duration;
  const sampleFps = Math.min(MMD_FPS, 24);
  const step = 1 / sampleFps;
  const allKeys: TimelineKeyframe[] = [];
  let t = 0;
  let i = 0;
  const total = Math.ceil(duration * sampleFps);

  onProgress?.({ phase: 'processing', progress: 0, message: `Frames 0 / ${total}` });

  while (t < duration) {
    video.currentTime = t;
    await new Promise<void>((r) => {
      video.onseeked = () => r();
    });

    const result = landmarker.detectForVideo(video, performance.now());
    const pose = result.landmarks?.[0];
    if (pose) {
      const frame = Math.round(t * MMD_FPS);
      allKeys.push(...landmarksToTracks(pose, frame));
    }

    i += 1;
    if (i % 3 === 0 || t + step >= duration) {
      onProgress?.({
        phase: 'processing',
        progress: i / total,
        message: `Frames ${i} / ${total}`,
      });
    }
    t += step;
  }

  URL.revokeObjectURL(url);
  try {
    landmarker.close?.();
  } catch {
    /* ignore */
  }
  landmarkerPromise = null;

  onProgress?.({ phase: 'done', progress: 1, message: `Done — ${allKeys.length} keys` });
  return allKeys.sort((a, b) => a.frame - b.frame || a.track.localeCompare(b.track));
}
