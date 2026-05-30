import {
  mergeCameraKeyframes,
} from '../components/CameraLogic';
import { mergeTimelineKeyframes } from '../components/TimelineLogic';
import type { AppState, MMDModel, SceneObject } from '../types';
import {
  getAnimationTemplate,
  visualFxFromTemplate,
  DEFAULT_VISUAL_FX,
} from '../templates/animationTemplates';
import { setPlayheadFrame } from '../utils/playhead';
import type { InstantDemoScene } from './types';

/**
 * Applies a motion template to app state in one pass (same rules as useTimeline.handleApplyTemplate).
 * Does not touch physics / mmdLite.
 */
export function applyInstantDemoState(
  prev: AppState,
  demo: InstantDemoScene,
  modelId: string,
  newModel: MMDModel,
  nonModelObjects: SceneObject[]
): AppState {
  const template = getAnimationTemplate(demo.templateId);
  const mode = demo.templateMode ?? 'replace';

  let next: AppState = {
    ...prev,
    models: [newModel],
    selectedObjectId: modelId,
    selectedBoneId: 'head',
    objects: [
      ...nonModelObjects,
      { id: modelId, name: demo.title, type: 'model', visible: true },
    ],
    cameraVmdBlobUrl: null,
    cameraVmdFileName: null,
    hasCameraVmd: false,
    currentFrame: 0,
    isPlaying: false,
  };

  if (!template) {
    setPlayheadFrame(0);
    return next;
  }

  let cameraKeyframes = next.cameraKeyframes;
  let cameraMode = next.cameraMode;
  let timelineActiveTrack = next.timelineActiveTrack;
  let models = next.models;
  let visualFx = next.visualFx;

  const incomingCamera = template.generateCameraKeyframes
    ? template.generateCameraKeyframes(next.maxFrames)
    : null;
  const incomingModel = template.generateModelKeyframes
    ? template.generateModelKeyframes(next.maxFrames)
    : null;

  if (incomingCamera) {
    cameraKeyframes =
      mode === 'merge'
        ? mergeCameraKeyframes(next.cameraKeyframes, incomingCamera)
        : incomingCamera;
    cameraMode = 'mmd';
    timelineActiveTrack = timelineActiveTrack ?? 'camera';
  }

  models = models.map((m) => {
    if (m.id !== modelId) return m;
    const patched: MMDModel = {
      ...m,
      activeTemplateId: demo.templateId,
      vmdPlaybackEnabled: false,
      hasVmdAnimation: false,
      vmdBlobUrls: undefined,
    };
    if (incomingModel) {
      patched.keyframes =
        mode === 'merge'
          ? mergeTimelineKeyframes(m.keyframes, incomingModel)
          : incomingModel;
    }
    return patched;
  });

  if (template.visualFx?.bloom) {
    visualFx = visualFxFromTemplate(template.visualFx);
  } else if (mode === 'replace') {
    visualFx = { ...DEFAULT_VISUAL_FX };
  }

  let maxFrames = next.maxFrames;
  if (incomingModel || incomingCamera) {
    const modelEnd = incomingModel?.reduce((max, k) => Math.max(max, k.frame), 0) ?? 0;
    const cameraEnd =
      incomingCamera?.reduce((max, k) => Math.max(max, k.frame), 0) ?? 0;
    const templateEnd = Math.max(10, modelEnd, cameraEnd);
    maxFrames = mode === 'replace' ? templateEnd : Math.max(next.maxFrames, templateEnd);
  }

  const autoPlay = Boolean(incomingModel);
  setPlayheadFrame(0);

  return {
    ...next,
    maxFrames,
    cameraKeyframes,
    cameraMode,
    timelineActiveTrack,
    models,
    visualFx,
    currentFrame: 0,
    isPlaying: autoPlay,
  };
}
