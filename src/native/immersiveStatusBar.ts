import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const PEEK_MS = 2500;
const TOP_GESTURE_ZONE_PX = 56;
const SWIPE_DOWN_MIN_PX = 20;

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let peekInstalled = false;

export async function enableImmersiveStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add('capacitor-immersive');

  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.hide();
  } catch {
    /* plugin optional */
  }
}

export async function hideImmersiveStatusBar(): Promise<void> {
  try {
    await StatusBar.hide();
  } catch {
    /* ignore */
  }
}

export async function peekImmersiveStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.show();
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      hideTimer = null;
      void hideImmersiveStatusBar();
    }, PEEK_MS);
  } catch {
    /* ignore */
  }
}

/** Swipe down from top or tap top chrome — brief status bar peek. */
export function installStatusBarPeekGestures(): void {
  if (!Capacitor.isNativePlatform() || peekInstalled) return;
  peekInstalled = true;

  let touchStartY = 0;
  let touchStartX = 0;

  document.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      touchStartY = t.clientY;
      touchStartX = t.clientX;
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const dy = t.clientY - touchStartY;
      if (touchStartY <= TOP_GESTURE_ZONE_PX && dy >= SWIPE_DOWN_MIN_PX) {
        void peekImmersiveStatusBar();
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest('.pro-topbar, .pro-mobile-chrome')) return;
      // Top-bar buttons (export, share, menu) must not toggle status bar — breaks WebGL layout.
      if (el.closest('button, a, input, select, textarea, [role="button"]')) return;
      void peekImmersiveStatusBar();
    },
    { capture: true }
  );
}
