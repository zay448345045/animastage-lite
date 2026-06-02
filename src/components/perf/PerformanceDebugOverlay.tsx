import { useSyncExternalStore } from 'react';
import { Activity } from 'lucide-react';
import { getPerfSnapshot, subscribePerf } from '../../perf/perfStore';
import { MMD_TIMELINE_FPS, TARGET_FRAME_MS } from '../../perf/perfConstants';
import { DEBUG_UI } from '../../config/debugUi';

interface PerformanceDebugOverlayProps {
  visible: boolean;
  onToggle?: () => void;
}

function barColor(pct: number): string {
  if (pct > 70) return 'bg-amber-400';
  if (pct > 45) return 'bg-cyan-400';
  return 'bg-emerald-400';
}

export default function PerformanceDebugOverlay({ visible, onToggle }: PerformanceDebugOverlayProps) {
  const snap = useSyncExternalStore(subscribePerf, getPerfSnapshot, getPerfSnapshot);

  if (!DEBUG_UI) return null;

  if (!visible) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="absolute top-14 right-2 md:top-16 md:right-4 z-30 p-1.5 rounded-md bg-[#121418]/80 border border-zinc-800 text-zinc-500 hover:text-cyan-400 cursor-pointer backdrop-blur-sm"
        title="Show performance overlay"
        aria-label="Show performance overlay"
      >
        <Activity className="w-3.5 h-3.5" />
      </button>
    );
  }

  const budgetPct = Math.min(100, (snap.frameMs / TARGET_FRAME_MS) * 100);
  const over = snap.budgetExceeded;
  const showBottleneckAlert =
    over &&
    snap.bottleneck !== 'balanced' &&
    snap.bottleneck !== 'unknown';

  return (
    <div className="absolute top-14 right-2 md:top-16 md:right-4 z-30 w-[min(100%,228px)] font-mono text-[9px] select-none pointer-events-auto">
      <div
        className={`rounded-lg border backdrop-blur-md shadow-lg overflow-hidden ${
          over
            ? 'border-amber-500/40 bg-[#121418]/92'
            : 'border-zinc-800/90 bg-[#121418]/88'
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-800/80 bg-zinc-950/50">
          <span className="text-[8px] font-bold uppercase tracking-widest text-cyan-400/90">
            Performance
          </span>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="text-zinc-500 hover:text-zinc-300 text-[8px] font-bold cursor-pointer"
            >
              Hide
            </button>
          )}
        </div>

        <div className="px-2 py-1.5 space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-zinc-500">Frame</span>
            <span className={`text-sm font-bold tabular-nums ${over ? 'text-amber-300' : 'text-emerald-400'}`}>
              {snap.frameMs.toFixed(1)}
              <span className="text-[9px] text-zinc-500 font-normal"> ms</span>
            </span>
          </div>
          <div className="flex justify-between gap-2 text-[8px] -mt-0.5">
            <span className="text-zinc-600">
              budget {TARGET_FRAME_MS.toFixed(1)} ms · avg {snap.frameMsAvg.toFixed(1)} ms
            </span>
            <span className={over ? 'text-amber-400/90' : 'text-zinc-500'}>{snap.loadHint}</span>
          </div>

          <div className="h-1 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${over ? 'bg-amber-500' : 'bg-cyan-500/80'}`}
              style={{ width: `${Math.min(100, budgetPct)}%` }}
            />
          </div>

          <div className="flex justify-between gap-2 pt-0.5">
            <span className="text-zinc-500">rAF FPS</span>
            <span className="text-zinc-200 font-bold tabular-nums">
              {snap.fps.toFixed(0)}
              <span className="text-zinc-600 font-normal">
                {' '}
                avg {snap.fpsAvg.toFixed(0)}
              </span>
            </span>
          </div>
          <div className="flex justify-between gap-2 text-[8px] -mt-1">
            <span className="text-zinc-600">MMD timeline</span>
            <span className="text-zinc-500">{MMD_TIMELINE_FPS} FPS content</span>
          </div>

          <div className="flex justify-between gap-2 text-[8px]">
            <span className="text-zinc-600">{snap.boundLabel}</span>
            <span className="text-zinc-500 truncate max-w-[130px] text-right">
              {snap.bottleneckLabel}
            </span>
          </div>

          <div className="pt-0.5 border-t border-zinc-800/60 space-y-1">
            <div className="flex justify-between text-[8px]">
              <span className="text-zinc-500 uppercase tracking-wide">CPU (measured)</span>
              <span className="text-zinc-400 tabular-nums">{snap.cpuMs.toFixed(1)} ms</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className={`h-full ${barColor(snap.cpuSharePct)}`}
                  style={{ width: `${snap.cpuSharePct}%` }}
                />
              </div>
              <span className="text-zinc-300 w-8 text-right tabular-nums">{snap.cpuSharePct}%</span>
            </div>
            <div className="text-[8px] text-zinc-500 pl-0.5 leading-tight tabular-nums">
              anim {snap.breakdownMs.animationIk.toFixed(1)} · phys{' '}
              {snap.breakdownMs.physics.toFixed(1)} · other {snap.breakdownMs.other.toFixed(1)} ms
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[8px]">
              <span className="text-zinc-500 uppercase tracking-wide">GPU (estimated)</span>
              <span className="text-zinc-400 tabular-nums">{snap.gpuMsEst.toFixed(1)} ms</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className={`h-full ${barColor(snap.gpuSharePct)}`}
                  style={{ width: `${snap.gpuSharePct}%` }}
                />
              </div>
              <span className="text-zinc-300 w-8 text-right tabular-nums">{snap.gpuSharePct}%</span>
            </div>
            <div className="text-[8px] text-zinc-600 pl-0.5 leading-tight tabular-nums">
              render + postFX ≈ {snap.breakdownMs.renderEst.toFixed(1)} ms (frame − CPU)
            </div>
          </div>

          {showBottleneckAlert && (
            <div
              className={`text-[8px] font-bold rounded px-1.5 py-0.5 ${
                snap.bottleneck === 'physics'
                  ? 'bg-purple-950/50 text-purple-300 border border-purple-500/30'
                  : snap.bottleneck === 'render'
                    ? 'bg-pink-950/50 text-pink-300 border border-pink-500/30'
                    : snap.bottleneck === 'animation'
                      ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                      : 'bg-zinc-900/80 text-zinc-400 border border-zinc-700/50'
              }`}
            >
              {snap.bottleneckLabel}
            </div>
          )}

          <div className="text-[8px] text-zinc-500 leading-tight border-t border-zinc-800/60 pt-1">
            <div>
              Physics:{' '}
              <span className="text-zinc-300">
                {snap.physicsQuality === 'auto'
                  ? `AUTO → ${snap.effectivePhysicsTier}`
                  : snap.physicsQuality.toUpperCase()}
              </span>
              {snap.postFxReduced && (
                <span className="text-amber-400/90"> · FX reduced</span>
              )}
            </div>
            <div className="text-zinc-600 mt-0.5">{snap.physicsStatus}</div>
          </div>
        </div>
      </div>
      <p className="mt-1 text-[7px] text-zinc-600 text-right px-0.5 leading-snug">
        rAF uncapped · {TARGET_FRAME_MS.toFixed(0)} ms = 60 Hz budget · MMD {MMD_TIMELINE_FPS} FPS
      </p>
    </div>
  );
}
