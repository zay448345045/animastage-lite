import type { ViewportFormat } from '../../types';
import type { QualityMode } from '../scene/types';
import { templateManager, type TemplateEngineBridge } from './TemplateManager';
import { DEFAULT_TEMPLATE_DURATION_SEC } from './duration';
import { getSceneTemplate } from './sceneTemplates';

/** CapCut-style template JSON (serializable). */
export interface TemplateJsonConfig {
  id: string;
  name: string;
  camera: string;
  motion: string;
  fx: 'safe' | 'balanced' | 'cinematic' | 'medium';
  aspect: ViewportFormat;
  duration: number;
  demoId?: string;
}

const MOTION_ALIASES: Record<string, string> = {
  dance_loop: 'emote_party_dance',
  dance: 'emote_party_dance',
  emote: 'emote_battle_highlight',
  concert: 'emote_concert_finale',
  roller: 'emote_roller_dance',
};

/** Built-in catalog in requested JSON shape. */
export const TEMPLATE_CATALOG: TemplateJsonConfig[] = [
  {
    id: 'duo-dance',
    name: 'Duo Dance',
    camera: 'duoFocus',
    motion: 'dance_loop',
    fx: 'medium',
    aspect: '9:16',
    duration: DEFAULT_TEMPLATE_DURATION_SEC,
    demoId: 'party-dance',
  },
  {
    id: 'solo-dance',
    name: 'Solo Dance',
    camera: 'orbit',
    motion: 'dance_loop',
    fx: 'medium',
    aspect: '16:9',
    duration: DEFAULT_TEMPLATE_DURATION_SEC,
    demoId: 'party-dance',
  },
  {
    id: 'orbit-showcase',
    name: 'Orbit Showcase',
    camera: 'orbit',
    motion: 'concert',
    fx: 'cinematic',
    aspect: '16:9',
    duration: DEFAULT_TEMPLATE_DURATION_SEC,
    demoId: 'hype-bounce',
  },
  {
    id: 'close-up-idol',
    name: 'Close-up Idol',
    camera: 'closeUp',
    motion: 'dance_loop',
    fx: 'safe',
    aspect: '9:16',
    duration: DEFAULT_TEMPLATE_DURATION_SEC,
    demoId: 'party-dance',
  },
  {
    id: 'roller-minute',
    name: 'Roller Minute',
    camera: 'cinematic',
    motion: 'roller',
    fx: 'cinematic',
    aspect: '16:9',
    duration: DEFAULT_TEMPLATE_DURATION_SEC,
    demoId: 'hype-bounce',
  },
  {
    id: 'vertical-minute',
    name: 'Vertical Minute',
    camera: 'closeUp',
    motion: 'concert',
    fx: 'medium',
    aspect: '9:16',
    duration: DEFAULT_TEMPLATE_DURATION_SEC,
    demoId: 'party-dance',
  },
];

function resolveMotionId(motion: string): string {
  return MOTION_ALIASES[motion] ?? motion;
}

function mapFx(fx: TemplateJsonConfig['fx']): 'safe' | 'balanced' | 'cinematic' {
  if (fx === 'medium') return 'balanced';
  return fx;
}

/**
 * TemplateEngine — CapCut-style JSON templates applied via public engine API only.
 */
export class TemplateEngine {
  private catalog: TemplateJsonConfig[];

  constructor(catalog: TemplateJsonConfig[] = TEMPLATE_CATALOG) {
    this.catalog = catalog;
  }

  list(): TemplateJsonConfig[] {
    return [...this.catalog];
  }

  get(id: string): TemplateJsonConfig | undefined {
    return this.catalog.find((t) => t.id === id);
  }

  async apply(templateId: string, bridge: TemplateEngineBridge): Promise<boolean> {
    const json = this.get(templateId);
    if (!json) {
      return templateManager.apply(templateId, bridge, DEFAULT_TEMPLATE_DURATION_SEC);
    }

    const sceneId = getSceneTemplate(json.id) ? json.id : templateId;
    const tpl = getSceneTemplate(sceneId);
    if (tpl) {
      await templateManager.apply(sceneId, bridge, json.duration);
      if (json.aspect !== tpl.aspect) {
        bridge.setViewportFormat(json.aspect);
      }
      return true;
    }

    bridge.setViewportFormat(json.aspect);
    bridge.setQualityMode(mapFx(json.fx) as QualityMode);
    bridge.applyMotionTemplate(resolveMotionId(json.motion));
    if (json.demoId && bridge.getModelCount() === 0) {
      await bridge.loadDemo(json.demoId);
    }
    bridge.setTimeline(Math.round(json.duration * 30), 0, true);
    return true;
  }
}

export const templateEngine = new TemplateEngine();
