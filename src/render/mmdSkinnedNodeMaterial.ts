import * as THREE from 'three';
import { MeshBasicNodeMaterial, MeshToonNodeMaterial } from 'three/webgpu';

export type MmdSkinnedNodeMaterial = MeshToonNodeMaterial | MeshBasicNodeMaterial;

const WEBGPU_SKINNED_NODE_READY = 'webgpuSkinnedNodeReady';

/** Strip WebGL-only shader hooks that break WebGPU node pipeline compilation. */
export function cleanLegacyWebGlMaterialState(material: THREE.Material): void {
  const legacy = material as THREE.Material & {
    program?: unknown;
    onBeforeCompile?: ((...args: unknown[]) => void) | null;
    onBeforeRender?: ((...args: unknown[]) => void) | null;
    customProgramCacheKey?: (() => string) | null;
    skinning?: boolean;
    morphTargets?: boolean;
    morphNormals?: boolean;
  };

  delete legacy.program;
  delete legacy.onBeforeCompile;
  delete legacy.onBeforeRender;
  delete legacy.customProgramCacheKey;
  delete legacy.skinning;
  delete legacy.morphTargets;
  delete legacy.morphNormals;
}

/**
 * MeshToonNodeMaterial with GPU skinning via Three.js node system (WGSL).
 * SkinnedMesh + skinIndex/skinWeight attributes bind to vertex shader slots automatically.
 */
export function createMmdSkinnedToonNodeMaterial(
  params: THREE.MeshToonMaterialParameters = {}
): MeshToonNodeMaterial {
  const material = new MeshToonNodeMaterial(params);
  prepareMmdSkinnedNodeMaterial(material);
  return material;
}

export function prepareMmdSkinnedNodeMaterial(
  material: MmdSkinnedNodeMaterial
): void {
  if (material.userData[WEBGPU_SKINNED_NODE_READY]) return;
  cleanLegacyWebGlMaterialState(material);
  material.userData[WEBGPU_SKINNED_NODE_READY] = true;
}

export function isMmdSkinnedNodeMaterial(
  material: THREE.Material
): material is MmdSkinnedNodeMaterial {
  return (
    (material as MeshToonNodeMaterial).isMeshToonNodeMaterial === true ||
    (material as MeshBasicNodeMaterial).isMeshBasicNodeMaterial === true ||
    material.type === 'MeshToonNodeMaterial' ||
    material.type === 'MeshBasicNodeMaterial'
  );
}

/** Remove false-positive legacy type flags copied from MeshToonMaterial defaults. */
export function stripLegacyMaterialTypeFlags(material: MmdSkinnedNodeMaterial): void {
  delete (material as THREE.MeshToonMaterial & { isMeshToonMaterial?: boolean })
    .isMeshToonMaterial;
  delete (material as THREE.MeshBasicMaterial & { isMeshBasicMaterial?: boolean })
    .isMeshBasicMaterial;
}
