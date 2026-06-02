import type { MMDModel } from '../types';

/** Recommended max characters for stable recording on consumer GPUs. */
export const MAX_SCENE_CHARACTERS = 4;

/** Default stage slots — duo scene uses ±7 m spacing. */
const SPAWN_SLOTS: ReadonlyArray<{ x: number; y: number; z: number }> = [
  { x: -7, y: 0, z: 0 },
  { x: 7, y: 0, z: 0 },
  { x: -10, y: 0, z: 4 },
  { x: 10, y: 0, z: 4 },
];

export function canAddSceneCharacter(currentCount: number): boolean {
  return currentCount < MAX_SCENE_CHARACTERS;
}

export function getSpawnPositionForIndex(index: number): {
  x: number;
  y: number;
  z: number;
} {
  const slot = SPAWN_SLOTS[index];
  if (slot) return { ...slot };
  const ring = Math.floor(index / SPAWN_SLOTS.length) + 1;
  const angle = (index % SPAWN_SLOTS.length) * (Math.PI / 2);
  return {
    x: Math.cos(angle) * 8 * ring,
    y: 0,
    z: Math.sin(angle) * 5 * ring,
  };
}

export function getNextSpawnPosition(models: readonly MMDModel[]): {
  x: number;
  y: number;
  z: number;
} {
  return getSpawnPositionForIndex(models.length);
}

export function countVisibleModels(models: readonly MMDModel[]): number {
  return models.filter((m) => m.visible).length;
}
