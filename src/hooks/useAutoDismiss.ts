import { useEffect, useState } from 'react';

/** Show while `key` is truthy, then auto-hide after `delayMs` (default 2.5s). */
export function useAutoDismiss(key: string | false | null, delayMs = 2500): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!key) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), delayMs);
    return () => window.clearTimeout(timer);
  }, [key, delayMs]);

  return visible;
}
