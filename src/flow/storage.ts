import type { StudioEntryFlow, StudioUiMode } from './types';

const UI_MODE_KEY = 'as_ui_mode';
const BRIDGE_DISMISSED_KEY = 'as_demo_bridge_dismissed';
const WATERMARK_PREF_KEY = 'as_export_watermark';

export function loadUiMode(): StudioUiMode {
  try {
    const v = localStorage.getItem(UI_MODE_KEY);
    return v === 'pro' ? 'pro' : 'beginner';
  } catch {
    return 'beginner';
  }
}

export function saveUiMode(mode: StudioUiMode): void {
  try {
    localStorage.setItem(UI_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function isDemoBridgeDismissed(): boolean {
  try {
    return localStorage.getItem(BRIDGE_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDemoBridgeDismissed(): void {
  try {
    localStorage.setItem(BRIDGE_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function loadWatermarkPref(): boolean {
  try {
    return localStorage.getItem(WATERMARK_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveWatermarkPref(enabled: boolean): void {
  try {
    localStorage.setItem(WATERMARK_PREF_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function parseStudioEntry(search: string): {
  flow: StudioEntryFlow;
  demoId: string | null;
} {
  const params = new URLSearchParams(search);
  const flowParam = params.get('flow');
  const demoParam = params.get('demo');

  let flow: StudioEntryFlow = 'default';
  if (flowParam === 'demo') flow = 'demo';
  else if (flowParam === 'upload') flow = 'upload';
  else if (flowParam === 'creator') flow = 'creator';

  return {
    flow,
    demoId: demoParam && demoParam !== 'gallery' ? demoParam : null,
  };
}
