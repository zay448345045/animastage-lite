import type { MorphState } from '../types';

/** Degrees — offsets from PMX bind/rest pose (same convention as timeline bones). */
export interface PoseBoneRotation {
  x: number;
  y: number;
  z: number;
}

export interface PoseSnapshotV1 {
  version: 1;
  id: string;
  name: string;
  /** Emoji or 1–2 letter thumbnail label for UI grid */
  thumbnail: string;
  morphs: MorphState;
  /** Simplified rig bone ids: head, neck, spine, waist, arm_L, arm_R */
  bones: Record<string, PoseBoneRotation>;
  /** Optional per-PMX-bone overrides (degrees from rest). */
  pmxBones?: Record<string, PoseBoneRotation>;
}

export type PoseLibraryEntry = PoseSnapshotV1;

export function createPoseId(): string {
  return `pose_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
