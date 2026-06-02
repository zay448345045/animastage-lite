/**
 * @deprecated Use `product/scene` — kept for backward compatibility.
 */
export * from '../product/scene/types';
export {
  serializeScene as buildAnimaStageProject,
  migrateV1ToV2,
} from '../product/scene/serialize';
export {
  deserializeScene as applyAnimaStageProject,
  getCameraTemplateForScene as getCameraTemplateForProject,
} from '../product/scene/deserialize';
export * from '../product/scene/qualityMode';
export {
  CAMERA_PRESET_TEMPLATES,
  pickCameraPresetForModelCount,
} from '../product/templates/cameraPresets';
export { buildCreateShortPlan as buildCreateShortPatch } from '../product/shorts/generateShort';
export * from '../product/scene/codec';
export * from '../product/share/shareLink';
