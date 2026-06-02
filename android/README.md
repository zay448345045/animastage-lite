# Android — обновить Studio из `src/`

Capacitor-проект. Чтобы залить **последнюю веб-студию** (UI/UX, perf HUD, ZIP-import) в APK:

## Быстрый способ (Windows)

```powershell
cd e:\download\web-mmd-suite
npm run sync:android:assets
```

Скрипт:

1. Собирает `dist/` (`npm run build`)
2. Копирует `dist/` → `android/app/src/main/assets/public/`
3. Собирает debug APK (`gradlew assembleDebug`)
4. Копирует APK → `public/app-debug.apk` (для лендинга)

Версия APK: **`android/version.properties`** (`VERSION_NAME` / `VERSION_CODE`).

## Сборка в Android Studio

Android Studio → Open `android/` → **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

Release-подпись: `keystore.properties` в `android/`.

## v1.1.0 — что внутри

| Область | Поведение |
|---------|-----------|
| **Запуск** | Сразу **Studio `/app`** (без лендинга), landscape lock |
| **UI** | Design system, sidebar Load/Scene/Controls, empty viewport |
| **Perf HUD** | Frame ms, CPU/GPU, Smooth/Okay/Lagging |
| **WebView** | Balanced quality, immersive chrome (`MainActivity`) |
| **Workflow** | PMX/VMD/ZIP, Demo Gallery, Shorts, MP4 export |

Имя в лаунчере: **AnimaStage Lite** (`res/values/strings.xml`).
