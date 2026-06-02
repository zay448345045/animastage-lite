import { useSyncExternalStore } from 'react';
import { getPerfSnapshot, subscribePerf } from '../../perf/perfStore';

export default function FrameBudgetToast() {
  const snap = useSyncExternalStore(subscribePerf, getPerfSnapshot, getPerfSnapshot);

  if (!snap.degrading || !snap.degradeMessage) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-md:bottom-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-950/90 text-amber-100 text-[10px] font-bold shadow-lg backdrop-blur-md animate-in fade-in duration-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
        {snap.degradeMessage}
      </div>
    </div>
  );
}
