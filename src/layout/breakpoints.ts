/** Studio layout breakpoints (match mobile-studio.css). */
export const BP = {
  xs: 320,
  sm: 375,
  md: 768,
  lg: 1024,
} as const;

export const MQ = {
  xs: `(max-width: ${BP.sm - 1}px)`,
  sm: `(min-width: ${BP.sm}px) and (max-width: ${BP.md - 1}px)`,
  md: `(min-width: ${BP.md}px) and (max-width: ${BP.lg - 1}px)`,
  lg: `(min-width: ${BP.lg}px)`,
  /** Phone / narrow mobile layout (≤768px) */
  max768: `(max-width: ${BP.md}px)`,
  maxMd: `(max-width: ${BP.md - 1}px)`,
  maxLg: `(max-width: ${BP.lg - 1}px)`,
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
} as const;
