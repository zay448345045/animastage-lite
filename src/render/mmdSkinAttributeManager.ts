import * as THREE from 'three';

export const MMD_WEBGPU_SKIN_ATTRS_KEY = 'webgpuSkinAttributesReady';
export const MMD_WEBGPU_SKELETON_BOUND_KEY = 'webgpuSkeletonBound';

export interface MmdSkinAttributeReport {
  vertexCount: number;
  hasSkinIndex: boolean;
  hasSkinWeight: boolean;
  skinIndexType: string;
  skinWeightType: string;
  webGpuReady: boolean;
  issues: string[];
}

function isWebGpuSkinIndexAttribute(
  attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined
): boolean {
  if (!attribute || attribute.itemSize !== 4) return false;
  const data =
    attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data : attribute;
  return data.array instanceof Uint16Array;
}

function isWebGpuSkinWeightAttribute(
  attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined
): boolean {
  if (!attribute || attribute.itemSize !== 4) return false;
  const data =
    attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data : attribute;
  return data.array instanceof Float32Array;
}

/**
 * Inspect skinning attributes before GPU upload — catches missing slot-1 (skinIndex) early.
 */
export function auditMmdSkinAttributes(mesh: THREE.SkinnedMesh): MmdSkinAttributeReport {
  const geometry = mesh.geometry;
  const vertexCount = geometry.attributes.position?.count ?? 0;
  const skinIndex = geometry.attributes.skinIndex;
  const skinWeight = geometry.attributes.skinWeight;
  const issues: string[] = [];

  if (vertexCount === 0) {
    issues.push('empty position buffer');
  }
  if (!skinIndex) {
    issues.push('missing skinIndex');
  } else if (!isWebGpuSkinIndexAttribute(skinIndex)) {
    issues.push('skinIndex must be Uint16BufferAttribute itemSize=4');
  }
  if (!skinWeight) {
    issues.push('missing skinWeight');
  } else if (!isWebGpuSkinWeightAttribute(skinWeight)) {
    issues.push('skinWeight must be Float32BufferAttribute itemSize=4');
  }
  if (!mesh.skeleton) {
    issues.push('missing skeleton');
  }

  return {
    vertexCount,
    hasSkinIndex: !!skinIndex,
    hasSkinWeight: !!skinWeight,
    skinIndexType: skinIndex?.array?.constructor?.name ?? 'none',
    skinWeightType: skinWeight?.array?.constructor?.name ?? 'none',
    webGpuReady: issues.length === 0,
    issues,
  };
}

/**
 * Ensure WebGPU-compatible skinIndex (Uint16×4) and skinWeight (Float32×4).
 * Idempotent — safe to call from loader and before compileAsync.
 */
export function ensureMmdSkinAttributesForWebGPU(mesh: THREE.SkinnedMesh): MmdSkinAttributeReport {
  if (mesh.userData[MMD_WEBGPU_SKIN_ATTRS_KEY]) {
    return auditMmdSkinAttributes(mesh);
  }

  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const count = position?.count ?? 0;
  if (count === 0) {
    return auditMmdSkinAttributes(mesh);
  }

  const skinIndexSrc = geometry.attributes.skinIndex;
  const skinWeightSrc = geometry.attributes.skinWeight;

  if (
    isWebGpuSkinIndexAttribute(skinIndexSrc) &&
    isWebGpuSkinWeightAttribute(skinWeightSrc)
  ) {
    mesh.userData[MMD_WEBGPU_SKIN_ATTRS_KEY] = true;
    return auditMmdSkinAttributes(mesh);
  }

  const skinIndexArray = new Uint16Array(count * 4);
  const skinWeightArray = new Float32Array(count * 4);

  if (skinIndexSrc?.array) {
    skinIndexArray.set(skinIndexSrc.array as ArrayLike<number>);
  }

  if (skinWeightSrc?.array) {
    skinWeightArray.set(skinWeightSrc.array as ArrayLike<number>);
  } else {
    for (let i = 0; i < count; i++) {
      skinWeightArray[i * 4] = 1;
    }
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndexArray, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeightArray, 4));

  if (typeof mesh.normalizeSkinWeights === 'function') {
    mesh.normalizeSkinWeights();
  }

  geometry.attributes.skinIndex.needsUpdate = true;
  geometry.attributes.skinWeight.needsUpdate = true;
  geometry.computeBoundingSphere();
  mesh.userData[MMD_WEBGPU_SKIN_ATTRS_KEY] = true;

  const report = auditMmdSkinAttributes(mesh);
  if (!report.webGpuReady) {
    console.warn('[MMD WebGPU] Skin attribute audit:', report.issues, mesh.name);
  }
  return report;
}

export function isMmdSkinnedMeshWebGpuReady(root: THREE.Object3D): boolean {
  let ready = true;
  root.traverse((child) => {
    if (!ready || !(child as THREE.SkinnedMesh).isSkinnedMesh) return;
    const mesh = child as THREE.SkinnedMesh;
    if (mesh.userData.skipWebGpuMaterialConvert) return;
    const report = auditMmdSkinAttributes(mesh);
    if (!report.webGpuReady) ready = false;
  });
  return ready;
}

export { isWebGpuSkinIndexAttribute, isWebGpuSkinWeightAttribute };
