import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import {
  enableImmersiveStatusBar,
  installStatusBarPeekGestures,
} from './immersiveStatusBar';

/** Capacitor hooks — safe to call in browser (no-ops). */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add(
    'capacitor-native',
    'compact-studio',
    'studio-viewport-lock'
  );

  await enableImmersiveStatusBar();
  installStatusBarPeekGestures();

  try {
    await SplashScreen.hide();
  } catch {
    /* splash may already be hidden */
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
      return;
    }
    void App.minimizeApp();
  });
}
