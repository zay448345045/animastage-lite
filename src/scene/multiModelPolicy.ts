import type { MMDModel } from '../types';
import { isUltraHeavyMeshActive } from '../render/heavyMesh';
import { countVisibleModels } from './sceneModelLayout';

/** Background characters skip physics only on ultra-heavy multi-character scenes. */
export function shouldDeferPhysicsForModel(
  modelId: string,
  selectedModelId: string | null | undefined,
  models: readonly MMDModel[]
): boolean {
  const visible = countVisibleModels(models);
  if (visible <= 1) return false;
  if (!isUltraHeavyMeshActive()) return false;
  return modelId !== selectedModelId;
}

/** Lite material path only for non-selected models in ultra-heavy duo scenes. */
export function shouldUseLiteRenderForModel(
  modelId: string,
  selectedModelId: string | null | undefined,
  models: readonly MMDModel[]
): boolean {
  const visible = countVisibleModels(models);
  if (visible <= 1) return false;
  if (!isUltraHeavyMeshActive()) return false;
  return modelId !== selectedModelId;
}
