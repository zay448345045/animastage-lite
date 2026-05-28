import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { findHeadWorldPosition } from '../utils/cameraFollow';

export interface CameraFollowApi {
  getHeadTarget: (fallback: THREE.Vector3, out: THREE.Vector3) => THREE.Vector3;
}

const CameraFollowContext = createContext<CameraFollowApi | null>(null);

export function useCameraFollowOptional(): CameraFollowApi | null {
  return useContext(CameraFollowContext);
}

interface CameraFollowProviderProps {
  children?: ReactNode;
  /** When false, always returns fallback (free orbit). */
  enabled?: boolean;
}

export function CameraFollowProvider({
  children = null,
  enabled = true,
}: CameraFollowProviderProps) {
  const { scene } = useThree();

  const getHeadTarget = useCallback(
    (fallback: THREE.Vector3, out: THREE.Vector3) => {
      if (!enabled) {
        out.copy(fallback);
        return out;
      }

      for (const child of scene.children) {
        const headPos = findHeadWorldPosition(child, out);
        if (headPos) return headPos;
      }

      out.copy(fallback);
      return out;
    },
    [enabled, scene]
  );

  const value = useMemo(() => ({ getHeadTarget }), [getHeadTarget]);

  return (
    <CameraFollowContext.Provider value={value}>{children}</CameraFollowContext.Provider>
  );
}
