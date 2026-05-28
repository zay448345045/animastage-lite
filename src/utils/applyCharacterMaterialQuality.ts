import * as THREE from 'three';
import type { ViewportFormat } from '../types';
import type { CharacterQuality } from './characterQuality';
import { getCharacterQualityGpu } from './characterQuality';

/** Sharper texture filtering for HD / 4K tiers. */
export function applyCharacterMaterialQuality(
  root: THREE.Object3D,
  quality: CharacterQuality,
  renderer?: THREE.WebGLRenderer,
  viewportFormat: ViewportFormat = '16:9'
): void {
  const { textureAnisotropy } = getCharacterQualityGpu(quality, viewportFormat);
  const maxAniso = renderer?.capabilities.getMaxAnisotropy?.() ?? textureAnisotropy;
  const aniso = Math.min(textureAnisotropy, maxAniso);

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material) => {
      if (!material) return;
      const mat = material as THREE.MeshStandardMaterial & {
        map?: THREE.Texture;
        alphaMap?: THREE.Texture;
        emissiveMap?: THREE.Texture;
        normalMap?: THREE.Texture;
        roughnessMap?: THREE.Texture;
        metalnessMap?: THREE.Texture;
      };

      const maps = [
        mat.map,
        mat.alphaMap,
        mat.emissiveMap,
        mat.normalMap,
        mat.roughnessMap,
        mat.metalnessMap,
      ];

      maps.forEach((tex) => {
        if (!tex) return;
        tex.anisotropy = aniso;
        // Portrait lite: skip mip chains — saves VRAM with 100+ MMD textures.
        if (viewportFormat === '9:16') {
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
        } else {
          tex.minFilter = THREE.LinearMipMapLinearFilter;
        }
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
      });

      mat.needsUpdate = true;
    });
  });
}
