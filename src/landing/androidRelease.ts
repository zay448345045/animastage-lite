export const SITE_URL = 'https://animastage-lite.app';

/** Shipped with `npm run build:android` → public/app-debug.apk */
export const ANDROID_RELEASE = {
  url: '/app-debug.apk',
  directUrl: `${SITE_URL}/app-debug.apk`,
  downloadName: 'AnimaStage-Lite-1.2.3-portrait.apk',
  version: '1.2.3',
  versionCode: 6,
  buildLabel: '01.06.2026',
  sizeMb: 19.6,
  sizeHint: '~20 MB',
  minAndroid: 'Android 6.0+ (API 23)',
  orientation: 'Portrait (vertical)',
  whatsNew: [
    'Export fix — top camera icon opens FX panel (no WebGL crash on Android)',
    'Video save via Share menu after MP4 / Live (Files, Gallery, Drive)',
    'Export length slider in FX before recording',
    'MMD Android landing page — /mmd-android guide on the site',
  ],
  highlights: [
    'Opens straight into Studio — no marketing page on launch',
    'Portrait-first mobile shell — Scene, Control, Camera, FX tabs',
    'Same PMX/PMD/VMD import, timeline, Camera Studio, and MP4 export as the browser',
    'Client-side only — files stay on your device, no account required',
    'Balanced performance presets (Perf / Bal / Qual) in the app menu',
  ],
  requirements: [
    'Phone or tablet held upright (portrait); app stays vertical',
    'Allow install from browser or Files app (sideload debug APK)',
    'WebGL2-capable device; 4 GB+ RAM recommended for heavy PMX',
    'Chrome-based WebView — best on Android 10+',
  ],
  installSteps: [
    'Tap Download APK below (file: app-debug.apk, ~20 MB).',
    'If blocked: Settings → Security → install unknown apps → allow your browser or Files.',
    'Open the downloaded APK and tap Install.',
    'Launch AnimaStage Lite — studio opens in portrait; use ☰ for mode and templates.',
  ],
} as const;
