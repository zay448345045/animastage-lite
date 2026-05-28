/**
 * Pleasant MMD material detailing — softer PBR, light smoothing, eye-friendly contrast.
 * Complements enhanceMmdMaterials + applyCharacterMaterialQuality.
 */
import * as THREE from 'three';
import type { ViewportFormat } from '../types';
import { isPortraitFormat } from './characterQuality';

export interface MaterialDetailingOptions {
  /** Overall smoothing 0..1 (roughness bump, specular soften). */
  smoothing?: number;
  /** Subsurface-style warmth on skin. */
  skinWarmth?: number;
  /** Env reflection strength multiplier. */
  envIntensity?: number;
  viewportFormat?: ViewportFormat;
}

const SKIN_NAME = /肌|skin|顔|face|体|body/i;
const HAIR_NAME = /髪|hair|前髪/i;
const EYE_NAME = /目|eye|瞳|まぶた|睫毛/i;

function isSkin(name: string): boolean {
  return SKIN_NAME.test(name);
}

function isHair(name: string): boolean {
  return HAIR_NAME.test(name);
}

function isEye(name: string): boolean {
  return EYE_NAME.test(name);
}

/**
 * Post-process materials for a softer, more detailed look (mmd_rtx material pass lite).
 */
export function applyMaterialDetailingAndSmoothing(
  root: THREE.Object3D,
  options: MaterialDetailingOptions = {}
): void {
  const portrait = isPortraitFormat(options.viewportFormat ?? '16:9');
  const smooth = Math.min(1, Math.max(0, options.smoothing ?? (portrait ? 0.35 : 0.55)));
  const skinWarm = options.skinWarmth ?? 0.12;
  const envMul = options.envIntensity ?? (portrait ? 0.85 : 1.0);

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const meshName = mesh.name || '';
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material) => {
      if (!material) return;
      const mat = material as THREE.MeshStandardMaterial & {
        map?: THREE.Texture;
        normalMap?: THREE.Texture;
        userData: Record<string, unknown>;
      };

      if (mat.userData.mmdDetailed) return;

      const label = `${mat.name || ''} ${meshName}`;
      const skin = isSkin(label);
      const hair = isHair(label);
      const eye = isEye(label);

      if (mat instanceof THREE.MeshStandardMaterial) {
        const baseRough = mat.roughness ?? 0.65;
        const baseMetal = mat.metalness ?? 0.05;
        mat.roughness = THREE.MathUtils.clamp(
          baseRough + smooth * (skin ? 0.08 : hair ? -0.06 : 0.04),
          0.18,
          0.95
        );
        mat.metalness = THREE.MathUtils.clamp(
          baseMetal * (1 - smooth * 0.25),
          0,
          1
        );

        if (skin && mat.color) {
          mat.color.lerp(new THREE.Color(0xfff0e8), skinWarm * smooth);
        }

        mat.envMapIntensity = (mat.envMapIntensity ?? 1) * envMul;

        if (eye) {
          mat.roughness = Math.min(mat.roughness, 0.35);
          mat.emissiveIntensity = Math.min(mat.emissiveIntensity ?? 1, 0.85);
        }

        if (hair) {
          mat.roughness = THREE.MathUtils.clamp(mat.roughness, 0.32, 0.62);
        }
      }

      if (mat.map) {
        mat.map.anisotropy = Math.max(mat.map.anisotropy ?? 1, portrait ? 4 : 8);
        if (!portrait) {
          mat.map.minFilter = THREE.LinearMipMapLinearFilter;
          mat.map.generateMipmaps = true;
        }
      }

      mat.userData.mmdDetailed = true;
      mat.needsUpdate = true;
    });

    if (mesh.geometry && !portrait) {
      const geo = mesh.geometry as THREE.BufferGeometry;
      if (!geo.attributes.normal && geo.attributes.position) {
        geo.computeVertexNormals();
      }
    }
  });
}
