import type { DemoGalleryCategory, DemoScene } from './types';

export const DEMO_CATEGORY_LABELS: Record<DemoGalleryCategory, string> = {
  dance: 'Dance',
  vtuber: 'VTuber',
  cinematic: 'Cinematic',
};

export const DEMO_CATALOG: DemoScene[] = [
  {
    kind: 'instant',
    id: 'party-dance',
    title: 'Party Dance',
    description: 'Neon drone cam + full-body dance loop.',
    category: 'dance',
    thumbnail: './demos/thumbs/party-dance.svg',
    tags: ['dance', 'neon', 'loop'],
    durationSec: 8,
    modelPreset: 'miku',
    templateId: 'emote_party_dance',
    templateMode: 'replace',
    featured: true,
  },
  {
    kind: 'instant',
    id: 'roller-dance',
    title: 'Roller Dance',
    description: 'Rollercoaster camera with side-swing emote.',
    category: 'dance',
    thumbnail: './demos/thumbs/roller-dance.svg',
    tags: ['dance', 'camera'],
    durationSec: 10,
    modelPreset: 'miku',
    templateId: 'emote_roller_dance',
    templateMode: 'replace',
  },
  {
    kind: 'instant',
    id: 'hype-bounce',
    title: 'Hype Bounce',
    description: 'Concert fly-cam and energetic bounce.',
    category: 'dance',
    thumbnail: './demos/thumbs/hype-bounce.svg',
    tags: ['dance', 'concert'],
    durationSec: 9,
    modelPreset: 'kizuna',
    templateId: 'emote_concert_finale',
    templateMode: 'replace',
  },
  {
    kind: 'instant',
    id: 'lobby-groove',
    title: 'Lobby Groove',
    description: 'VTuber-style lobby emote with drone orbit.',
    category: 'vtuber',
    thumbnail: './demos/thumbs/lobby-groove.svg',
    tags: ['vtuber', 'emote'],
    durationSec: 8,
    modelPreset: 'kizuna',
    templateId: 'emote_battle_highlight',
    templateMode: 'replace',
  },
  {
    kind: 'instant',
    id: 'victory-royale',
    title: 'Victory Royale',
    description: 'Epic sky sweep + victory flex pose.',
    category: 'vtuber',
    thumbnail: './demos/thumbs/victory-royale.svg',
    tags: ['vtuber', 'highlight'],
    durationSec: 9,
    modelPreset: 'miku',
    templateId: 'emote_victory_royale',
    templateMode: 'replace',
  },
  {
    kind: 'instant',
    id: 'greeting-wide',
    title: 'Stream Greeting',
    description: 'Wide static cam + friendly wave pose.',
    category: 'vtuber',
    thumbnail: './demos/thumbs/greeting-wide.svg',
    tags: ['vtuber', 'intro'],
    durationSec: 6,
    modelPreset: 'kizuna',
    templateId: 'combo_greeting_wide',
    templateMode: 'replace',
  },
  {
    kind: 'instant',
    id: 'cinematic-intro',
    title: 'Cinematic Intro',
    description: 'Slow dolly-in with surprised reaction.',
    category: 'cinematic',
    thumbnail: './demos/thumbs/cinematic-intro.svg',
    tags: ['film', 'dolly'],
    durationSec: 7,
    modelPreset: 'miku',
    templateId: 'combo_cinematic',
    templateMode: 'replace',
  },
  {
    kind: 'instant',
    id: 'showcase-orbit',
    title: 'Showcase Orbit',
    description: '360° orbit camera with arm wave.',
    category: 'cinematic',
    thumbnail: './demos/thumbs/showcase-orbit.svg',
    tags: ['orbit', 'showcase'],
    durationSec: 10,
    modelPreset: 'miku',
    templateId: 'combo_showcase',
    templateMode: 'replace',
  },
  {
    kind: 'instant',
    id: 'sky-flex',
    title: 'Sky Flex Drop',
    description: 'Skydive camera into victory flex.',
    category: 'cinematic',
    thumbnail: './demos/thumbs/sky-flex.svg',
    tags: ['dramatic', 'intro'],
    durationSec: 9,
    modelPreset: 'kizuna',
    templateId: 'emote_skydive_flex',
    templateMode: 'replace',
  },
  {
    kind: 'instant',
    id: 'corner-spotlight',
    title: 'Corner Spotlight',
    description: 'Slow orbit with stylized corner pose.',
    category: 'cinematic',
    thumbnail: './demos/thumbs/corner-spotlight.svg',
    tags: ['spotlight', 'pose'],
    durationSec: 8,
    modelPreset: 'miku',
    templateId: 'emote_corner_spotlight',
    templateMode: 'replace',
  },
];

export const FEATURED_DEMO_ID = 'party-dance';

export function getDemoScene(id: string): DemoScene | undefined {
  return DEMO_CATALOG.find((d) => d.id === id);
}

export function getFeaturedDemo(): DemoScene {
  return getDemoScene(FEATURED_DEMO_ID) ?? DEMO_CATALOG[0];
}

export function listDemosByCategory(category: DemoGalleryCategory | 'all'): DemoScene[] {
  if (category === 'all') return DEMO_CATALOG;
  return DEMO_CATALOG.filter((d) => d.category === category);
}
