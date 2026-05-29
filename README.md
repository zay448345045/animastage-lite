<p align="center">
  <a href="https://animastage-lite.app/app">
    <img src="docs/images/studio-screenshot.png" alt="AnimaStage Lite — browser MMD studio" width="900"/>
  </a>
</p>

<h1 align="center">⚡ AnimaStage — Browser-Native MMD Studio</h1>

<p align="center">
  <b>Full MMD production in the browser. No install. No Windows lock-in. Just a tab.</b><br>
  <i>PMX · VMD · Timeline · Bullet Physics · MP4 Export · Shorts-Ready 9:16</i>
</p>

<p align="center">
  <a href="https://github.com/FBNonaMe/animastage-lite"><img src="https://img.shields.io/badge/Lite-1.0.0-blue" alt="Lite 1.0"/></a>
  <a href="https://github.com/gtausa197-svg/AnimaStage-Pro"><img src="https://img.shields.io/badge/Pro-5.0%2B-purple" alt="Pro 5.0+"/></a>
  <img src="https://img.shields.io/badge/Renderer-WebGL%202.0%20%2B%20Three.js-orange" alt="WebGL2"/>
  <img src="https://img.shields.io/badge/Physics-Bullet%20WASM-green" alt="Physics"/>
  <img src="https://img.shields.io/badge/Export-WebCodecs%20MP4-red" alt="Export"/>
  <img src="https://img.shields.io/badge/Format-PMX%20%2F%20PMD%20%2F%20VMD-purple" alt="Format"/>
  <img src="https://img.shields.io/badge/Shorts-9%3A16%20Ready-ff69b4" alt="Shorts"/>
  <a href="https://animastage-lite.app"><img src="https://img.shields.io/badge/🌐-Lite%20Demo-blue" alt="Lite Demo"/></a>
  <a href="https://animastagepro.dev/"><img src="https://img.shields.io/badge/🎬-Pro%20Demo-violet" alt="Pro Demo"/></a>
</p>

<p align="center">
  <b>This repository</b> → <a href="https://github.com/FBNonaMe/animastage-lite"><strong>AnimaStage Lite</strong></a> (open source)<br>
  <b>Sibling project</b> → <a href="https://animastagepro.dev/"><strong>AnimaStage Pro</strong></a> · <a href="https://github.com/gtausa197-svg/AnimaStage-Pro">source</a>
</p>

---

## 🎬 What is AnimaStage?

**AnimaStage** is a browser-native **MikuMikuDance** workflow — load PMX/PMD models and VMD motion, tune lighting and physics, edit on a timeline, and export video without desktop MMD or DirectX.

We ship **two editions** for different jobs:

| | [**AnimaStage Lite**](https://animastage-lite.app) · **this repo** | [**AnimaStage Pro**](https://animastagepro.dev/) · [GitHub](https://github.com/gtausa197-svg/AnimaStage-Pro) |
|---|---|---|
| **Focus** | Fast preview · Shorts / Reels / TikTok | Full cinematic production |
| **Live** | [animastage-lite.app](https://animastage-lite.app) · [Studio `/app`](https://animastage-lite.app/app) | [animastagepro.dev/](https://animastagepro.dev/) |
| **Source** | [FBNonaMe/animastage-lite](https://github.com/FBNonaMe/animastage-lite) | [gtausa197-svg/AnimaStage-Pro](https://github.com/gtausa197-svg/AnimaStage-Pro) |
| **Stack** | React 19 · Vite · R3F · TypeScript | WebGL EffectComposer pipeline |
| **Renderer** | WebGL 2.0, DPR 1× in 9:16 Lite | Full post-FX stack (SSAO, DOF, volumetrics, bloom) |
| **Physics** | Bullet WASM, presets | Bullet WASM, deep manual tuning |
| **Timeline** | VMD dopesheet, curves, VMD export | Dual timeline (VMD + cinematic camera) |
| **Characters** | Single scene focus | Multi-character, independent VMD per char |
| **Bone editor** | Root / bone gizmos, morph tracks | Full G/R/S bone editor in viewport |
| **Camera** | Bookmarks, 9:16, letterbox | Spline path, keyframes, track lock |
| **Export** | WebCodecs MP4 HQ + Live | WebCodecs + frame-by-frame HQ render |
| **Extra (Lite app)** | Mocap, AI keys, collab, anim layers | Scene editor, session JSON, weather presets |
| **Target** | Creators, low-spec machines | Studios, production teams |

> **Note:** In the Lite app, **Sidebar → Pro** means *advanced Lite modules* (mocap, AI, collab, layers) — not the separate **AnimaStage Pro** product.

**Lite idea:** ~80% visual impact at ~40% GPU load vs heavy desktop pipelines — ideal when stability and vertical export matter most.

---

## 🏆 Key numbers (Lite)

| Metric | Value |
|--------|-------|
| Formats | PMX, PMD, VMD, textures, HDR |
| Vertical export | **1080×1920** (9:16) |
| Physics | Ammo.js (Bullet), ~65 Hz, 3 substeps |
| Post-FX | RTX Lite — bloom, DOF, weather, SSAO-lite |
| Clean capture | No gizmos / grid in export |

---

## ✨ AnimaStage Lite — features (this repository)

<details open>
<summary><b>Click to expand Lite feature list</b></summary>

### Scene and models
- Drag & drop `.pmx` / `.pmd`, textures, multiple `.vmd`, HDR
- Presets or your own model · bone & root gizmos · morphs

### Motion and physics
- VMD playback · Bullet cloth (`anytime` / `playtime` / `off`) · wind · IK

### Camera and framing
- Free orbit & MMD camera · bookmarks · **9:16** · letterbox 2.39

### Visual (RTX Lite)
- Style presets · weather · bloom · DOF · vignette · HDR IBL

### Animation editor
- **Dopesheet** & **Curves** · **VMD export** · undo/redo · mirror / stretch

### Sidebar → Pro (Lite advanced)
| Module | Purpose |
|--------|---------|
| Animation layers | Weighted overlays, bone mask, solo/mute |
| Mocap | Video → keys (MediaPipe) |
| AI motion | Gemini keyframes (optional `VITE_GEMINI_API_KEY`) |
| Collab | Local tabs or WebRTC |

### Video
- **MP4 HQ** — WebCodecs + mp4-muxer (Chrome / Edge)
- **Live** — MediaRecorder · clean frame · **1080×1920** in 9:16

</details>

### What Pro adds ([demo](https://animastagepro.dev/) · [repo](https://github.com/gtausa197-svg/AnimaStage-Pro))

- Multi-character scenes with per-character VMD  
- Full bone animation editor (G/R/S, mirror, anatomy limits)  
- Cinematic camera spline + dual timeline  
- Full RTX-style composer (SSAO → DOF → volumetric → bloom → grade)  
- Scene outliner, session save/load JSON  
- See the [Pro demo](https://animastagepro.dev/) and [Pro repository](https://github.com/gtausa197-svg/AnimaStage-Pro) for the full pipeline  

---

## 🚀 Quick start — AnimaStage Lite

**Try online:** [animastage-lite.app/app](https://animastage-lite.app/app)

**Run locally** — Node.js 18+ and WebGL2:

```bash
git clone https://github.com/FBNonaMe/animastage-lite.git
cd animastage-lite
npm install
npm run dev
```

| URL | Page |
|-----|------|
| `http://localhost:3000/` | Landing |
| `http://localhost:3000/app` | Studio |

### Android app (download)

Debug APK for sideload: **[app-debug.apk](/app-debug.apk)** (~19 MB) — also linked on the [landing page](https://animastage-lite.app/#android).

Rebuild web + APK into `public/`:

```bash
cd android && gradlew.bat assembleDebug
cd .. && npm run sync:android:assets && npm run build
```

```bash
npm run build    # → dist/
npm run preview
npm run lint
```

Drag PMX + VMD into the viewport or use **File**.

### Configuration

Copy [`.env.example`](.env.example) → `.env` (optional, for AI / WebRTC collab):

```env
VITE_GEMINI_API_KEY=your_key_from_Google_AI_Studio
# VITE_COLLAB_SIGNALING=wss://your-signaling.example.com
```

Get a Gemini key: [Google AI Studio](https://aistudio.google.com/apikey). Restart `npm run dev` after editing `.env`.

> `VITE_*` values are embedded in the client bundle — do not commit real production secrets.

---

## 🎮 Lite — UI map

| Task | Where |
|------|--------|
| Model / VMD | **File** or drag-drop |
| Light, style, weather | **FX** |
| MP4 / Live | **FX → Video** |
| Physics | **File** / MMD Lite panel |
| Timeline, dopesheet, curves | Bottom panel |
| Mocap, AI, layers, collab | **Sidebar → Pro** |
| 16:9 ↔ 9:16 | Viewport format toggle |

---

## 🏗️ Lite — project structure

| Path | Role |
|------|------|
| `src/App.tsx` | App state, collab, recording |
| `src/components/MMDModelWrapper.tsx` | PMX, VMD, physics, layers |
| `src/pages/LandingPage.tsx` | Landing at `/` |
| `src/editor/` | Dopesheet, curves, VMD export |
| `src/video/` | MP4 HQ / Live, clean capture |
| `src/mocap/` · `src/ai/` · `src/collab/` | Optional Pro panel modules |
| `src/utils/mmdCharacterPhysics.ts` | Bullet / MMD physics |

Docs: [docs/ANIMASTAGE_LITE.md](docs/ANIMASTAGE_LITE.md) · Security: [SECURITY.md](SECURITY.md)

---

## 📊 Requirements

| Feature | Environment |
|---------|-------------|
| Core app | WebGL2 (Chrome, Edge, Firefox, Safari) |
| MP4 HQ | WebCodecs H.264 (best: Chrome / Edge) |
| AI motion | Gemini API key in `.env` |
| Heavy PMX | Discrete GPU; use **9:16 Lite** on weak PCs |

---

## 🤝 Links

| Edition | Website | Repository |
|---------|---------|------------|
| **Lite** | [animastage-lite.app](https://animastage-lite.app) | [github.com/FBNonaMe/animastage-lite](https://github.com/FBNonaMe/animastage-lite) |
| **Pro** | [animastagepro.dev/](https://animastagepro.dev/) | [github.com/gtausa197-svg/AnimaStage-Pro](https://github.com/gtausa197-svg/AnimaStage-Pro) |

Contributions welcome on **Lite** — issues and PRs on GitHub.

---

## 📄 Citation

```bibtex
@software{animastage2026,
  title   = {AnimaStage: Browser-Native MMD Studio},
  author  = {FBNonaMe},
  year    = {2026},
  url     = {https://animastage-lite.app}
}
```

---

## 📝 License and content

Open-source **AnimaStage Lite** — see `LICENSE` in this repository (if present) and third-party licenses in `package.json`.

**MMD models, motions, and textures** belong to their authors. Use only content you have rights to publish and record.

**AnimaStage Pro** is a separate project — [animastagepro.dev/](https://animastagepro.dev/) · [source](https://github.com/gtausa197-svg/AnimaStage-Pro) · see Pro `LICENSE` for terms.

---

<p align="center">
  <i>🎬 "Drop the PMX. Hit play. No install required."</i><br><br>
  <a href="https://animastage-lite.app/app"><b>AnimaStage Lite</b></a>
  &nbsp;·&nbsp;
  <a href="https://animastagepro.dev/"><b>AnimaStage Pro</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/gtausa197-svg/AnimaStage-Pro">Pro on GitHub</a><br>
  <code>animastage-lite@1.0.0</code>
</p>
