import * as THREE from 'three';

const MORPH_ACTIVE_EPS = 0.0005;
const MORPH_ZERO_EPS = 0.0001;

/** Track morph indices with non-zero influence for batched GPU-friendly updates. */
export function batchMorphInfluences(
  mesh: THREE.SkinnedMesh,
  activeIndices: Iterable<number>,
  aggressiveZero = false
): void {
  const influences = mesh.morphTargetInfluences;
  if (!influences) return;

  const active = new Set(activeIndices);

  for (let i = 0; i < influences.length; i++) {
    if (active.has(i)) continue;
    if (Math.abs(influences[i]) <= MORPH_ZERO_EPS) continue;
    influences[i] = 0;
  }

  if (aggressiveZero) {
    for (let i = 0; i < influences.length; i++) {
      if (!active.has(i) && Math.abs(influences[i]) > MORPH_ZERO_EPS) {
        influences[i] = 0;
      }
    }
  }
}

export function collectActiveMorphIndices(mesh: THREE.SkinnedMesh): number[] {
  const influences = mesh.morphTargetInfluences;
  if (!influences) return [];
  const out: number[] = [];
  for (let i = 0; i < influences.length; i++) {
    if (Math.abs(influences[i]) > MORPH_ACTIVE_EPS) out.push(i);
  }
  return out;
}

export function applyMorphValuesByName(
  mesh: THREE.SkinnedMesh,
  dict: Record<string, number>,
  values: Record<string, number>
): number[] {
  const influences = mesh.morphTargetInfluences;
  if (!influences) return [];

  const touched: number[] = [];
  for (const [name, value] of Object.entries(values)) {
    const idx = dict[name];
    if (idx === undefined) continue;
    influences[idx] = value;
    if (Math.abs(value) > MORPH_ACTIVE_EPS) touched.push(idx);
  }
  return touched;
}

export { MORPH_ACTIVE_EPS };
