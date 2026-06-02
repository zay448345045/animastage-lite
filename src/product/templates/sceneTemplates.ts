import type { ViewportFormat } from '../../types';
import type { QualityMode } from '../scene/types';
import { CAMERA_PRESET_CATALOG } from '../camera-presets/presets';
import {
  DEFAULT_TEMPLATE_DURATION_SEC,
  durationSecToFrames,
} from './duration';

/** Scene template = JSON config applied via TemplateManager + public APIs. */
export interface SceneTemplateDef {
  id: string;
  label: string;
  description: string;
  demoId: string;
  aspect: ViewportFormat;
  qualityMode: QualityMode;
  fxPresetId: 'safe' | 'balanced' | 'cinematic';
  cameraPresetKey: 'orbit' | 'duoFocus' | 'closeUp' | 'cinematicSweep';
  motionTemplateId: string;
  /** Timeline length in seconds (30 FPS). */
  durationSec?: number;
  /** Override frame count (optional). */
  maxFrames?: number;
}

export const SCENE_TEMPLATES: SceneTemplateDef[] = [
  {
    id: 'solo-dance',
    label: 'Solo Dance (50s)',
    description: 'Drone orbit + full-body dance — ~50 second roll',
    demoId: 'party-dance',
    aspect: '16:9',
    qualityMode: 'balanced',
    fxPresetId: 'balanced',
    cameraPresetKey: 'orbit',
    motionTemplateId: 'emote_party_dance',
    durationSec: DEFAULT_TEMPLATE_DURATION_SEC,
  },
  {
    id: 'duo-dance',
    label: 'Duo Dance (50s)',
    description: 'Duo wide + battle groove — two characters, 50s',
    demoId: 'party-dance',
    aspect: '16:9',
    qualityMode: 'balanced',
    fxPresetId: 'balanced',
    cameraPresetKey: 'duoFocus',
    motionTemplateId: 'emote_battle_highlight',
    durationSec: DEFAULT_TEMPLATE_DURATION_SEC,
  },
  {
    id: 'orbit-showcase',
    label: 'Orbit Showcase (50s)',
    description: 'Concert fly cam + hype bounce — cinematic minute',
    demoId: 'hype-bounce',
    aspect: '16:9',
    qualityMode: 'quality',
    fxPresetId: 'cinematic',
    cameraPresetKey: 'orbit',
    motionTemplateId: 'emote_concert_finale',
    durationSec: DEFAULT_TEMPLATE_DURATION_SEC,
  },
  {
    id: 'close-up-idol',
    label: 'Close-up Idol (50s)',
    description: 'Portrait + party dance — vertical-ready 50s',
    demoId: 'party-dance',
    aspect: '9:16',
    qualityMode: 'performance',
    fxPresetId: 'safe',
    cameraPresetKey: 'closeUp',
    motionTemplateId: 'emote_party_dance',
    durationSec: DEFAULT_TEMPLATE_DURATION_SEC,
  },
  {
    id: 'roller-minute',
    label: 'Roller Minute (50s)',
    description: 'Rollercoaster cam + side swing — high energy',
    demoId: 'hype-bounce',
    aspect: '16:9',
    qualityMode: 'balanced',
    fxPresetId: 'cinematic',
    cameraPresetKey: 'cinematicSweep',
    motionTemplateId: 'emote_roller_dance',
    durationSec: DEFAULT_TEMPLATE_DURATION_SEC,
  },
  {
    id: 'victory-sky',
    label: 'Victory Sky (50s)',
    description: 'Epic sky sweep + flex loops — showcase roll',
    demoId: 'party-dance',
    aspect: '16:9',
    qualityMode: 'quality',
    fxPresetId: 'cinematic',
    cameraPresetKey: 'cinematicSweep',
    motionTemplateId: 'emote_victory_royale',
    durationSec: DEFAULT_TEMPLATE_DURATION_SEC,
  },
  {
    id: 'vertical-minute',
    label: 'Vertical Minute (50s)',
    description: '9:16 close-up + concert energy — Shorts-ready',
    demoId: 'party-dance',
    aspect: '9:16',
    qualityMode: 'performance',
    fxPresetId: 'balanced',
    cameraPresetKey: 'closeUp',
    motionTemplateId: 'emote_concert_finale',
    durationSec: DEFAULT_TEMPLATE_DURATION_SEC,
  },
  {
    id: 'duo-wide-minute',
    label: 'Duo Wide Minute (50s)',
    description: 'Wide duo + hype bounce — 50s duet',
    demoId: 'party-dance',
    aspect: '16:9',
    qualityMode: 'balanced',
    fxPresetId: 'balanced',
    cameraPresetKey: 'duoFocus',
    motionTemplateId: 'emote_concert_finale',
    durationSec: DEFAULT_TEMPLATE_DURATION_SEC,
  },
];

export function getSceneTemplate(id: string): SceneTemplateDef | undefined {
  return SCENE_TEMPLATES.find((t) => t.id === id);
}

export function listSceneTemplates(): SceneTemplateDef[] {
  return SCENE_TEMPLATES;
}

export interface SceneTemplateApplyPlan {
  templateId: string;
  label: string;
  demoId: string;
  aspect: ViewportFormat;
  qualityMode: QualityMode;
  fxPresetId: SceneTemplateDef['fxPresetId'];
  cameraTemplateId: string;
  motionTemplateId: string;
  maxFrames: number;
  durationSec: number;
  autoplay: boolean;
}

export function buildSceneTemplatePlan(
  templateId: string,
  durationSec = DEFAULT_TEMPLATE_DURATION_SEC
): SceneTemplateApplyPlan | null {
  const tpl = getSceneTemplate(templateId);
  if (!tpl) return null;
  const cam = CAMERA_PRESET_CATALOG.find((p) => p.key === tpl.cameraPresetKey);
  const sec = tpl.durationSec ?? durationSec;
  const maxFrames = tpl.maxFrames ?? durationSecToFrames(sec);
  return {
    templateId: tpl.id,
    label: tpl.label,
    demoId: tpl.demoId,
    aspect: tpl.aspect,
    qualityMode: tpl.qualityMode,
    fxPresetId: tpl.fxPresetId,
    cameraTemplateId: cam?.templateId ?? 'cam_orbit_half',
    motionTemplateId: tpl.motionTemplateId,
    maxFrames,
    durationSec: sec,
    autoplay: true,
  };
}
