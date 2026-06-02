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
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in duration-200">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/30 text-[10px] font-semibold text-amber-100 shadow-lg backdrop-blur-sm">
        <Gauge className="w-3 h-3 text-amber-400 animate-pulse" />
        {message}
      </div>
    </div>
  );
}
