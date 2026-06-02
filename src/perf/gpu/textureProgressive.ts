import * as THREE from 'three';

const FAST_FILTER = THREE.LinearFilter;
const UPGRADE_DELAY_MS = 3500;

const pendingUpgrades = new WeakMap<THREE.Object3D, ReturnType<typeof setTimeout>>();

/** Fast texture filtering during load — upgrade to mipmapped after stabilization. */
export function applyFastTextureMode(root: THREE.Object3D): void {
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
      };
      for (const tex of [mat.map, mat.alphaMap, mat.emissiveMap, mat.normalMap]) {
        if (!tex || tex.userData?.progressiveFast) continue;
        tex.userData = tex.userData ?? {};
        tex.userData.progressiveFast = true;
        tex.userData.progressiveFullMinFilter = tex.minFilter;
        tex.minFilter = FAST_FILTER;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
      }
    });
  });
}

export function scheduleTextureQualityUpgrade(
  root: THREE.Object3D,
  upgrade: () => void
): void {
  const existing = pendingUpgrades.get(root);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    pendingUpgrades.delete(root);
    upgrade();
  }, UPGRADE_DELAY_MS);

  pendingUpgrades.set(root, timer);
}

export function cancelTextureQualityUpgrade(root: THREE.Object3D): void {
  const t = pendingUpgrades.get(root);
  if (t) clearTimeout(t);
  pendingUpgrades.delete(root);
}
