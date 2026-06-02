import { Orbit, Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '../../components/UI/cn';

interface ProMobileFloatingControlsProps {
  isPlaying: boolean;
  manualOrbit: boolean;
  onTogglePlay: () => void;
  onToggleOrbit: () => void;
  onResetView: () => void;
  className?: string;
}

export default function ProMobileFloatingControls({
  isPlaying,
  manualOrbit,
  onTogglePlay,
  onToggleOrbit,
  onResetView,
  className,
}: ProMobileFloatingControlsProps) {
  const btn =
    'pro-float-btn min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full cursor-pointer';

  return (
    <div
      className={cn(
        'pro-float absolute right-3 z-[30] flex flex-col gap-2 pointer-events-none',
        className
      )}
      style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}
    >
      <button
        type="button"
        onClick={onTogglePlay}
        className={cn(btn, 'pro-float-btn--primary pointer-events-auto')}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
      </button>
      <button
        type="button"
        onClick={onToggleOrbit}
        className={cn(btn, manualOrbit && 'pro-float-btn--on', 'pointer-events-auto')}
        aria-label="Toggle orbit"
        aria-pressed={manualOrbit}
      >
        <Orbit className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onResetView}
        className={cn(btn, 'pointer-events-auto')}
        aria-label="Reset view"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    </div>
  );
}
