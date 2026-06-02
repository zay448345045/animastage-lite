import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import type { CameraFocusTarget, CameraFramingMode } from '../types';
import { resolveStudioFocusPoint } from '../scene/cameraFocus';

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
  framing?: CameraFramingMode;
  followModelId?: string | null;
  focusTarget?: CameraFocusTarget;
}

export function CameraFollowProvider({
  children = null,
  enabled = true,
  framing = 'single',
  followModelId = null,
  focusTarget = 'body',
}: CameraFollowProviderProps) {
  const getHeadTarget = useCallback(
    (fallback: THREE.Vector3, out: THREE.Vector3) => {
      if (!enabled) {
        out.copy(fallback);
        return out;
      }
      resolveStudioFocusPoint(followModelId, framing, focusTarget, fallback, out);
      return out;
    },
    [enabled, followModelId, framing, focusTarget]
  );

  const value = useMemo(() => ({ getHeadTarget }), [getHeadTarget]);

  return (
    <CameraFollowContext.Provider value={value}>{children}</CameraFollowContext.Provider>
  );
}
