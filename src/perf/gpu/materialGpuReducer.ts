import * as THREE from 'three';

const reducedMeshes = new WeakSet<THREE.Mesh>();

function meshAlreadyGpuReduced(
  mesh: THREE.Mesh,
  options: { reduceTransparency: boolean; simplified: boolean }
): boolean {
  if (!reducedMeshes.has(mesh)) return false;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  if (options.simplified) {
    return materials.every(
      (m) => (m as THREE.Material & { userData?: Record<string, unknown> })?.userData?.gpuSimplified
    );
  }
  return !options.reduceTransparency;
}

/** Reduce GPU fill cost — keeps geometry, only simplifies material state. */
export function applyMaterialGpuReduction(
  root: THREE.Object3D,
  options: { reduceTransparency: boolean; simplified: boolean }
): void {
  if (!options.reduceTransparency && !options.simplified) return;

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    if (meshAlreadyGpuReduced(mesh, options)) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material) return;
      const mat = material as THREE.Material & {
        transparent?: boolean;
        opacity?: number;
        depthWrite?: boolean;
        side?: THREE.Side;
        userData?: Record<string, unknown>;
      };

      if (options.reduceTransparency && mat.transparent && (mat.opacity ?? 1) > 0.99) {
        mat.transparent = false;
        mat.depthWrite = true;
        mat.needsUpdate = true;
      }

      if (options.simplified) {
        if (mat.side === THREE.DoubleSide) {
          mat.side = THREE.FrontSide;
          mat.needsUpdate = true;
        }
        mat.userData = mat.userData ?? {};
        mat.userData.gpuSimplified = true;
      }
    });

    reducedMeshes.add(mesh);
  });
}

export function countMeshMaterials(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    count += Array.isArray(mesh.material) ? mesh.material.length : 1;
  });
  return count;
}
