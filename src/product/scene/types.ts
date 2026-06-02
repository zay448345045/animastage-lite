import type {
  AppState,
  CameraFramingMode,
  CameraKeyframe,
  CameraMode,
  CharacterQuality,
  PhysicsMode,
  ViewportFormat,
  VisualFxSettings,
} from '../../types';

/** Product-level quality preset (maps to settings only — no engine changes). */
export type QualityMode = 'performance' | 'balanced' | 'quality';

export type CameraPresetId = 'orbit' | 'duo' | 'close-up' | 'follow';

export type FxQualityTier = 'high' | 'medium' | 'low';

/** Serialized scene document (.animastage). */
export interface AnimaStageScene {
  format: 'animastage';
  version: 2;
  name: string;
  savedAt: number;
  sourceDemoId?: string | null;
  models: AnimaStageModelEntry[];
  motions: AnimaStageMotionEntry[];
  camera: AnimaStageCameraBlock;
  fx: AnimaStageFxBlock;
  settings: AnimaStageSettingsBlock;
}

/** @deprecated alias */
export type AnimaStageProject = AnimaStageScene;

export interface AnimaStageModelEntry {
  id: string;
  name: string;
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

export interface SceneReadSnapshot {
  appState: AppState;
  viewportFormat: ViewportFormat;
  activeDemoId: string | null;
}
