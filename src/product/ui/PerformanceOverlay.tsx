import { Gauge } from 'lucide-react';
import { getPerformanceMessage } from './performanceMessages';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';

export interface PerformanceOverlayProps {
  fps: string;
  frameMs: string;
  autoScale: string;
}

/** Pure UI overlay — no engine imports. */
export default function PerformanceOverlay({ fps, frameMs, autoScale }: PerformanceOverlayProps) {
  const message = getPerformanceMessage(autoScale, fps, frameMs);
  const visible = useAutoDismiss(message);

  if (!message || !visible) return null;

  return (
    <div className="viewport-perf-toast absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/75 border border-amber-500/20 text-[9px] font-medium text-amber-100/90 shadow-md backdrop-blur-sm">
        <Gauge className="w-2.5 h-2.5 text-amber-400/80 shrink-0" aria-hidden />
        <span className="max-w-[14rem] truncate">{message}</span>
      </div>
    </div>
  );
}
