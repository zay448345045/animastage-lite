import { useSyncExternalStore } from 'react';
import { Gauge, Wrench } from 'lucide-react';
import { getPerfSnapshot, subscribePerf } from '../../perf/perfStore';
import { DEBUG_UI } from '../../config/debugUi';

interface PerformanceDiagnosticsPanelProps {
  onFixPerformance: () => void;
}

export default function PerformanceDiagnosticsPanel({
  onFixPerformance,
}: PerformanceDiagnosticsPanelProps) {
  const snap = useSyncExternalStore(subscribePerf, getPerfSnapshot, getPerfSnapshot);

  if (!DEBUG_UI) return null;
  const { diagnostics, boundLabel, bottleneckLabel, budgetExceeded } = snap;

  return (
    <div className="border-amber-500/20 border bg-[#121418] p-3 rounded-md shadow-md mt-3">
      <div className="h-7 bg-[#1c1e24] -mx-3 -mt-3 mb-2 px-2 flex items-center justify-between text-zinc-200 text-[10px] font-bold uppercase select-none rounded-t-md border-b border-[#2c3240]">
        <span className="flex items-center text-amber-400/90">
          <Gauge className="w-3.5 h-3.5 mr-1" /> Why low FPS?
        </span>
        {budgetExceeded && (
          <span className="text-[8px] text-amber-400 font-bold">Over budget</span>
        )}
      </div>

      <p className="text-[9px] text-zinc-500 mb-2">
        {boundLabel} · {bottleneckLabel}
      </p>

      <ul className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
        {diagnostics.causes.map((cause, i) => (
          <li key={`${cause}-${i}`} className="text-[10px] text-zinc-400 leading-snug">
            <span className="text-amber-300/90">·</span> {cause}
          </li>
        ))}
      </ul>

      {diagnostics.suggestions.length > 0 && (
        <div className="border-t border-zinc-800 pt-2 mb-2">
          <p className="text-[8px] font-bold uppercase text-zinc-500 mb-1">Suggestions</p>
          <ul className="space-y-1">
            {diagnostics.suggestions.slice(0, 4).map((s, i) => (
              <li key={`${s}-${i}`} className="text-[9px] text-cyan-400/80 leading-snug">
                → {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onFixPerformance}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-gradient-to-r from-amber-600/80 to-amber-500/70 hover:from-amber-500 hover:to-amber-400 text-zinc-950 text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all"
      >
        <Wrench className="w-3.5 h-3.5" />
        Fix performance
      </button>
      <p className="text-[8px] text-zinc-600 mt-1.5 text-center">
        Sets physics Medium, disables bloom/DOF/weather/RTX — animation unchanged
      </p>
    </div>
  );
}
