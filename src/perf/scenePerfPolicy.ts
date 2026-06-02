import type { AppState, ViewportFormat } from '../types';
import { isPortraitFormat } from '../utils/characterQuality';

/** True when timeline template drives the active model (dance / emote presets). */
export function isTemplateMotionActive(appState: AppState): boolean {
  const model =
    appState.models.find((m) => m.id === appState.selectedObjectId) ??
    appState.models[0];
  return Boolean(model?.activeTemplateId);
}

/** N8AO is too heavy for 9:16 preview — RTX in portrait = grading + SMAA only. */
export function shouldUsePortraitRtxAo(
  viewportFormat: ViewportFormat,
  rtxEnabled: boolean
): boolean {
  if (!rtxEnabled) return false;
  return !isPortraitFormat(viewportFormat);
}

/** Cap physics substeps during template playback (mmd_rtx multi-avatar guard). */
export function getTemplatePhysicsMaxSteps(): number {
  return 1;
}

/** Stricter DPR cap when vertical + RTX or template play. */
export function getPortraitStressDprCap(
  viewportFormat: ViewportFormat,
  rtxEnabled: boolean,
  templateActive: boolean
): number {
  if (!isPortraitFormat(viewportFormat)) return 2;
  if (rtxEnabled || templateActive) return 0.85;
  return 1;
}
