import type {
  AppState,
  CameraFramingMode,
  CameraKeyframe,
  CameraMode,
  CharacterQuality,
  PhysicsMode,
  ViewportFormat,
  VisualFxSettings,
} from '../types';

/** Product-level quality preset (maps to GPU / FX / physics). */
export type QualityMode = 'performance' | 'balanced' | 'quality';

/** Shareable camera preset ids (maps to templates + framing). */
export type CameraPresetId = 'orbit' | 'duo' | 'close-up' | 'follow';

export type FxQualityTier = 'high' | 'medium' | 'low';

/** AnimaStage project file (.animastage) — v2. */
export interface AnimaStageProject {
  format: 'animastage';
  version: 2;
  name: string;
  savedAt: number;
  /** When scene came from a built-in demo pack — viewer can restore meshes. */
  sourceDemoId?: string | null;
  models: AnimaStageModelEntry[];
  motions: AnimaStageMotionEntry[];
  camera: AnimaStageCameraBlock;
  fx: AnimaStageFxBlock;
  settings: AnimaStageSettingsBlock;
}

export interface AnimaStageModelEntry {
  id: string;
  name: string;
  /** Public asset URL when available (demo CDN). */
  url?: string;
  modelFileName?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  keyframes: AppState['models'][0]['keyframes'];
  morphs: AppState['models'][0]['morphs'];
  bones: AppState['models'][0]['bones'];
  activeTemplateId: string | null;
}

export interface AnimaStageMotionEntry {
  modelId: string;
  modelIndex: number;
  /** Primary VMD file name (legacy single-field). */
  vmd: string;
  vmdFileNames: string[];
  activeVmdIndex: number;
  timeOffset: number;
}

export interface AnimaStageCameraBlock {
  preset: CameraPresetId;
  mode: CameraMode;
  framing: CameraFramingMode;
  keyframes: CameraKeyframe[];
  cameraVmdFileName: string | null;
}

export interface AnimaStageFxBlock {
  quality: FxQualityTier;
  bloom: boolean;
  dof: boolean;
  visualFx: VisualFxSettings;
  rtxModeEnabled: boolean;
}

export interface AnimaStageSettingsBlock {
  aspect: ViewportFormat;
  quality: QualityMode;
  physicsMode: PhysicsMode;
  characterQuality: CharacterQuality;
  maxFrames: number;
  currentFrame: number;
  mmdLite: AppState['mmdLite'];
}
