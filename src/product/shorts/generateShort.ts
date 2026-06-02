import { SHORTS_DURATION_SEC, durationSecToFrames } from '../templates/duration';

export interface CreateShortPlan {
  templateId: string;
  viewportFormat: '9:16';
  maxFrames: number;
  isPlaying: boolean;
  physicsMode: 'playtime';
  qualityMode: 'performance';
  durationSec: number;
}

/** Short pipeline — 9:16 + safe FX + vertical-friendly template. */
export function buildCreateShortPlan(
  modelCount: number,
  durationSec = SHORTS_DURATION_SEC
): CreateShortPlan {
  return {
    templateId: modelCount >= 2 ? 'duo-dance' : 'vertical-minute',
    viewportFormat: '9:16',
    maxFrames: durationSecToFrames(durationSec),
    isPlaying: true,
    physicsMode: 'playtime',
    qualityMode: 'performance',
    durationSec,
  };
}

/** @deprecated */
export const buildCreateShortPatch = buildCreateShortPlan;
