import type { DemoGalleryCategory } from './types';

/** Lightweight list for the marketing page (no template / loader imports). */
export interface LandingDemoPreview {
  id: string;
  title: string;
  category: DemoGalleryCategory;
  thumbnail: string;
}

export const LANDING_PREVIEW_DEMOS: LandingDemoPreview[] = [
  { id: 'party-dance', title: 'Party Dance', category: 'dance', thumbnail: './demos/thumbs/party-dance.svg' },
  { id: 'roller-dance', title: 'Roller Dance', category: 'dance', thumbnail: './demos/thumbs/roller-dance.svg' },
  { id: 'lobby-groove', title: 'Lobby Groove', category: 'vtuber', thumbnail: './demos/thumbs/lobby-groove.svg' },
  { id: 'victory-royale', title: 'Victory Royale', category: 'vtuber', thumbnail: './demos/thumbs/victory-royale.svg' },
  { id: 'cinematic-intro', title: 'Cinematic Intro', category: 'cinematic', thumbnail: './demos/thumbs/cinematic-intro.svg' },
  { id: 'showcase-orbit', title: 'Showcase Orbit', category: 'cinematic', thumbnail: './demos/thumbs/showcase-orbit.svg' },
];
