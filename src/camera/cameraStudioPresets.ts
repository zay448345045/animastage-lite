import type { CameraKeyframe, CameraSnapshot, CameraOrbitPresetId, VisualFxSettings } from '../types';
import { orbitCameraSnapshot } from '../templates/animationTemplates';

export interface CameraStudioPresetDef {
  id: CameraOrbitPresetId;
  label: string;
  description: string;
  focusTarget?: 'face' | 'body' | 'full';
  bloom?: Partial<VisualFxSettings>;
  samples: Array<{ t: number; distance: number; yaw: number; pitch: number; fov: number }>;
}

function camKey(frame: number, snap: CameraSnapshot): CameraKeyframe {
  return {
    id: `studio_${frame}_${Math.random().toString(36).slice(2, 7)}`,
    frame,
    position: [...snap.position],
    rotation: [...snap.rotation],
    fov: snap.fov,
  };
}

function pathFromSamples(
  maxFrames: number,
  samples: CameraStudioPresetDef['samples'],
  target: [number, number, number]
): CameraKeyframe[] {
  return samples
    .map(({ t, distance, yaw, pitch, fov }) => {
      const frame = Math.max(0, Math.round(t * maxFrames));
      const snap = orbitCameraSnapshot(distance, yaw, pitch, fov, target);
      return camKey(frame, snap);
    })
    .sort((a, b) => a.frame - b.frame);
}

export const CAMERA_STUDIO_PRESETS: CameraStudioPresetDef[] = [
  {
    id: 'manual',
    label: 'Manual',
    description: 'Free orbit with auto-focus only.',
    samples: [{ t: 0, distance: 24, yaw: 0, pitch: 10, fov: 45 }],
  },
  {
    id: 'orbit360',
    label: 'Orbit 360°',
    description: 'Full circle around the character.',
    focusTarget: 'body',
    bloom: { bloomEnabled: true, bloomIntensity: 0.55, bloomThreshold: 0.72 },
    samples: [
      { t: 0, distance: 26, yaw: 0, pitch: 12, fov: 42 },
      { t: 0.25, distance: 26, yaw: 90, pitch: 14, fov: 42 },
      { t: 0.5, distance: 26, yaw: 180, pitch: 12, fov: 42 },
      { t: 0.75, distance: 26, yaw: 270, pitch: 14, fov: 42 },
      { t: 1, distance: 26, yaw: 360, pitch: 12, fov: 42 },
    ],
  },
  {
    id: 'orbit180',
    label: 'Orbit 180°',
    description: 'Front half-circle showcase.',
    focusTarget: 'body',
    bloom: { bloomEnabled: true, bloomIntensity: 0.48, bloomThreshold: 0.75 },
    samples: [
      { t: 0, distance: 24, yaw: -90, pitch: 10, fov: 44 },
      { t: 0.33, distance: 22, yaw: -30, pitch: 8, fov: 42 },
      { t: 0.66, distance: 22, yaw: 30, pitch: 8, fov: 42 },
      { t: 1, distance: 24, yaw: 90, pitch: 10, fov: 44 },
    ],
  },
  {
    id: 'orbit180_slow',
    label: 'Orbit 180° (slow)',
    description: 'Wide slow arc with soft bloom.',
    focusTarget: 'full',
    bloom: { bloomEnabled: true, bloomIntensity: 0.62, bloomThreshold: 0.68, vignetteEnabled: true, vignetteIntensity: 0.35 },
    samples: [
      { t: 0, distance: 30, yaw: -110, pitch: 6, fov: 40 },
      { t: 0.5, distance: 28, yaw: 0, pitch: 5, fov: 38 },
      { t: 1, distance: 30, yaw: 110, pitch: 6, fov: 40 },
    ],
  },
  {
    id: 'face_portrait',
    label: 'Face portrait',
    description: 'Close-up on face with portrait bloom.',
    focusTarget: 'face',
    bloom: { bloomEnabled: true, bloomIntensity: 0.7, bloomThreshold: 0.6, dofEnabled: true, dofFocusDistance: 0.02, dofBokehScale: 2.4 },
    samples: [
      { t: 0, distance: 12, yaw: 0, pitch: 2, fov: 35 },
      { t: 0.5, distance: 11, yaw: 8, pitch: 1, fov: 32 },
      { t: 1, distance: 12, yaw: -8, pitch: 2, fov: 35 },
    ],
  },
  {
    id: 'full_body',
    label: 'Full body',
    description: 'Head-to-toe framing.',
    focusTarget: 'full',
    bloom: { bloomEnabled: true, bloomIntensity: 0.4, bloomThreshold: 0.8 },
    samples: [
      { t: 0, distance: 32, yaw: 15, pitch: 4, fov: 48 },
      { t: 1, distance: 32, yaw: -15, pitch: 4, fov: 48 },
    ],
  },
  {
    id: 'dramatic_bloom',
    label: 'Drama + bloom',
    description: 'Static cinematic angle with strong bloom.',
    focusTarget: 'body',
    bloom: {
      bloomEnabled: true,
      bloomIntensity: 0.85,
      bloomThreshold: 0.55,
      vignetteEnabled: true,
      vignetteIntensity: 0.5,
      chromaticAberration: 0.0012,
    },
    samples: [
      { t: 0, distance: 20, yaw: 35, pitch: 6, fov: 38 },
      { t: 1, distance: 20, yaw: 35, pitch: 6, fov: 38 },
    ],
  },
  {
    id: 'hero_low',
    label: 'Hero (safe low)',
    description: 'Low angle without going under the model.',
    focusTarget: 'body',
    bloom: { bloomEnabled: true, bloomIntensity: 0.5, bloomThreshold: 0.7 },
    samples: [
      { t: 0, distance: 22, yaw: 20, pitch: -4, fov: 42 },
      { t: 0.5, distance: 21, yaw: 0, pitch: -3, fov: 40 },
      { t: 1, distance: 22, yaw: -20, pitch: -4, fov: 42 },
    ],
  },
];

export function getCameraStudioPreset(id: CameraOrbitPresetId): CameraStudioPresetDef | undefined {
  return CAMERA_STUDIO_PRESETS.find((p) => p.id === id);
}

export function buildPresetCameraKeyframes(
  presetId: CameraOrbitPresetId,
  maxFrames: number,
  target: [number, number, number]
): CameraKeyframe[] {
  const preset = getCameraStudioPreset(presetId);
  if (!preset || preset.id === 'manual') return [];
  return pathFromSamples(maxFrames, preset.samples, target);
}

export function getPresetBloomPatch(presetId: CameraOrbitPresetId): Partial<VisualFxSettings> | null {
  const preset = getCameraStudioPreset(presetId);
  return preset?.bloom ?? null;
}
