import { Activity, CheckCircle2 } from 'lucide-react';
import type { PhysicsQualityTier } from '../../perf/perfTypes';
import { DEBUG_UI } from '../../config/debugUi';

const QUALITY_OPTIONS: { id: PhysicsQualityTier; label: string; hint: string }[] = [
  { id: 'auto', label: 'Auto', hint: 'Adapts steps & FX from frame time' },
  { id: 'off', label: 'Off', hint: 'Skip physics steps (pose/VMD unchanged)' },
  { id: 'low', label: 'Low', hint: '1 sub-step · lighter rate' },
  { id: 'medium', label: 'Medium', hint: '2 sub-steps · balanced' },
  { id: 'high', label: 'High', hint: '3 sub-steps · max cloth detail' },
];

interface PerformanceSettingsPanelProps {
  physicsQuality: PhysicsQualityTier;
  perfOverlayVisible: boolean;
  onPhysicsQuality: (tier: PhysicsQualityTier) => void;
  onPerfOverlayVisible: (visible: boolean) => void;
}

export default function PerformanceSettingsPanel({
  physicsQuality,
  perfOverlayVisible,
  onPhysicsQuality,
  onPerfOverlayVisible,
}: PerformanceSettingsPanelProps) {
  if (!DEBUG_UI) return null;

  return (
    <div className="border-cyan-500/20 border bg-[#121418] p-3 rounded-md shadow-md">
      <div className="h-7 bg-[#1c1e24] -mx-3 -mt-3 mb-2 px-2 flex items-center justify-between text-zinc-200 text-[10px] font-bold uppercase select-none rounded-t-md border-b border-[#2c3240]">
        <span className="flex items-center text-cyan-400">
          <Activity className="w-3.5 h-3.5 mr-1" /> Performance
        </span>
        <span className="text-zinc-500 text-[8px]">60 FPS target</span>
      </div>

      <p className="text-[10px] text-zinc-500 font-semibold mb-2 leading-snug">
        Observer layer only — VMD, IK, morphs, and physics order are unchanged.{' '}
        <strong className="text-zinc-400">Auto</strong> reduces physics steps &amp; post-FX
        (2.5s cooldown). <strong className="text-zinc-400">Off</strong> is explicit user choice
        only.
      </p>

      <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 mb-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={perfOverlayVisible}
          onChange={(e) => onPerfOverlayVisible(e.target.checked)}
          className="accent-cyan-500 cursor-pointer"
        />
        Show FPS overlay (viewport)
      </label>

      <p className="text-[9px] font-bold uppercase text-zinc-500 mb-1.5">Physics quality</p>
      <div className="space-y-1.5">
        {QUALITY_OPTIONS.map((opt) => (
          <div
            key={opt.id}
            role="button"
            tabIndex={0}
            onClick={() => onPhysicsQuality(opt.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onPhysicsQuality(opt.id);
            }}
            className={`p-2 border rounded-md cursor-pointer select-none transition-all ${
              physicsQuality === opt.id
                ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200 font-bold shadow-md'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>{opt.label}</span>
              {physicsQuality === opt.id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5">{opt.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
