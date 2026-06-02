import type { StudioUiMode } from '../../flow/types';

/** Beginner mode = UI visibility only. */
export function isBeginnerMode(uiMode: StudioUiMode): boolean {
  return uiMode === 'beginner';
}

export function shouldShowTimeline(uiMode: StudioUiMode, panelOpen: boolean): boolean {
  if (isBeginnerMode(uiMode)) return false;
  return panelOpen;
}

export function shouldShowAdvancedSidebar(uiMode: StudioUiMode): boolean {
  return !isBeginnerMode(uiMode);
}
