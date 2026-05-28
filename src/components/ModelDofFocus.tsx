import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const HEAD_BONE_NAMES = ['頭', 'head', 'Head', 'HEAD', '頭点'];
const TORSO_FALLBACK_Y = 11;

interface ModelDofFocusProps {
  enabled: boolean;
  modelOffset?: { x: number; y: number; z: number };
  onFocusPoint: (point: THREE.Vector3) => void;
}

function findHeadBone(root: THREE.Object3D): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (found) return;
    if (!(obj instanceof THREE.Bone) && obj.type !== 'Bone') return;
    const name = obj.name;
    if (HEAD_BONE_NAMES.some((n) => name === n || name.includes(n))) {
      found = obj;
    }
  });
  return found;
}

/** Tracks head (or torso) world position for DepthOfField focus target. */
export default function ModelDofFocus({
  enabled,
  modelOffset = { x: 0, y: 0, z: 0 },
  onFocusPoint,
}: ModelDofFocusProps) {
  const { scene } = useThree();
  const worldPos = useRef(new THREE.Vector3());
  const fallback = useRef(
    new THREE.Vector3(modelOffset.x, TORSO_FALLBACK_Y + modelOffset.y, modelOffset.z)
  );

  useFrame(() => {
    if (!enabled) return;

    let head: THREE.Object3D | null = null;
    for (const child of scene.children) {
      head = findHeadBone(child);
      if (head) break;
    }

    if (head) {
      head.getWorldPosition(worldPos.current);
    } else {
      worldPos.current.copy(fallback.current);
      fallback.current.set(
        modelOffset.x,
        TORSO_FALLBACK_Y + modelOffset.y,
        modelOffset.z
      );
    }

    onFocusPoint(worldPos.current);
  });

  return null;
}
