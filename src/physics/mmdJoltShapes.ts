import type { JoltModule } from './joltLoader';
import {
  MMD_SHAPE_BOX,
  MMD_SHAPE_CAPSULE,
  MMD_SHAPE_SPHERE,
  type MMDRigidBodyDef,
} from './mmdTypes';

export function createMmdJoltShape(Jolt: JoltModule, params: MMDRigidBodyDef): JoltModule['Shape'] {
  switch (params.shapeType) {
    case MMD_SHAPE_SPHERE:
      return new Jolt.SphereShape(Math.max(params.width, 0.01), null);
    case MMD_SHAPE_BOX: {
      const he = new Jolt.Vec3(
        Math.max(params.width, 0.01),
        Math.max(params.height, 0.01),
        Math.max(params.depth, 0.01)
      );
      const shape = new Jolt.BoxShape(he, 0.05, null);
      Jolt.destroy(he);
      return shape;
    }
    case MMD_SHAPE_CAPSULE: {
      const radius = Math.max(params.width, 0.01);
      const halfHeight = Math.max(params.height * 0.5, 0.01);
      return new Jolt.CapsuleShape(halfHeight, radius, null);
    }
    default:
      return new Jolt.SphereShape(0.5, null);
  }
}
