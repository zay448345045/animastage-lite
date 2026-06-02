import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Capacitor hooks — safe to call in browser (no-ops). */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add('native-fullscreen', 'compact-studio');

  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.hide();
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    /* status bar plugin optional on some devices */
  }

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
