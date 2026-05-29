# Android — обновить веб из `src/`

Проект Capacitor уже настроен. Чтобы залить **все последние изменения** из веб-студии:

## Быстрый способ (Windows)

```powershell
cd e:\download\web-mmd-suite
npm run build
powershell -ExecutionPolicy Bypass -File scripts\sync-android-assets.ps1
```

Или одной командой после `npm install`:

```bash
npm run sync:android:assets
```

Скрипт копирует `dist/` → `app/src/main/assets/public/` (полная замена папки).

## Через Capacitor CLI

```bash
npm run build
npx cap copy android
```

## Сборка APK

Android Studio → Open `android/` → **Build → Build Bundle(s) / APK(s)**.

Подпись release: `keystore.properties` в `android/`.

## Что попадает в APK

- Лендинг `/` и студия `/app`
- Мобильный UI (нижняя панель, таймлайн, Templates sheet)
- FX / bloom / DOF (как в вебе, без отдельного отключения для Android)
- `ammo/` для физики

Имя в лаунчере: **AnimaStage Lite** (`res/values/strings.xml`).
