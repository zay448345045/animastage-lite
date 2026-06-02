import { useFrame } from '@react-three/fiber';
import type { SkinnedMesh } from 'three';
import {
  getHeavyMeshRuntime,
  updateHeavyMeshRuntime,
} from '../../render/heavyMesh';

interface HeavyMeshRuntimeSyncProps {
  mesh: SkinnedMesh;
}

/** LOD + cluster culling after animation frame (priority 2). */
export default function HeavyMeshRuntimeSync({ mesh }: HeavyMeshRuntimeSyncProps) {
  const state = getHeavyMeshRuntime(mesh);

  useFrame(({ camera }) => {
    if (!state) return;
    state.sourceMesh.geometry.computeBoundingSphere();
    updateHeavyMeshRuntime(state, camera);
  }, 2);

  return null;
}
