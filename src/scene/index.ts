export {
  MAX_SCENE_CHARACTERS,
  canAddSceneCharacter,
  getSpawnPositionForIndex,
  getNextSpawnPosition,
  countVisibleModels,
} from './sceneModelLayout';
export {
  shouldDeferPhysicsForModel,
  shouldUseLiteRenderForModel,
} from './multiModelPolicy';
export { registerCharacterRoot, resolveHeadTargetForCamera, resolveDuoHeadTargetForCamera, getRegisteredCharacterCount, computeDuoFovBoost } from './characterHeadRegistry';
export { patchStateForMultiCharacterLoad } from './multiCharacterPerf';
export {
  resolveCameraFramingFromModels,
  getStageTargetTuple,
  getStageTargetVector,
} from './cameraFraming';
