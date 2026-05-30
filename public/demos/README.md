# Demo packs (optional PMX + VMD)

Instant demos in the app use the built-in preview rig + timeline templates (no files here).

To ship a **full PMX/VMD pack**:

1. Create `public/demos/<your-id>/` with `model.pmx`, textures, and `.vmd` files.
2. Add `manifest.json` (see `_example/manifest.json`).
3. Register a `pack` entry in `src/demos/demoCatalog.ts` with `manifestUrl: './demos/<your-id>/manifest.json'`.

The loader resolves HTTP URLs (no blob churn) via `src/demos/loadDemoScene.ts`.
