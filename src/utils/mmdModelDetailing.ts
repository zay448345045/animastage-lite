import * as THREE from 'three';

function sanitizeGeometryMorphAttributes(geometry?: THREE.BufferGeometry | null): void {
  if (!geometry) return;
  const ma = geometry.morphAttributes as unknown as Record<string, unknown>;
  if (ma) {
    for (const key of ['position', 'normal', 'color']) {
      const arr = (ma as Record<string, unknown>)[key];
      if (Array.isArray(arr) && arr.length === 0) {
        delete (ma as Record<string, unknown>)[key];
      }
    }
  }
  const mt = (geometry as THREE.BufferGeometry & { morphTargets?: unknown }).morphTargets;
  if (Array.isArray(mt) && mt.length === 0) {
    delete (geometry as THREE.BufferGeometry & { morphTargets?: unknown }).morphTargets;
  }
}

/** MMD loaders sometimes leave empty morph arrays which can break some shaders/passes. */
export function sanitizeMeshMorphAttributes(root: THREE.Object3D): void {
  root.traverse((o) => {
    const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (g) sanitizeGeometryMorphAttributes(g);
  });
}

/** Stores original material alpha flags so later FX changes can be reversible. */
export function captureOriginalMaterialOpacity(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return;
    const mesh = o as THREE.Mesh;
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      if (!m || (m.userData as Record<string, unknown>)['_opacityCaptured']) return;
      (m.userData as Record<string, unknown>)['_origOpacity'] = (m as THREE.Material & { opacity?: number }).opacity ?? 1;
      (m.userData as Record<string, unknown>)['_origTransparent'] = Boolean(
        (m as THREE.Material & { transparent?: boolean }).transparent
      );
      (m.userData as Record<string, unknown>)['_origDepthWrite'] = (m as THREE.Material & { depthWrite?: boolean }).depthWrite !== false;
      (m.userData as Record<string, unknown>)['_opacityCaptured'] = true;
    });
  });
}

