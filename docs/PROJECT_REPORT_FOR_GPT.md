# AnimaStage Lite — полный отчёт о проекте (для анализа)

Скопируй этот файл целиком в ChatGPT / Claude и попроси: «проанализируй проект по этому документу».

---

## 1. Что это за проект

**AnimaStage Lite** — веб-приложение (браузерная студия) для работы с **MikuMikuDance (MMD)** без установки MMD на Windows. Пользователь открывает сайт, загружает модели **PMX/PMD**, движения **VMD**, настраивает сцену, физику, камеру, таймлайн и может **экспортировать видео** (в том числе вертикальное **9:16** для Shorts/Reels/TikTok).

| | Значение |
|---|---|
| Название npm | `animastage-lite@1.0.0` |
| Репозиторий | https://github.com/FBNonaMe/animastage-lite |
| Демо | https://animastage-lite.app |
| Студия | https://animastage-lite.app/app |
| Локальная папка (рабочее имя) | `web-mmd-suite` |

**Важно:** есть отдельный продукт **AnimaStage Pro** (другой репозиторий, более тяжёлый рендер). В Lite в боковой панели пункт **«Pro»** — это **не** отдельный Pro-сайт, а **расширенные модули внутри Lite** (mocap, AI, collab, слои анимации).

| | Lite (этот репо) | Pro (соседний продукт) |
|---|---|---|
| Сайт | animastage-lite.app | animastagepro.dev |
| GitHub | FBNonaMe/animastage-lite | gtausa197-svg/AnimaStage-Pro |
| Фокус | Быстрый превью, Shorts, слабые ПК | Полный кинематографический пайплайн |
| Рендер | WebGL 2 + RTX Lite (bloom, DOF, weather) | Полный EffectComposer (SSAO, DOF, volumetrics) |
| Персонажи | Один фокус сцены | Несколько персонажей, VMD на каждого |
| Таймлайн | VMD, dopesheet, curves, export VMD | Dual timeline (VMD + cinematic camera) |

---

## 2. Стек технологий

| Слой | Технологии |
|------|------------|
| UI | React 19, TypeScript, Tailwind CSS 4, Lucide icons |
| Сборка | Vite 6 |
| 3D | Three.js 0.184, React Three Fiber, @react-three/drei, postprocessing |
| MMD | `mmd-parser`, three-stdlib (MMD loader) |
| Физика | Bullet через Ammo.js WASM (+ код Jolt в `src/physics/`) |
| Видео | WebCodecs + mp4-muxer (HQ), MediaRecorder (Live) |
| AI (опционально) | Google Gemini (`@google/genai`) |
| Mocap | MediaPipe (`@mediapipe/tasks-vision`) |
| Collab | Yjs + y-webrtc |
| Роутинг | Свой SPA-роутер без React Router (`RootRouter.tsx`) |

**Требования браузера:** WebGL 2. Для MP4 HQ лучше Chrome/Edge (WebCodecs H.264).

---

## 3. Точки входа и страницы

```
/              → LandingPage.tsx (маркетинг, CTA)
/app           → App.tsx (основная студия)
/app?demo=1    → студия с пресетом Miku и подсказкой
```

- `src/main.tsx` — монтирование React
- `src/RootRouter.tsx` — выбор лендинга или студии
- `index.html` — SEO, Open Graph, viewport-fit=cover

**Локальный запуск:**

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # → dist/
npm run lint     # tsc --noEmit
```

---

## 4. Архитектура студии

```
┌──────────────────────────────────────────────────────────┐
│ TopMenu — File, FX, физика, экспорт (desktop / mobile)   │
├──────────┬───────────────────────────────────────────────┤
│ Sidebar  │ Viewport (R3F Canvas, MMDModelWrapper)        │
│ модели,  │ 3D сцена, gizmo, фон, 16:9 / 9:16           │
│ морфы,   ├───────────────────────────────────────────────┤
│ Pro      │ EditorTimelineShell                           │
│ панели   │ Timeline | Dopesheet | Curves                 │
└──────────┴───────────────────────────────────────────────┘
│ MobileStudioBar (<768px): Menu, Panel, Play, Time, FX    │
└──────────────────────────────────────────────────────────┘
```

**Центр состояния:** `App.tsx` — большой `AppState` (модели, кадры, физика, FX, камера, таймлайн).

**Ключевые файлы:**

| Файл | Роль |
|------|------|
| `App.tsx` | Состояние приложения, collab, запись видео, UI layout |
| `components/MMDModelWrapper.tsx` | PMX/VMD, скелет, морфы, физика, слои анимации |
| `components/Viewport.tsx` | Canvas, оверлеи, drag-drop |
| `components/Timeline.tsx` | Таймлайн, transport, keyframes |
| `components/TimelineLogic.ts` | Логика треков и интерполяции |
| `components/CameraLogic.ts` | Ключи камеры |
| `components/Sidebar.tsx` | Панель сцены и Pro-модули |
| `components/TopMenu.tsx` | Меню File/FX |
| `templates/animationTemplates.ts` | Шаблоны движений (dance, camera, emote…) |
| `video/mmdVideoRecorder.ts` | Экспорт MP4 |
| `hooks/useVideoRecorder.ts` | Live/HQ запись |
| `hooks/useCollab.ts` | Совместная работа |
| `mocap/videoMocap.ts` | Видео → ключи |
| `ai/motionAi.ts` | Gemini → ключи |
| `collab/collabSync.ts` | Yjs/WebRTC sync |
| `types.ts` | TypeScript типы всего AppState |

---

## 5. Основной функционал

### Сцена и модели
- Drag & drop PMX, PMD, VMD, текстуры, HDR
- Пресеты (Miku, Kizuna) или своя модель
- Gizmo: перемещение корня, вращение костей
- Морфы (глаза, рот, брови)

### Анимация
- Воспроизведение VMD
- Таймлайн: морфы + упрощённые кости + camera track
- Dopesheet и редактор кривых (Bezier)
- Шаблоны: Studio / +Body / +Camera / +Combo / Templates
- Экспорт VMD (`editor/vmdExport.ts`)
- Undo/redo, stretch, simplify track

### Камера
- Free (orbit) и MMD (VMD / keyframes)
- Закладки камеры, letterbox 2.39
- Переключение 16:9 ↔ 9:16 (для Shorts подкручиваются FX и качество)

### Визуал (RTX Lite)
- Bloom, DOF, vignette, погода, HDR IBL, toon + outline
- Панель FX в TopMenu

### Физика
- Bullet WASM, режимы: `anytime` / `playtime` / `off`
- Ветер, пресеты MMD Lite

### Видео
- MP4 HQ — WebCodecs
- Live — MediaRecorder
- Чистый кадр без gizmo/grid
- 1080×1920 в режиме 9:16

### Sidebar → Pro (модули внутри Lite)
| Модуль | Путь | Назначение |
|--------|------|------------|
| Animation layers | `editor/animationLayers.ts` | Наложение анимаций, solo/mute |
| Mocap | `mocap/videoMocap.ts` | Видео → ключи (MediaPipe) |
| AI motion | `ai/motionAi.ts` | Gemini → ключи |
| Collab | `collab/`, `hooks/useCollab.ts` | Yjs/WebRTC |

---

## 6. Структура папок

```
web-mmd-suite/
├── src/                          # ~145 .ts/.tsx файлов
│   ├── App.tsx
│   ├── RootRouter.tsx
│   ├── types.ts
│   ├── pages/LandingPage.tsx
│   ├── components/
│   │   ├── MMDModelWrapper.tsx
│   │   ├── Viewport.tsx
│   │   ├── Sidebar.tsx, TopMenu.tsx
│   │   ├── Timeline.tsx, TimelineToolsBar.tsx
│   │   ├── TemplatePicker.tsx, MobileTemplateSheet.tsx
│   │   ├── MobileStudioBar.tsx
│   │   └── editor/               # Dopesheet, Curves, AdvancedStudioPanel
│   ├── hooks/
│   ├── editor/                   # undo, vmd export, clips
│   ├── templates/
│   ├── video/
│   ├── mocap/, ai/, collab/
│   ├── physics/                  # Jolt worker (параллельно Ammo)
│   ├── postfx/, visualFx/, camera/, utils/
│   └── main.tsx
├── docs/
│   ├── ANIMASTAGE_LITE.md
│   ├── REZE_INTEGRATION.md
│   └── PROJECT_REPORT_FOR_GPT.md   # этот файл
├── public/                       # studio-screenshot.png, статика
├── android/                      # нативная оболочка (не основной веб)
├── README.md, SECURITY.md
├── .env.example
└── package.json
```

**Внимание:** папка `AnimeStageLite/animastage-lite/` — устаревшая копия. **Актуальный код — в корневом `src/`.**

---

## 7. Состояние приложения (AppState)

Один большой React state в `App.tsx` (без Redux):

- `models[]` — PMX, keyframes, VMD flags, morphs, layers
- `currentFrame`, `maxFrames`, `isPlaying`, `playSpeed`
- `physicsMode`, `mmdLite`
- `cameraMode`, `cameraKeyframes`, camera VMD
- `visualFx`, `rtxSettings`, `characterQuality`, `renderTier`
- `sceneBackground`, `sceneHdr`
- `timelineActiveTrack`
- UI: `showLeftSidebar`, `showTimelinePanel`, mobile nav state

Плейхед: `utils/playhead.ts` + ref для плавного rAF.

---

## 8. UI: десктоп vs мобильная версия

**Брейкпоинт:** `max-width: 767px` (`hooks/useMediaQuery.ts` → `useIsMobileStudio()`).

| Область | Desktop (≥768px) | Mobile (<768px) |
|---------|------------------|-----------------|
| Sidebar | Колонка, collapse | Drawer + затемнение |
| TopMenu | Dropdown File/FX | Hamburger + sheets |
| Timeline tools | 5× TemplatePicker + Layer + Clear + Frame | Кнопка **Templates** → bottom sheet (`MobileTemplateSheet`) |
| Timeline tracks | Список слева (w-56) | Горизонтальные чипы, один активный трек |
| Низ экрана | — | `MobileStudioBar`: Menu, Panel, Play, Time, FX |
| Viewport | Полные подписи | Компактные кнопки |

**Принцип разработки:** десктоп в `hidden md:flex` / `variant="desktop"`; мобильные правки не должны ломать ПК.

**Недавние мобильные правки:**
- Адаптация Timeline (узкие кадры, чипы треков)
- Portal для TemplatePicker на десктопе (меню не обрезается)
- На мобиле — один bottom sheet вместо 5 выпадающих меню
- Safe area для iPhone (`viewport-fit=cover`, env(safe-area-inset-*))

---

## 9. Переменные окружения

```env
VITE_GEMINI_API_KEY=...           # AI motion (опционально)
VITE_COLLAB_SIGNALING=wss://...   # WebRTC signaling (опционально)
```

`.env` в gitignore. `VITE_*` попадают в клиентский бандл — не коммитить продакшн-ключи.

---

## 10. Зависимости и лицензии

- Код Lite — open source (LICENSE в репо)
- PMX/VMD/текстуры — права у авторов контента
- Pro — отдельный репозиторий и лицензия

---

## 11. Тесты и качество кода

- Автотестов почти нет
- `npm run lint` = только `tsc --noEmit`
- Крупный монолит `App.tsx` (~1000 строк)
- Два физических стека (Ammo + Jolt) — нужно понимать, что в проде активно

---

## 12. Зоны для глубокого анализа (задачи для AI)

1. Рефакторинг `App.tsx` — context, разбиение state
2. Производительность 9:16 на слабых GPU
3. Fallback если WebCodecs недоступен
4. Безопасность клиентских API keys
5. Мобильный UX — мало места под viewport + timeline
6. Покрытие тестами критичных путей (VMD load, export)
7. Согласованность Lite vs Pro — roadmap фич
8. Доступность (клавиатура, screen readers)
9. i18n (сейчас UI на английском)
10. Удаление/изоляция legacy папки `AnimeStageLite/`

---

## 13. Примеры промптов для анализа

```
По этому отчёту:
1. Нарисуй диаграмму потока данных от загрузки PMX до экспорта MP4.
2. Найди 10 главных технических долгов и расставь приоритеты.
3. Предложи план рефакторинга App.tsx без поломки функционала.
4. Сравни Lite с Pro и составь roadmap.
5. Что ещё не адаптировано для мобильных 375px?
6. Оцени риски безопасности (VITE_* в бандле, collab).
```

---

## 14. Итог одной фразой

**Браузерная MMD-студия на React + Three.js** с таймлайном, Bullet-физикой, RTX Lite FX, экспортом Shorts 9:16 и опциональными модулями mocap/AI/collab; лендинг на `/`, студия на `/app`; отдельный продукт **AnimaStage Pro**; мобильная вёрстка студии добавлена недавно, десктоп должен работать как раньше.

---

*Документ сгенерирован для передачи в GPT/Claude. Репозиторий: animastage-lite / web-mmd-suite.*
