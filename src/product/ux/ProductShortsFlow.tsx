import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import type { ShortsPhase } from '../shorts/ShortsGenerator';
import ShortsFlowBar from './ShortsFlowBar';

export interface ProductShortsFlowHandle {
  enterPreview: () => void;
  reset: () => void;
}

interface ProductShortsFlowProps {
  onShare: () => void | Promise<void>;
  onExportVideo: () => void;
  durationSec: number;
  manualCameraLock: boolean;
  onAutoFrame: () => void;
  onToggleManualCamera: () => void;
}

/**
 * Isolated shorts UI state — avoids invalidating useProductLayer on every phase change.
 */
const ProductShortsFlow = forwardRef<ProductShortsFlowHandle, ProductShortsFlowProps>(
  function ProductShortsFlow(
    { onShare, onExportVideo, durationSec, manualCameraLock, onAutoFrame, onToggleManualCamera },
    ref
  ) {
    const [phase, setPhase] = useState<ShortsPhase>('idle');
    const exportingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      enterPreview: () => {
        exportingRef.current = false;
        setPhase('preview');
      },
      reset: () => {
        exportingRef.current = false;
        setPhase('idle');
      },
    }));

    const handleShare = useCallback(async () => {
      try {
        await onShare();
        setPhase('export');
      } catch {
        /* parent shows error toast */
      }
    }, [onShare]);

    const handleExport = useCallback(() => {
      if (exportingRef.current) return;
      exportingRef.current = true;
      setPhase('export');
      onExportVideo();
    }, [onExportVideo]);

    return (
      <ShortsFlowBar
        phase={phase}
        durationSec={durationSec}
        manualCameraLock={manualCameraLock}
        onShare={() => void handleShare()}
        onExport={handleExport}
        onAutoFrame={onAutoFrame}
        onToggleManualCamera={onToggleManualCamera}
      />
    );
  }
);

export default ProductShortsFlow;
