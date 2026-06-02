import type { CameraFramingMode, CameraMode, CameraSnapshot } from '../../types';
import { resolveCameraFramingFromModels } from '../../scene/cameraFraming';
import { buildShortCameraSnapshot } from '../camera/frameShortCamera';
import type { TemplateEngineBridge } from '../templates/TemplateManager';
import { durationSecToFrames } from '../templates/duration';

export interface ShortsPipelineBridge extends TemplateEngineBridge {
  flyToCamera: (snapshot: CameraSnapshot) => void;
  getFraming: () => CameraFramingMode;
  getManualCameraLock: () => boolean;
  preserveCharacterMotion: () => void;
  prepareShortCamera: () => void;
  setCameraMode: (mode: CameraMode) => void;
  patchCameraStudio: (patch: Record<string, unknown>) => void;
}

/**
 * Shorts pipeline — keeps VMD motion, uses free camera + product framing (no template hijack).
 */
export async function applyShortsPipeline(
  bridge: ShortsPipelineBridge,
  modelCount: number,
  durationSec: number
): Promise<{ maxFrames: number; framing: CameraFramingMode }> {
  const maxFrames = durationSecToFrames(durationSec);
  const framing = bridge.getFraming();

  if (bridge.getModelCount() === 0) {
    await bridge.loadDemo('party-dance');
  }

  bridge.setTimeline(maxFrames, 0, false);
  bridge.preserveCharacterMotion();
  bridge.prepareShortCamera();
  bridge.setCameraMode('free');

  bridge.setViewportFormat('9:16');
  bridge.setQualityMode('performance');
  bridge.patchVisualFx({
    bloomEnabled: false,
    dofEnabled: false,
    ssaoEnabled: false,
    godRaysEnabled: false,
    smaaEnabled: true,
    vignetteEnabled: true,
    vignetteIntensity: 0.2,
  });
  bridge.setPhysicsMode('playtime');

  bridge.patchCameraStudio({
    autoFocus: !bridge.getManualCameraLock(),
    manualCameraLock: bridge.getManualCameraLock(),
    focusTarget: framing === 'duo' ? 'full' : 'face',
    modestAngle: true,
    liveOrbit: false,
  });

  if (!bridge.getManualCameraLock()) {
    bridge.flyToCamera(buildShortCameraSnapshot(framing));
  }

  bridge.setTimeline(maxFrames, 0, true);
  return { maxFrames, framing };
}

export function resolveFramingFromModelCount(modelCount: number): CameraFramingMode {
  return modelCount >= 2 ? 'duo' : 'single';
}
