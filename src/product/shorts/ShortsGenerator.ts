import type { ViewportFormat } from '../../types';
import { SHORTS_DURATION_SEC, durationSecToFrames } from '../templates/duration';
import { applyShortsPipeline, type ShortsPipelineBridge } from './applyShortsPipeline';

export type ShortsPhase = 'idle' | 'generating' | 'preview' | 'export';

export interface ShortsGenerateResult {
  templateId: string;
  aspect: ViewportFormat;
  maxFrames: number;
  durationSec: number;
}

/**
 * TikTok-mode pipeline — keeps character VMD, product camera framing only.
 */
export class ShortsGenerator {
  phase: ShortsPhase = 'idle';

  async generate(
    bridge: ShortsPipelineBridge,
    modelCount: number,
    durationSec = SHORTS_DURATION_SEC
  ): Promise<ShortsGenerateResult> {
    this.phase = 'generating';
    const templateId = modelCount >= 2 ? 'duo-dance' : 'vertical-minute';
    const { maxFrames } = await applyShortsPipeline(bridge, modelCount, durationSec);

    this.phase = 'preview';
    return { templateId, aspect: '9:16', maxFrames, durationSec };
  }

  markExporting(): void {
    this.phase = 'export';
  }

  reset(): void {
    this.phase = 'idle';
  }
}

export const shortsGenerator = new ShortsGenerator();
