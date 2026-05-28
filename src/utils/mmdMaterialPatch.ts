import * as THREE from 'three';

const LEGACY_MESH_TOON_KEYS = ['skinning', 'morphTargets', 'envMap', 'combine'] as const;

const originalSetValues = THREE.MeshToonMaterial.prototype.setValues;

THREE.MeshToonMaterial.prototype.setValues = function setValues(
  values?: Record<string, unknown>
) {
  if (!values) {
    return originalSetValues.call(this, values);
  }

  const filtered: Record<string, unknown> = { ...values };
  for (const key of LEGACY_MESH_TOON_KEYS) {
    delete filtered[key];
  }

  return originalSetValues.call(this, filtered);
};
