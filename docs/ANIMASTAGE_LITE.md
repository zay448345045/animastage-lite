# AnimaStage Lite

**Tagline:**  
*MMD in the browser — motion, physics, lighting, and Shorts in minutes.*

**Extended tagline:**  
*AnimaStage Lite is a lightweight web studio for MikuMikuDance: load a model, play VMD, frame the shot, and export vertical video without desktop software.*

---

## What it is

**AnimaStage Lite** is the streamlined edition of **WebMMD Studio** (web-mmd-suite). It is not a full MikuMikuDance clone or a heavy offline renderer — it is a **working browser stage** focused on:

- stable WebGL (especially **9:16**);
- an approachable timeline and presets;
- video export without gizmos or debug UI;
- cloth physics and RTX-style presets in a **Lite** implementation.

---

## Who it is for

| Audience | Goal |
|----------|------|
| Shorts / TikTok / Reels creators | Vertical video with an MMD character |
| MMD newcomers | Quick PMX/VMD preview in the browser |
| Clip authors | Timeline, templates, camera, recording without OBS |
| Weak GPUs | 9:16 Lite — lower load, fewer context losses |

---

## AnimaStage Lite vs full RTX

| | **AnimaStage Lite** | Full MMD RTX (reference) |
|---|---------------------|---------------------------|
| Launch | Browser, Vite | HTML + vendor, heavy composer |
| Post-FX | SSAO-lite, bloom, SMAA, god rays (limited) | TAA, volumetrics, full SSAO, reflector floor |
| 9:16 | DPR 1, no shadows/RTX in portrait | Context loss risk |
| Recording | WebCodecs MP4 + MediaRecorder Live | Same + offline path |
| Scene editor | Simplified (models, FX, camera) | Outliner, user lights, path editor |
| Physics | Bullet, wind, IK fix, cloth on VMD | Similar |

**Lite idea:** ~80% of the visual impact at ~40% GPU load.

---

## Product modules

### Stage
- Viewport **16:9** (edit) and **9:16** (Shorts)
- HDR drag-drop, background image, 2.39 letterbox

### Motion
- VMD playback, dance/emotion templates
- Timeline: morphs + simplified bones
- MMD 30 FPS, playhead without extra React churn

### Physics
- Modes `anytime` / `playtime` / `off`
- Skirt, hair, accessories; restart physics from UI

### Look
- RTX Lite styles (Realistic, Anime, …)
- Material detailing, smoothing
- Weather: rain, snow, fog

### Capture
- **MP4 HQ** — frame-by-frame, 1080×1920 in 9:16
- **Live** — real-time
- Clean capture: no gizmo arrows, grid, or bones

---

## Store / landing copy

### One line
```
AnimaStage Lite — browser MMD studio: VMD, physics, lighting, Shorts export 1080×1920.
```

### Short description
```
AnimaStage Lite is a lightweight browser studio for MMD models. Drop PMX/PMD and VMD files, preview motion with Bullet cloth physics, apply cinematic FX presets, edit on a timeline, and export MP4 — including 1080×1920 vertical for Shorts. Portrait Lite mode keeps WebGL stable on modest GPUs. Clean capture hides editor gizmos from your recordings.
```

### Marketing bullets
- MMD in the browser — no install
- VMD + timeline + motion templates
- Cloth physics (Bullet)
- RTX Lite: lighting, weather, bloom, DOF
- MP4 HQ and Live recording
- 9:16 with Full HD vertical export
- Drag & drop PMX, textures, HDR

### Hashtags
```
#MMD #MikuMikuDance #PMX #VMD #Shorts #TikTok #3D #WebGL #VTuber #AnimaStage
```

---

## Versioning (proposal)

| Version | Scope |
|---------|--------|
| **AnimaStage Lite 1.0** | Current web-mmd-suite: stage, VMD, physics, FX Lite, recording |
| **AnimaStage Pro** *(planned)* | Full RTX stack, path camera, scene editor, offline farm |
| **AnimaStage Cloud** *(planned)* | Cloud render, scene sharing |

The UI may still show **WebMMD v1.0.0** — rebrand to **AnimaStage Lite 1.0** when ready.

---

## FAQ

**Do I need MikuMikuDance?**  
Not for preview and recording. Prepare PMX/VMD in MMD or download ready-made assets.

**Why does MP4 HQ fail?**  
You need Chrome/Edge with WebCodecs. Otherwise use **Live**.

**Why does 9:16 go blank?**  
Lite mode is active: lower quality, avoid RTX in portrait, wait for canvas recovery.

**Gizmos visible in video?**  
Gizmos hide during recording; wait for capture to start after MP4 HQ / Live.

---

*Document for the web-mmd-suite repository. Update when adding Pro features.*
