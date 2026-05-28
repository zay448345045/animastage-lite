import * as THREE from 'three';
import type { RenderTier } from '../types';
import { getRenderTierConfig } from '../render/renderTierConfig';

/** PRO tier: sharper textures and slightly richer toon response. */
export function applyMaterialQuality(root: THREE.Object3D, tier: RenderTier, renderer?: THREE.WebGLRenderer) {
  const { textureAnisotropy } = getRenderTierConfig(tier).gpu;
  const maxAniso = renderer?.capabilities.getMaxAnisotropy?.() ?? textureAnisotropy;
  const aniso = Math.min(textureAnisotropy, maxAniso);

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material) => {
      if (!material) return;
      const mat = material as THREE.MeshToonMaterial & {
        map?: THREE.Texture;
        alphaMap?: THREE.Texture;
        emissiveMap?: THREE.Texture;
        specularMap?: THREE.Texture;
        normalMap?: THREE.Texture;
        gradientMap?: THREE.Texture;
      };

      const maps = [mat.map, mat.alphaMap, mat.emissiveMap, mat.specularMap, mat.normalMap, mat.gradientMap];
      maps.forEach((tex) => {
        if (!tex) return;
        tex.anisotropy = aniso;
        if (tier === 'pro') {
          tex.minFilter = THREE.LinearMipMapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
        }
        tex.needsUpdate = true;
      });

      if (tier === 'pro') {
        mat.needsUpdate = true;
      }
    });
  });
}
