import { useEffect } from 'react';
import type { CharacterQuality, ViewportFormat } from '../../types';
import { setPlaybackPerfContext } from '../../perf/playbackPerfMode';

interface PlaybackPerfSyncProps {
  playing: boolean;
  viewportFormat: ViewportFormat;
  characterQuality: CharacterQuality;
}

/** Tells adaptive quality / DPR controllers that timeline playback is active. */
export default function PlaybackPerfSync({
  playing,
  viewportFormat,
  characterQuality,
}: PlaybackPerfSyncProps) {
  useEffect(() => {
    setPlaybackPerfContext({ active: playing, viewportFormat, characterQuality });
    return () => {
      setPlaybackPerfContext({ active: false, viewportFormat, characterQuality });
    };
  }, [playing, viewportFormat, characterQuality]);

  return null;
}
