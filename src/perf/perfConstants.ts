/** Display / editing budget (~60 Hz). */
export const TARGET_FRAME_MS = 1000 / 60;

/** MMD / VMD timeline rate (content), not monitor rAF rate. */
export const MMD_TIMELINE_FPS = 30;

export const FRAME_BUDGET_WARN_MS = TARGET_FRAME_MS * 1.08;

/** Frames above budget before adaptive downgrade (hysteresis). */
export const ADAPTIVE_STRESS_FRAMES = 18;

/** Consecutive smooth frames before adaptive upgrade. */
export const ADAPTIVE_RECOVER_FRAMES = 90;

/** Min ms between physics tier / FX step changes (stops Auto "pumping" FPS). */
export const ADAPTIVE_TIER_COOLDOWN_MS = 2500;

/** GPU ms must exceed CPU ms × this ratio to count as GPU-bound. */
export const GPU_BOUND_CPU_RATIO = 1.12;

/** GPU share of frame time (%) that triggers visual degrade. */
export const GPU_OVERLOAD_PCT = 70;

/** Max React overlay refresh rate (store updates every frame; UI subscribes throttled). */
export const PERF_UI_NOTIFY_MS = 250;
