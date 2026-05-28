# AnimaStage Lite

**Web studio for MikuMikuDance** — preview and edit scenes in the browser: PMX/PMD models, VMD motion, timeline, cloth physics, cinematic lighting, and vertical video export without installing MikuMikuDance.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r184-black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)

---

## About

**AnimaStage Lite** is a browser workspace for MMD creators. It combines a WebGL 3D stage, motion playback and editing, camera and visual FX controls, and video recording in one interface.

The studio targets practical workflows: quick PMX/VMD preview, **9:16** clips for Shorts, Reels, and TikTok, **1080×1920** export with a clean frame (no grid, gizmos, or debug UI). **9:16 Lite** lowers GPU load and reduces WebGL context loss on weaker devices.

**Stack:** React 19, Three.js, React Three Fiber, Vite, TypeScript.

### Who it is for

| Audience | Use case |
|----------|----------|
| Short-form creators | Vertical video with an MMD character and controlled framing |
| MMD enthusiasts | PMX/VMD preview in the browser without desktop software |
| Clip editors | Timeline, camera, FX, and recording without OBS |
| Low-end hardware | Stable portrait mode with a lighter render path |

---

## Features

### Scene and models
- Drag & drop: `.pmx` / `.pmd`, textures, multiple `.vmd`, HDR environment
- Built-in presets or your own model
- Bone and root gizmos, morphs (eyes, mouth, brows)
- Timeline with keyframes and motion templates

### Motion and physics
- VMD playback, clip switching
- Bullet Physics: skirt, hair, accessories (`anytime` / `playtime` / `off`)
- IK, collisions, wind, cloth tuning

### Camera and framing
- **Free** (orbit) and **MMD** (VMD camera / keys)
- Camera bookmarks, orbits, **9:16** portrait, 2.39 letterbox
- Background slide for vertical video

### Visual (RTX Lite)
- Styles: Realistic, Anime, Neon, Concert, Portrait
- Weather, particles, bloom, DOF, vignette, SSAO-lite
- Material detailing, HDR drag-drop, lightweight post-processing

### Animation editor
- **Dopesheet** and **Curves** (Bézier) in timeline tabs
- **VMD** export, undo/redo, copy/paste/mirror, simplify and time-stretch tracks
- PMX bone hierarchy, materials panel, keyboard shortcuts

### Pro (sidebar → Pro)

| Module | Purpose |
|--------|---------|
| **Animation layers** | Weighted overlays, bone mask, solo/mute |
| **Mocap** | Video pose → timeline keys (MediaPipe) |
| **AI motion** | Gemini keyframe generate/infill (optional) |
| **Collab** | Local (same browser tabs) or WebRTC |

### Video recording
- **MP4 HQ** — frame-by-frame render (WebCodecs + mp4-muxer), Chrome / Edge
- **Live** — real-time canvas capture (WebM / MP4)
- Clean export without debug graphics
- **1080×1920** in 9:16 mode

---

## Quick start

**Requirements:** Node.js 18+ (20+ recommended), modern browser with **WebGL2**

```bash
npm install
npm run dev
```

Optional (AI in Pro): `copy .env.example .env` (Windows) or `cp .env.example .env` — see [Configuration](#configuration).

- **http://localhost:3000/** — landing page  
- **http://localhost:3000/app** — studio  

Drag PMX and VMD into the viewport or load a preset via **File**.

```bash
npm run build    # production → dist/
npm run preview  # preview production build
npm run lint     # TypeScript check
```

---

## Configuration

### `.env` and `.env.example`

| File | Purpose |
|------|---------|
| [`.env.example`](.env.example) | Template for GitHub — **no real secrets**, variable names only |
| `.env` | Your local secrets — **not committed** (see `.gitignore`) |

The `.env` file is usually **not** in the repo — you create it yourself. Dotfiles may be hidden in Explorer or the editor file tree.

**Create `.env` (Windows PowerShell):**

```powershell
cd e:\download\web-mmd-suite
copy .env.example .env
notepad .env
```

**Example `.env`:**

```env
VITE_GEMINI_API_KEY=your_key_from_Google_AI_Studio
```

Get a key: [Google AI Studio → API keys](https://aistudio.google.com/apikey). After saving, **restart** `npm run dev` so Vite picks up the variables.

In **Pro → AI**, the key is read in `src/ai/motionAi.ts` via `import.meta.env.VITE_GEMINI_API_KEY`. If empty, you will see: “Set VITE_GEMINI_API_KEY in .env”.

> **Note:** the `VITE_` prefix embeds the value in the client bundle. Do not put real keys in `.env.example` or commit `.env`. For public production, proxy requests through your own backend.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_GEMINI_API_KEY` | No | AI motion in **Pro → AI** (`.env` only) |
| `VITE_COLLAB_SIGNALING` | No | `wss://` signaling URLs for WebRTC |

**Collab modes**
- **Local** (default) — sync across tabs via `BroadcastChannel`
- **WebRTC** — enable in Pro; requires a signaling server (`VITE_COLLAB_SIGNALING`)

---

## UI map

| Task | Where |
|------|--------|
| Model / VMD | **File** or drag-drop |
| Light, style, weather | **FX** |
| MP4 / Live recording | **FX → Video** |
| Physics | **File** / MMD Lite panel |
| Timeline, dopesheet, curves | Bottom panel |
| Mocap, AI, layers, collab | **Sidebar → Pro** |
| 16:9 ↔ 9:16 | Viewport format toggle |

---

## Project structure

| Path | Role |
|------|------|
| `src/App.tsx` | App state, collab, recording |
| `src/components/Viewport.tsx` | Canvas, 16:9 / 9:16 layouts |
| `src/components/MMDModelWrapper.tsx` | PMX, VMD, physics, layers, gizmos |
| `src/pages/LandingPage.tsx` | Marketing landing at `/` |
| `src/editor/` | Dopesheet, curves, VMD export, layers |
| `src/video/` | MP4 HQ / Live, clean capture |
| `src/mocap/` | Video mocap |
| `src/ai/` | AI motion (Gemini) |
| `src/collab/` | Local + WebRTC (Yjs) |
| `src/postfx/` | Lite post-processing |
| `src/visualFx/` | RTX Lite, weather |
| `src/utils/mmdCharacterPhysics.ts` | Bullet / MMD physics |

More product notes: [docs/ANIMASTAGE_LITE.md](docs/ANIMASTAGE_LITE.md).

---

## Requirements

| Feature | Browser / environment |
|---------|------------------------|
| Core app | WebGL2 (recent Chrome, Edge, Firefox, Safari) |
| MP4 HQ | WebCodecs H.264 (best: Chrome / Edge) |
| AI motion | Gemini API key |
| WebRTC collab | Signaling server, stable network |
| Heavy PMX | Discrete GPU; weak PCs — use **9:16 Lite** |

---

## License and content

Application dependencies use their own licenses (see `package.json`).

**MMD models, motions, and textures** belong to their authors. Use only content you have rights to publish and record.

---

<p align="center">
  <strong>AnimaStage Lite</strong> · WebMMD Studio · <code>animastage-lite@1.0.0</code>
</p>
