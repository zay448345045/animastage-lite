export type PhysicsQualityTier = 'off' | 'low' | 'medium' | 'high' | 'auto';

export type PerfBottleneck = 'balanced' | 'physics' | 'animation' | 'render' | 'unknown';

export interface PerfCpuBreakdownMs {
  animationIk: number;
  physics: number;
  other: number;
  /** frameMs − CPU work (render + GPU), estimated */
  renderEst: number;
}

export type PerfBoundLabel =
  | 'CPU bound'
  | 'GPU bound'
  | 'Balanced'
  | 'CPU-heavy frame'
  | 'GPU-heavy frame';

export interface PerfSnapshot {
  fps: number;
  fpsAvg: number;
  frameMs: number;
  frameMsAvg: number;
  budgetExceeded: boolean;
  degrading: boolean;
  degradeMessage: string | null;
  cpuMs: number;
  gpuMsEst: number;
  cpuSharePct: number;
  gpuSharePct: number;
  bottleneck: PerfBottleneck;
  bottleneckLabel: string;
  breakdownMs: PerfCpuBreakdownMs;
  physicsQuality: PhysicsQualityTier;
  effectivePhysicsTier: Exclude<PhysicsQualityTier, 'auto'>;
  adaptiveTier: Exclude<PhysicsQualityTier, 'auto' | 'off'>;
  physicsMaxSteps: number;
  /** User chose Off — not adaptive skip */
  physicsSkipped: boolean;
  /** Physics step actually ran this frame */
  physicsSimActive: boolean;
  /** Short status for overlay, e.g. "Active" / "Idle (playtime)" */
  physicsStatus: string;
  postFxReduced: boolean;
  boundLabel: PerfBoundLabel;
  /** Softer label when frame is still within budget */
  loadHint: string;
  diagnostics: { causes: string[]; suggestions: string[] };
  /** User-facing performance level from smoothed frame time. */
  perfLevel: 'Smooth' | 'Okay' | 'Lagging';
  /** Short bottleneck label for HUD. */
  displayBottleneck: string;
  /** Smoothed CPU ms for display. */
  cpuMsDisplay: number;
  /** Smoothed GPU ms for display. */
  gpuMsDisplay: number;
}
