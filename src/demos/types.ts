import type { ViewportFormat } from '../types';

/** Gallery categories shown in the UI filter bar. */
export type DemoGalleryCategory = 'dance' | 'vtuber' | 'cinematic';

/** Built-in scene: procedural/stock rig + timeline motion template (no PMX bundle required). */
export interface InstantDemoScene {
  kind: 'instant';
  id: string;
  title: string;
  description: string;
  category: DemoGalleryCategory;
  /** Path under public/, e.g. `/demos/thumbs/party-dance.svg` */
  thumbnail: string;
  tags: string[];
  /** Approximate loop length for the card badge. */
  durationSec: number;
  modelPreset: 'miku' | 'kizuna';
  templateId: string;
  templateMode?: 'replace' | 'merge';
  viewportFormat?: ViewportFormat;
  featured?: boolean;
}

/** Hosted PMX+VMD pack under `public/demos/<id>/manifest.json`. */
export interface PackDemoScene {
  kind: 'pack';
  id: string;
  title: string;
  description: string;
  category: DemoGalleryCategory;
  thumbnail: string;
  tags: string[];
  durationSec: number;
  manifestUrl: string;
  /** If pack fetch fails, fall back to this instant scene id. */
  fallbackInstantId?: string;
  featured?: boolean;
}

export type DemoScene = InstantDemoScene | PackDemoScene;

export interface DemoPackManifest {
  name: string;
  model: string;
  motions?: string[];
  camera?: string | null;
  /** Relative paths from manifest folder → resolved to absolute URLs in fileMap. */
  files: string[];
}
