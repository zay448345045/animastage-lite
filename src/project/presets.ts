import type { AppState } from '../types';
import type { CameraPresetId } from './types';

/** Camera preset → animation template id (camera track). */
export const CAMERA_PRESET_TEMPLATES: Record<CameraPresetId, string> = {
  orbit: 'cam_orbit_half',
  duo: 'cam_duo_wide',
  'close-up': 'cam_portrait_close',
  follow: 'cam_fly_drone',
};

/** Motion presets for quick scene setup. */
export const MOTION_PRESETS = {
  dance: 'emote_party_dance',
  emote: 'emote_battle_highlight',
  cinematic: 'cam_fly_epic',
} as const;

export type MotionPresetId = keyof typeof MOTION_PRESETS;

/** Scene presets bundle camera + motion + FX hints. */
export const SCENE_PRESETS = {
  'party-dance': {
    demoId: 'party-dance',
    camera: 'orbit' as CameraPresetId,
    motion: 'dance' as MotionPresetId,
    aspect: '16:9' as const,
  },
  'vertical-short': {
    demoId: 'party-dance',
    camera: 'close-up' as CameraPresetId,
    motion: 'dance' as MotionPresetId,
    aspect: '9:16' as const,
  },
  'duo-stage': {
    demoId: null,
    camera: 'duo' as CameraPresetId,
    motion: 'emote' as MotionPresetId,
    aspect: '16:9' as const,
  },
} as const;

export type ScenePresetId = keyof typeof SCENE_PRESETS;

export function pickCameraPresetForModelCount(count: number): CameraPresetId {
  if (count >= 2) return 'duo';
  return 'orbit';
}

export interface CreateShortOptions {
  durationSec?: number;
  motionPreset?: MotionPresetId;
}

/** One-click vertical short pipeline settings (caller applies to state). */
export function buildCreateShortPatch(
  modelCount: number,
  opts: CreateShortOptions = {}
): {
  viewportFormat: '9:16';
  maxFrames: number;
  isPlaying: boolean;
  physicsMode: AppState['physicsMode'];
  cameraPreset: CameraPresetId;
  motionTemplateId: string;
  qualityMode: 'performance';
} {
  const durationSec = opts.durationSec ?? 12;
  const motionKey = opts.motionPreset ?? 'dance';
  return {
    viewportFormat: '9:16',
    maxFrames: Math.round(durationSec * 30),
    isPlaying: true,
    physicsMode: 'playtime',
    cameraPreset: modelCount >= 2 ? 'duo' : 'close-up',
    motionTemplateId: MOTION_PRESETS[motionKey],
    qualityMode: 'performance',
  };
}
