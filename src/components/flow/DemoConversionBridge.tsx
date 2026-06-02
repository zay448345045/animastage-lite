import { Upload, X, Flame } from 'lucide-react';
import { Button, Panel } from '../UI';

interface DemoConversionBridgeProps {
  visible: boolean;
  onUpload: () => void;
  onDismiss: () => void;
}

export default function DemoConversionBridge({
  visible,
  onUpload,
  onDismiss,
}: DemoConversionBridgeProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(100%,22rem)] px-3 pointer-events-none"
      role="status"
    >
      <Panel className="pointer-events-auto flex items-start gap-[var(--space-md)] border-[var(--color-warning)]/30 shadow-xl shadow-black/40 !p-[var(--space-md)]">
        <Flame className="w-5 h-5 text-[var(--color-warning)] shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-main)] m-0">
            Your turn — try your own model
          </p>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-1 mb-0 leading-snug">
            Drop PMX + VMD on the viewport. Playback keeps running.
          </p>
          <Button type="button" variant="primary" className="w-full mt-[var(--space-md)]" onClick={onUpload}>
            <Upload className="w-3.5 h-3.5" />
            Upload PMX / VMD
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="!p-1 shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </Panel>
    </div>
  );
}
