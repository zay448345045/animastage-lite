import * as THREE from 'three';
import type { PmxBoneInfo, PmxMaterialInfo, PmxMorphInfo } from '../types';

export function extractPmxBones(mesh: THREE.SkinnedMesh): PmxBoneInfo[] {
  const bones = mesh.skeleton?.bones ?? [];
  const nameToBone = new Map(bones.map((b) => [b.name, b]));
  const depth = (bone: THREE.Bone): number => {
    let d = 0;
    let p = bone.parent;
    while (p && p.type === 'Bone') {
      d++;
      p = p.parent;
    }
    return d;
  };

  return bones.map((b) => {
    const parentBone =
      b.parent && b.parent.type === 'Bone' ? (b.parent as THREE.Bone) : null;
    return {
      name: b.name,
      parentName: parentBone?.name ?? null,
      depth: depth(b),
    };
  });
}

export function extractPmxMorphs(mesh: THREE.SkinnedMesh): PmxMorphInfo[] {
  const dict = mesh.morphTargetDictionary;
  if (!dict) return [];
  return Object.entries(dict).map(([name, index]) => ({
    name,
    index,
    kind: 'vertex' as const,
  }));
}

export function extractPmxMaterials(mesh: THREE.SkinnedMesh): PmxMaterialInfo[] {
  const list: PmxMaterialInfo[] = [];
  mesh.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat, i) => {
      const name = mat.name || `Material_${list.length}`;
      if (!list.some((m) => m.name === name)) {
        list.push({ name, index: list.length });
      }
    });
  });
  return list;
}
