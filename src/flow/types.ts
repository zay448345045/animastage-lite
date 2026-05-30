import type { AppState, ViewportFormat } from '../types';

export type StudioUiMode = 'beginner' | 'pro';

/** How the user entered the studio from marketing. */
export type StudioEntryFlow = 'default' | 'demo' | 'upload' | 'creator';

export interface ExportResultPayload {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

/** Serializable slice — user re-uploads PMX to restore meshes. */
export interface SavedProjectV1 {
  version: 1;
  name: string;
  savedAt: number;
  maxFrames: number;
  currentFrame: number;
  viewportFormat: ViewportFormat;
  cameraMode: AppState['cameraMode'];
  cameraKeyframes: AppState['cameraKeyframes'];
  visualFx: AppState['visualFx'];
  characterQuality: AppState['characterQuality'];
  physicsMode: AppState['physicsMode'];
  mmdLite: AppState['mmdLite'];
  models: Array<{
    name: string;
    keyframes: AppState['models'][0]['keyframes'];
    morphs: AppState['models'][0]['morphs'];
    bones: AppState['models'][0]['bones'];
    activeTemplateId: string | null;
    positionX: number;
    positionY: number;
    positionZ: number;
  }>;
}
