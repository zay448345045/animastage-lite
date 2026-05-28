import type { ViewportFormat } from '../types';

/** Portrait preview frame — half of 1080×1920 for sharper Shorts capture. */
export const VIEWPORT_916_WIDTH = 540;
export const VIEWPORT_916_HEIGHT = 960;

/** Export / record target (Full HD vertical). */
export const SHORTS_EXPORT_WIDTH = 1080;
export const SHORTS_EXPORT_HEIGHT = 1920;

export const VIEWPORT_FORMAT_OPTIONS: { id: ViewportFormat; label: string }[] = [
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
];

export function viewportAspect(format: ViewportFormat): number {
  return format === '9:16' ? 9 / 16 : 16 / 9;
}
