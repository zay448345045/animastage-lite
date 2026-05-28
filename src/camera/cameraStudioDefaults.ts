import type { CameraStudioSettings } from '../types';

export const DEFAULT_CAMERA_STUDIO: CameraStudioSettings = {
  autoFocus: true,
  focusTarget: 'body',
  modestAngle: true,
  orbitPreset: 'manual',
  orbitSpeed: 1,
  backgroundImageUrl: null,
  backgroundOpacity: 1,
  backgroundBlur: 0,
  liveOrbit: false,
};
