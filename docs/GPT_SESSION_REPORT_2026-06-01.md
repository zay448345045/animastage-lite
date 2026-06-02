# AnimaStage Lite — Full Development Report (May 31 – Jun 1, 2026)

**Purpose:** Context for GPT / code analysis — everything shipped in `web-mmd-suite` across recent sessions.  
**Repo:** AnimaStage Lite (browser MMD studio) · React 19 · Vite · R3F · TypeScript · WebGL2 · Bullet WASM  
**Live:** https://animastage-lite.app · Studio: `/app` · Viewer: `/viewer`

---

## 1. Executive summary

AnimaStage Lite evolved from a capable WebGL demo into a **shippable creator workflow**:

- **Multi-character import** (up to 4 PMX/PMD from ZIP/folder)
- **Product layer** (save/share, templates, Shorts, viewer/fork) without touching VMD/physics core
- **Generate Short** that **preserves user VMD** (no dance reset on 9:16 switch)
- **Camera that follows performers** during preview and export
- **UI/UX overhaul** (design system, modular sidebar, empty viewport)
- **Stable performance HUD** (frame time primary, CPU/GPU estimate, auto quality nudge)
- **Android v1.1.0** (Capacitor, landscape studio, ~57 MB APK)
- **Landing page** with full Android download section

**Explicitly NOT changed:** Bullet physics pipeline, `mmdFrameLoop`, VMD evaluation, core PMX skinning/morph solver.

---

## 2. Timeline by sprint

| Period | Theme | Outcome |
|--------|-------|---------|
| **31 May** | Import + perf + duo camera groundwork | 2–4 characters, ZIP, FPS/tris HUD, camera framing registry |
| **1 Jun** | Product layer + platform | Save/share/viewer, templates ~50s, onboarding, React stability |
| **2 Jun** | Shorts + camera + export | VMD-safe Shorts, stage auto-follow, Manual MMD orbit, MP4 hardening |
| **Jun 2026 (late)** | UI/UX + perf + Android + landing | Design system, stable FPS, APK v1.1.0, landing `#android` |

---

## 3. Multi-character import & ZIP

### Behavior
- Drop / folder / **ZIP** → up to **4** `.pmx` / `.pmd` models
- VMD files assigned round-robin across characters
- Auto stage placement for solo/duo (`getNextSpawnPosition`, ±7 m offset)
- Second+ character: `patchStateForMultiCharacterLoad` (physics `playtime`)

### ZIP hardening (Jun 2026)
- Recursive ZIP expansion (nested archives)
- Magic-byte ZIP detection
- Skip macOS junk (`__MACOSX`, `.DS_Store`)
- Extension from full path (not just basename) — fixes nested PMX in folders
- Clearer error messages

### Key files
```
src/utils/assetImport.ts
src/utils/mmdFiles.ts
src/components/FileUploader.tsx
src/App.tsx                    # handleLoadCustomModel — ProcessedMMDFiles[]
```

---

## 4. Product layer (`src/product/`)

Wraps the engine — **observer/controller pattern**, no changes to render loop or VMD eval.

| Submodule | Purpose |
|-----------|---------|
| `scene/` | Save/load `.animastage`, codec, Performance/Balanced/Quality modes |
| `share/` | Viewer URL, localStorage fallback, fork → `/app` |
| `viewer/` | Read-only route |
| `templates/` | Scene templates, `templateEngine`, ~50 s duration |
| `shorts/` | `ShortsGenerator`, `applyShortsPipeline` (VMD preserved) |
| `onboarding/` | Overlay, ResultFirstBar, first launch |
| `ux/` | Scene graph, Shorts UI, dialogs |
| `hooks/useProductLayer.ts` | Save, share, templates, Generate Short API |

### Routing
- `src/RootRouter.tsx` — `/`, `/app`, `/viewer`
- `src/pages/ViewerPage.tsx` — read-only + **Edit this** fork
- Beginner mode hides Advanced (Pro) modules in sidebar

---

## 5. Generate Short (VMD preserved)

### Problem solved
Previously, switching to 9:16 could **reset or replace** the user's VMD with procedural templates.

### Solution
- Dedicated pipeline: `product/shorts/applyShortsPipeline.ts`
- Does **not** call full `templateEngine.apply` for character motion
- Duration **20–90 s**, presets 15/30/50/60/90
- Per-character VMD picker + **Add VMD…**
- Preview bar: Auto frame / Manual / Free cam / Share / Export

### Key files
```
src/product/shorts/applyShortsPipeline.ts
src/product/shorts/ShortsGenerator.ts
src/product/ux/ShortsSetupDialog.tsx
src/product/ux/ShortsFlowBar.tsx
src/product/ux/ProductShortsFlow.tsx
```

---

## 6. Camera system

| Issue | Fix |
|-------|-----|
| Character left 9:16 frame during export | `StageAutoFollow` — snap while recording |
| Orbit locked at world origin | `cameraOrbitAnchor` + `offsetCameraSnapshotToFocus` |
| MMD + bloom framed on hand bone | lookAt on body focus, not VMD `cameraTarget` |
| User wants manual control | `manualCameraLock` + Orbit in MMD mode |

### Key files
```
src/product/camera/StageAutoFollow.tsx
src/product/camera/frameShortCamera.ts
src/scene/cameraFocus.ts
src/scene/cameraFraming.ts
src/scene/characterHeadRegistry.ts
src/context/CameraFollowContext.tsx
src/components/MMDCameraController.tsx
src/components/PortraitCameraFraming.tsx
```

### UX
- Camera hints auto-hide after **~2.5 s** (`src/hooks/useAutoDismiss.ts`)
- Manual MMD hint: "drag to orbit, turn off Manual in Camera Studio"

---

## 7. UI/UX overhaul (Jun 2026)

### Design system
```
styles/design-system.css       # CSS tokens + .ds-* classes
src/components/UI/             # Button, Panel, Select, Toggle, Slider,
                               # SectionHeader, CollapsibleSection
```

Three button variants: **primary**, **secondary**, **ghost**.

### Sidebar restructure
```
src/components/sidebar/
  LoadSection.tsx      # Import PMX/VMD/ZIP
  SceneSection.tsx     # Demo Gallery, backgrounds
  ControlsSection.tsx  # Pose Library, Analyzer, bones
  AdvancedSection.tsx  # Mocap, AI, collab, layers (was "Pro")
```

### Empty viewport
- `src/components/viewport/ViewportEmptyState.tsx`
- Centered card: "Add your first character" + **Try demo scene**
- Replaces floating drag-drop modal / onboarding overlay on viewport

### Production UI flag
- `src/config/debugUi.ts` → `DEBUG_UI = false`
- Hides: ROOT/GIZMO HUD, detailed perf overlay, auto-scale debug line, PerformanceDebugOverlay

### Refactored components
- `src/components/flow/StudioFlowBar.tsx`
- Partial: `CameraStudioPanel`, `DemoConversionBridge`, `Sidebar`

### Copy
- Removed emoji clutter and internal dev language from studio + landing

---

## 8. Performance monitoring (stable FPS)

### Problem
Batch FPS over 400 ms windows caused **900 FPS spikes** and **2 FPS drops** — misleading.

### Solution

| Component | Role |
|-----------|------|
| `src/perf/stableFps.ts` | 60-sample rolling avg; warmup 10 frames; cap 120 FPS; max delta 250 ms |
| `src/perf/frameCpuGpuTiming.ts` | CPU = JS phase; GPU = gap until next frame (no `EXT_disjoint_timer_query`) |
| `src/perf/stablePerfResponse.ts` | >25 ms × 10 frames → reduce quality; <16 ms × 2 s → recover |
| `src/perf/perfStore.ts` | `recordFrameDelta()`, display rings, snapshot fields |
| `src/components/ViewportPerfMonitor.tsx` | Per-frame `delta` via R3F, not batch elapsed |
| `src/components/perf/PerfFrameSync.tsx` | Bookends CPU/GPU timing hooks |

### HUD display (bottom-right viewport)
```
Frame 16.9 ms    ← primary (color: Smooth / Okay / Lagging)
FPS 58 · Smooth
CPU 8 ms · GPU 9 ms
Status Balanced  ← CPU bottleneck / GPU bottleneck / Balanced
```

### Perf toast
- `src/product/ui/PerformanceOverlay.tsx` — "Optimizing for your device"
- Auto-hide 2.5 s via `useAutoDismiss`

### Auto quality response
- Sustained frame time >25 ms → nudge `tickPerfGovernor` (resolution/FX down)
- Stable <16 ms for 2 s → slowly recover quality
- Skipped during video recording

---

## 9. MP4 export hardening

```
src/video/mmdVideoRecorder.ts
```

- `VideoFrame.close()` + drain `encodeQueueSize`
- Recreate `VideoEncoder` on `QuotaExceededError` / codec reclaimed
- `useVideoRecorder` — 3× `requestAnimationFrame` before each captured frame

---

## 10. Android app (Capacitor v1.1.0)

### Version
```
android/version.properties
  VERSION_CODE=2
  VERSION_NAME=1.1.0
```

### APK
- Path: `public/app-debug.apk` (~57 MB)
- Build: `npm run sync:android:assets` (build web → copy assets → gradlew → copy APK)

### Native behavior
```
android/app/src/main/java/.../MainActivity.java
  - SCREEN_ORIENTATION_SENSOR_LANDSCAPE
  - Immersive fullscreen (hide status/nav bars)

android/app/src/main/AndroidManifest.xml
  - android:screenOrientation="sensorLandscape"

src/native/nativeStudioBootstrap.ts
  - Boot to /app (skip landing in WebView)
  - Balanced quality defaults (qualityModeToPatch)
```

### Landing integration
```
src/pages/LandingPage.tsx  # section #android
  - Download APK (57 MB)
  - What's new, requirements, install steps
  - Direct URL: /app-debug.apk
public/vercel.json         # Content-Type for APK download
```

---

## 11. Bug fixes

| Bug | Cause | Fix |
|-----|-------|-----|
| `Cannot access 'product' before initialization` | `useEffect` used `product` before `useProductLayer` | Moved effect after hook; uses `dismissOnboardingRef` |
| ZIP import: "Please drop at least one .pmd or .pmx" | Flat ZIP, wrong extension parsing | Recursive expansion, path-based extension, magic bytes |
| TypeScript: `frameMs` not on PerformanceOverlayProps | Two components named `PerformanceOverlay` | Renamed debug overlay → `PerformanceDebugOverlay.tsx`; export props type |
| Noisy FPS HUD | Batch `(frames×1000)/elapsed` | Per-frame rolling average |

---

## 12. Stability (cross-cutting)

- Product hooks: refs + stable signatures — no "Maximum update depth"
- `ProductShortsFlow` isolates shorts UI state
- EffectComposer: deferred mount, SSAO only when enabled
- Landing: removed forced `/` → `/app` redirect
- Templates: `DEFAULT_TEMPLATE_DURATION_SEC = 50`
- Analyzer debounce; collab sync decoupled from full `models` array

---

## 13. Documentation updated

| File | Content |
|------|---------|
| `README.md` | Full changelog, UI/UX, Android, perf HUD, paths |
| `docs/CHANGELOG_2026-05-31_2026-06-02.md` | Day-by-day dev log |
| `docs/PRODUCT_UPDATE_2026-05-31_2026-06-02.md` | Dev.to / Reddit / social copy |
| `docs/GPT_ANALYSIS_REPORT.md` | Architecture report (earlier) |
| `docs/GPT_SESSION_REPORT_2026-06-01.md` | This file |
| `android/README.md` | APK build + v1.1.0 notes |

---

## 14. Complete file map (new / materially changed)

```
# UI / Design
styles/design-system.css
src/components/UI/*
src/components/sidebar/*
src/components/viewport/ViewportEmptyState.tsx
src/config/debugUi.ts
src/hooks/useAutoDismiss.ts

# Performance
src/perf/stableFps.ts
src/perf/frameCpuGpuTiming.ts
src/perf/stablePerfResponse.ts
src/perf/perfStore.ts
src/perf/perfTypes.ts
src/components/ViewportPerfMonitor.tsx
src/components/perf/PerfFrameSync.tsx
src/components/perf/PerformanceDebugOverlay.tsx   # renamed from PerformanceOverlay

# Import
src/utils/assetImport.ts
src/components/FileUploader.tsx

# Product layer
src/product/**

# Camera
src/scene/cameraFocus.ts
src/scene/cameraFraming.ts
src/scene/characterHeadRegistry.ts
src/product/camera/StageAutoFollow.tsx

# Shorts / export
src/product/shorts/applyShortsPipeline.ts
src/video/mmdVideoRecorder.ts

# Platform
src/RootRouter.tsx
src/pages/ViewerPage.tsx
src/pages/LandingPage.tsx
src/native/nativeStudioBootstrap.ts

# Android
android/
android/version.properties
scripts/sync-android-assets.ps1
public/app-debug.apk
```

---

## 15. Architecture constraints (for GPT)

When analyzing or suggesting changes:

1. **Product layer** must not modify VMD evaluation, WASM Bullet step order, or core render loop.
2. **Perf layer** is observer + controller only — governors nudge DPR/FX, never block rAF.
3. **No heavy GPU profiling** — no `EXT_disjoint_timer_query` requirement.
4. **`DEBUG_UI = false`** in production — dev overlays gated.
5. **Android** = same web bundle in WebView; native code only for orientation, immersive UI, boot route.

---

## 16. Suggested GPT analysis prompts

```
1. Review src/product/ isolation — does any code path still mutate VMD eval or physics order?

2. Analyze stableFps + frameCpuGpuTiming + perfGovernor interaction — any feedback loops or double-degrade?

3. Compare applyShortsPipeline vs templateEngine — motion ownership and edge cases when user adds VMD mid-Short.

4. Camera: cameraOrbitAnchor + StageAutoFollow + manualCameraLock — state machine gaps for duo export?

5. assetImport recursive ZIP — security/size limits and failure modes for untrusted archives.

6. Android WebView: balanced defaults vs desktop — what breaks on Mali/Adreno low-end?

7. UI migration status — which panels still use legacy Tailwind buttons vs design-system Button?
```

---

## 17. Build & deploy commands

```bash
npm run dev              # localhost:3000
npm run build            # dist/ (+ public/app-debug.apk copied)
npm run sync:android:assets   # web → android assets → APK → public/
```

URLs:
- `/` landing (Android download `#android`)
- `/app` studio
- `/viewer?scene=…` read-only
- `/app?demo=party-dance` featured demo

---

*Generated for GPT context — AnimaStage Lite session report, Jun 1 2026.*
