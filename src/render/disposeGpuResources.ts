import * as THREE from 'three';

const TEXTURE_KEYS = [
  'map',
  'alphaMap',
  'emissiveMap',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'lightMap',
  'specularMap',
  'gradientMap',
  'envMap',
  'matcap',
] as const;

function disposeMaterialTextures(material: THREE.Material): void {
  const mat = material as THREE.MeshStandardMaterial & Record<string, THREE.Texture | null | undefined>;
  for (const key of TEXTURE_KEYS) {
    const tex = mat[key];
    if (tex && typeof tex.dispose === 'function') {
      tex.dispose();
      mat[key] = null;
    }
  }
  material.dispose();
}

/** Full VRAM cleanup for a loaded MMD mesh subtree (materials + textures + geometry). */
export function disposeObjectGpuResources(root: THREE.Object3D): void {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh || (child as THREE.SkinnedMesh).isSkinnedMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (material) disposeMaterialTextures(material);
      });
      mesh.material = Array.isArray(mesh.material) ? [] : (null as unknown as THREE.Material);
    }
  });
}
