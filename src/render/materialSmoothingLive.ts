/**
 * Live material smoothing — updates roughness/metalness only (no shader recompile).
 */
import * as THREE from 'three';

interface SmoothBase {
  rough: number;
  metal: number;
  skin: boolean;
  hair: boolean;
  eye: boolean;
  skinColor?: THREE.Color;
}

const SKIN_NAME = /肌|skin|顔|face|体|body/i;
const HAIR_NAME = /髪|hair|前髪/i;
const EYE_NAME = /目|eye|瞳|まぶた|睫毛/i;

function readLabel(mat: THREE.Material, meshName: string): string {
  return `${mat.name || ''} ${meshName}`;
}

/** Capture PBR bases once during initial detailing pass. */
export function captureMaterialSmoothingBases(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const meshName = mesh.name || '';
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material || !(material instanceof THREE.MeshStandardMaterial)) return;
      const mat = material as THREE.MeshStandardMaterial;
      if (mat.userData.mmdSmoothBase) return;
      const label = readLabel(mat, meshName);
      mat.userData.mmdSmoothBase = {
        rough: mat.roughness ?? 0.65,
        metal: mat.metalness ?? 0.05,
        skin: SKIN_NAME.test(label),
        hair: HAIR_NAME.test(label),
        eye: EYE_NAME.test(label),
        skinColor: mat.color?.clone(),
      } satisfies SmoothBase;
    });
  });
}

/** Uniform-style smoothing update — no material.needsUpdate, no pipeline rebuild. */
export function applyMaterialSmoothingLive(root: THREE.Object3D, smoothing: number): void {
  const smooth = THREE.MathUtils.clamp(smoothing, 0, 1);
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material || !(material instanceof THREE.MeshStandardMaterial)) return;
      const mat = material as THREE.MeshStandardMaterial;
      const base = mat.userData.mmdSmoothBase as SmoothBase | undefined;
      if (!base) return;

      mat.roughness = THREE.MathUtils.clamp(
        base.rough + smooth * (base.skin ? 0.08 : base.hair ? -0.06 : 0.04),
        0.18,
        0.95
      );
      mat.metalness = THREE.MathUtils.clamp(base.metal * (1 - smooth * 0.25), 0, 1);

      if (base.skin && base.skinColor && mat.color) {
        mat.color.copy(base.skinColor).lerp(new THREE.Color(0xfff0e8), 0.12 * smooth);
      }
      if (base.eye) {
        mat.roughness = Math.min(mat.roughness, 0.35);
      }
      if (base.hair) {
        mat.roughness = THREE.MathUtils.clamp(mat.roughness, 0.32, 0.62);
      }
    });
  });
}
