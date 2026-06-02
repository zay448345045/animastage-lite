import {
  MAX_TEMPLATE_DURATION_SEC,
  MIN_TEMPLATE_DURATION_SEC,
  SHORTS_DURATION_SEC,
} from '../templates/duration';

export { SHORTS_DURATION_SEC };

export const SHORTS_DURATION_PRESETS_SEC = [15, 30, 50, 60, 90] as const;

export function clampShortsDuration(sec: number): number {
  const n = Number(sec);
  if (!Number.isFinite(n)) return SHORTS_DURATION_SEC;
  return Math.min(
    MAX_TEMPLATE_DURATION_SEC,
    Math.max(MIN_TEMPLATE_DURATION_SEC, Math.round(n))
  );
}

export function formatShortsDurationLabel(sec: number): string {
  return `${clampShortsDuration(sec)}s`;
}
