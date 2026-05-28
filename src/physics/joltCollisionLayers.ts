import type { JoltModule } from './joltLoader';

/** Layer 0 — static environment (floor / grid). */
export const LAYER_STATIC = 0;
/** Layer 1 — kinematic body hitboxes driven by bones. */
export const LAYER_KINEMATIC = 1;
/** Layer 2 — dynamic hair / skirt / cloth rigid bodies. */
export const LAYER_DYNAMIC = 2;

export const NUM_OBJECT_LAYERS = 3;
export const NUM_BROAD_PHASE_LAYERS = 2;

export function setupJoltCollisionLayers(Jolt: JoltModule) {
  const objectFilter = new Jolt.ObjectLayerPairFilterTable(NUM_OBJECT_LAYERS);
  objectFilter.EnableCollision(LAYER_STATIC, LAYER_KINEMATIC);
  objectFilter.EnableCollision(LAYER_STATIC, LAYER_DYNAMIC);
  objectFilter.EnableCollision(LAYER_KINEMATIC, LAYER_DYNAMIC);
  objectFilter.EnableCollision(LAYER_DYNAMIC, LAYER_DYNAMIC);

  const bpStatic = new Jolt.BroadPhaseLayer(0);
  const bpMoving = new Jolt.BroadPhaseLayer(1);
  const bpInterface = new Jolt.BroadPhaseLayerInterfaceTable(
    NUM_OBJECT_LAYERS,
    NUM_BROAD_PHASE_LAYERS
  );
  bpInterface.MapObjectToBroadPhaseLayer(LAYER_STATIC, bpStatic);
  bpInterface.MapObjectToBroadPhaseLayer(LAYER_KINEMATIC, bpMoving);
  bpInterface.MapObjectToBroadPhaseLayer(LAYER_DYNAMIC, bpMoving);

  const objectVsBp = new Jolt.ObjectVsBroadPhaseLayerFilterTable(
    bpInterface,
    NUM_BROAD_PHASE_LAYERS,
    objectFilter,
    NUM_OBJECT_LAYERS
  );

  return { objectFilter, bpInterface, objectVsBp };
}

export function objectLayerForMmdBody(mmdType: number): number {
  return mmdType === 0 ? LAYER_KINEMATIC : LAYER_DYNAMIC;
}
