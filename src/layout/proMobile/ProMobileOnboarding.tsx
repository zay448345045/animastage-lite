import { useEffect, useState } from 'react';
import { Play, X } from 'lucide-react';

interface ProMobileOnboardingProps {
  visible: boolean;
  onTryDemo: () => void;
}

const DISMISS_KEY = 'animastage-pro-demo-cta-dismissed';

export default function ProMobileOnboarding({ visible, onTryDemo }: ProMobileOnboardingProps) {
  const [dismissed, setDismissed] = useState(
    () =>
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(DISMISS_KEY) === '1'
  );

  useEffect(() => {
    if (!visible) return;
    setDismissed(
      typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem(DISMISS_KEY) === '1'
    );
  }, [visible]);

  if (!visible || dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div
      className="pro-onboarding absolute left-1/2 -translate-x-1/2 z-[28] pointer-events-none px-4 w-full max-w-xs"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
    >
      <div className="pro-onboarding__pill pointer-events-auto flex items-center gap-2 pl-4 pr-1 py-1.5">
        <button
          type="button"
          onClick={() => {
            dismiss();
            onTryDemo();
          }}
          className="flex-1 text-left text-sm font-semibold text-zinc-100 min-h-[44px] flex items-center gap-2"
        >
          <Play className="w-4 h-4 text-[#39c5bb] fill-[#39c5bb]" />
          Tap to load demo
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
