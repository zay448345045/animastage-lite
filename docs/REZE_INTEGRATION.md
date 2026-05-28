# Animation editor integration

Implemented in AnimaStage Lite (WebGL editor features, no external engine copy).

## Backup

`backup/pre-reze-integration/` — physics and core snapshots before editor integration. See README in that folder.

## Added

| Feature | Where |
|---------|--------|
| Dopesheet | Timeline → **Dopesheet** tab |
| Curve editor + Bézier | Timeline → **Curves** |
| Export VMD | File → Export VMD… |
| New clip | File → New Clip |
| Undo / Redo | Edit, Ctrl+Z / Ctrl+Y |
| Copy / Paste / Mirror paste | Ctrl+C / V / Shift+V |
| Simplify / Clear track | Edit |
| Time stretch | Edit ×1.25 / ×0.8 |
| Home / End / arrows | Keyboard |
| Unsaved warning | Tab close when `clipDirty` |
| Bone hierarchy (PMX) | Sidebar → **Edit** |
| Materials + highlight | Sidebar → Edit |
| Morph list | Sidebar → Edit |
| Double-click bone pick | Viewport |
| Animation layers (schema) | `animLayers` on model |

## Pro features (Sidebar → **Pro**)

| Feature | Description |
|---------|-------------|
| **Animation layers** | Weighted overlay blend + bone mask + solo groups |
| **Mocap** | Video → keys (MediaPipe Pose, `@mediapipe/tasks-vision`) |
| **Collaboration** | Yjs + WebRTC P2P, room + clip sync |
| **AI motion** | Gemini: Generate / Infill / Retarget (`VITE_GEMINI_API_KEY`) |

## Not included

- WebGPU / external native engine (stays on WebGL)

## Physics

Bullet files were **not changed** in core logic — only `MMDModelApi.setMaterialHighlight` and PMX metadata on load.
