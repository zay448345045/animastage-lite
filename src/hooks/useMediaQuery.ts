import { useEffect, useState } from 'react';
import { isNativeApp } from '../utils/platform';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Short viewport — typical phone landscape (~360–430px tall). */
const COMPACT_HEIGHT_QUERY = '(max-height: 520px)';
const NARROW_WIDTH_QUERY = '(max-width: 767px)';

/**
 * Compact studio layout: sidebar/timeline as overlays, bottom nav, no desktop menu bar.
 * Native Capacitor always uses compact (landscape phones have width >768 but tiny height).
 */
export function useIsMobileStudio(): boolean {
  const isNative = isNativeApp();
  const isNarrow = useMediaQuery(NARROW_WIDTH_QUERY);
  const isShort = useMediaQuery(COMPACT_HEIGHT_QUERY);
  if (isNative) return true;
  return isNarrow || isShort;
}

export function useCompactStudio(): boolean {
  return useIsMobileStudio();
}
