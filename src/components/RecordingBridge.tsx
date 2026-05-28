import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

interface RecordingBridgeProps {
  recordingActive: boolean;
  onInvalidateReady?: (invalidate: () => void) => void;
  onTick?: () => void;
}

/** Keeps scene rendering during capture and exposes R3F invalidate for offline frames. */
export default function RecordingBridge({
  recordingActive,
  onInvalidateReady,
  onTick,
}: RecordingBridgeProps) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    onInvalidateReady?.(invalidate);
  }, [invalidate, onInvalidateReady]);

  useFrame(() => {
    if (recordingActive) onTick?.();
  });

  return null;
}
