import { Sparkles, Upload } from 'lucide-react';

interface StudioOnboardingProps {
  onTryDemo: () => void;
  onDismiss: () => void;
}

export default function StudioOnboarding({ onTryDemo, onDismiss }: StudioOnboardingProps) {
  return (
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-violet-950/80 border-b border-violet-500/25 text-xs sm:text-sm text-violet-100/90 z-50">
      <p>
        <span className="font-semibold text-violet-300">Welcome to AnimaStage.</span>{' '}
        <button type="button" onClick={onTryDemo} className="font-bold text-white underline-offset-2 hover:underline cursor-pointer">
          Try demo
        </button>
        {' → '}
        or drop your <strong className="text-white">PMX</strong> + <strong className="text-white">VMD</strong> on the viewport.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onTryDemo}
          className="inline-flex items-center gap-1 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white px-2.5 py-1 rounded cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          Try demo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-1 text-xs font-bold text-violet-400 hover:text-violet-200 cursor-pointer px-2 py-1"
        >
          <Upload className="w-3 h-3" />
          Got it
        </button>
      </div>
    </div>
  );
}
