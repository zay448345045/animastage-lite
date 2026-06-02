import { buildSceneTemplatePlan, getSceneTemplate, type SceneTemplateApplyPlan } from './sceneTemplates';
import { DEFAULT_TEMPLATE_DURATION_SEC } from './duration';
import { getFxPreset } from './fxPresets';
import type { ViewportFormat } from '../../types';
import type { QualityMode } from '../scene/types';

/** Public engine API surface — product layer only calls these. */
export interface TemplateEngineBridge {
  getModelCount: () => number;
  setViewportFormat: (format: ViewportFormat) => void;
  setQualityMode: (mode: QualityMode) => void;
  patchVisualFx: (patch: Record<string, unknown>) => void;
  applyMotionTemplate: (templateId: string) => void;
  applyCameraTemplate: (templateId: string) => void;
  setTimeline: (maxFrames: number, currentFrame: number, isPlaying: boolean) => void;
  setPhysicsMode: (mode: 'anytime' | 'playtime' | 'off') => void;
  loadDemo: (demoId: string) => Promise<void>;
}

/**
 * TemplateManager — orchestrates camera, FX, motion, and timeline via API only.
 * Never imports VMD, physics, or render internals.
 */
export class TemplateManager {
  async apply(
    templateId: string,
    bridge: TemplateEngineBridge,
    durationSec = DEFAULT_TEMPLATE_DURATION_SEC
  ): Promise<boolean> {
    const plan = buildSceneTemplatePlan(templateId, durationSec);
    if (!plan) return false;
    await this.applyPlan(plan, bridge);
    return true;
  }

  async applyPlan(plan: SceneTemplateApplyPlan, bridge: TemplateEngineBridge): Promise<void> {
    if (bridge.getModelCount() === 0) {
      await bridge.loadDemo(plan.demoId);
    }

    const fx = getFxPreset(plan.fxPresetId);
    if (fx) {
      bridge.setQualityMode(fx.qualityMode);
      bridge.patchVisualFx(fx.visualFxPatch);
    } else {
      bridge.setQualityMode(plan.qualityMode);
    }

    bridge.setViewportFormat(plan.aspect);
    // Set timeline length first so motion/camera keyframes fill the full roll.
    bridge.setTimeline(plan.maxFrames, 0, false);
    bridge.applyMotionTemplate(plan.motionTemplateId);
    bridge.applyCameraTemplate(plan.cameraTemplateId);
    bridge.setPhysicsMode('playtime');
    bridge.setTimeline(plan.maxFrames, 0, plan.autoplay);
  }

  getTemplate(id: string) {
    return getSceneTemplate(id);
  }

  pickShortTemplate(modelCount: number): string {
    return modelCount >= 2 ? 'duo-dance' : 'solo-dance';
  }
}

export const templateManager = new TemplateManager();
