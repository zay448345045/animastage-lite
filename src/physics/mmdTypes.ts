/** MMD rigid-body / constraint data from `geometry.userData.MMD` (mmd-parser). */
export interface MMDRigidBodyDef {
  name?: string;
  englishName?: string;
  boneIndex: number;
  groupIndex: number;
  groupTarget: number;
  shapeType: number;
  width: number;
  height: number;
  depth: number;
  position: number[];
  rotation: number[];
  weight: number;
  positionDamping: number;
  rotationDamping: number;
  restitution: number;
  friction: number;
  /** 0 = kinematic, 1 = dynamic (pos+rot), 2 = dynamic (rot only) */
  type: number;
}

export interface MMDConstraintDef {
  name?: string;
  englishName?: string;
  type?: number;
  rigidBodyIndex1: number;
  rigidBodyIndex2: number;
  position: number[];
  rotation: number[];
  translationLimitation1: number[];
  translationLimitation2: number[];
  rotationLimitation1: number[];
  rotationLimitation2: number[];
  springPosition: number[];
  springRotation: number[];
}

export interface MMDPhysicsBundle {
  format?: string;
  rigidBodies?: MMDRigidBodyDef[];
  constraints?: MMDConstraintDef[];
  bones?: Array<{ name: string; index: number; rigidBodyType?: number }>;
}

export interface MMDPhysicsParams {
  unitStep?: number;
  maxStepNum?: number;
  gravity?: import('three').Vector3;
}

/** MMD shape types */
export const MMD_SHAPE_SPHERE = 0;
export const MMD_SHAPE_BOX = 1;
export const MMD_SHAPE_CAPSULE = 2;

/** MMD body types */
export const MMD_BODY_KINEMATIC = 0;
export const MMD_BODY_DYNAMIC = 1;
export const MMD_BODY_DYNAMIC_ROT = 2;
