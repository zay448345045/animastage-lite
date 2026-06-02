import * as THREE from 'three';
import { HEAVY_MESH_MEMORY } from './memoryProfile';
import type { SkinnedMeshCluster, SkinnedLodState } from './types';

const _camPos = new THREE.Vector3();
const _objPos = new THREE.Vector3();
const _sphere = new THREE.Sphere();

export interface LodBuildResult {
  lodIndices: THREE.BufferAttribute[];
  lodMorphIndex: number | null;
}

function createIndexAttribute(values: Uint32Array, vertexCount: number): THREE.BufferAttribute {
  if (vertexCount <= 65535) {
    const compact = new Uint16Array(values.length);
    for (let i = 0; i < values.length; i++) compact[i] = values[i]!;
    return new THREE.BufferAttribute(compact, 1);
  }
  return new THREE.BufferAttribute(values, 1);
}

const LOD_RATIOS =
  HEAVY_MESH_MEMORY.lodLevels >= 3 ? [1, 0.65, 0.35] : [1, 0.5];

/**
 * Build LOD index buffers and optional single geomorph target (once per geometry).
 */
export function buildSkinnedLodLevels(
  geometry: THREE.BufferGeometry,
  options: { enableGeomorph?: boolean } = {}
): LodBuildResult {
  const enableGeomorph = options.enableGeomorph ?? HEAVY_MESH_MEMORY.enableGeomorph;
  const index = geometry.getIndex();
  const pos = geometry.getAttribute('position');
  if (!index || !pos) {
    return { lodIndices: [], lodMorphIndex: null };
  }

  if (geometry.userData.__heavyLodBuilt) {
    return {
      lodIndices: (geometry.userData.__heavyLodIndices as THREE.BufferAttribute[]) ?? [],
      lodMorphIndex: (geometry.userData.__heavyLodMorphIndex as number | null) ?? null,
    };
  }

  const triCount = Math.floor(index.count / 3);
  const meshletScores: { start: number; count: number; score: number }[] = [];
  const meshletSize = 64;

  for (let t0 = 0; t0 < triCount; t0 += meshletSize) {
    const batchTris = Math.min(meshletSize, triCount - t0);
    const box = new THREE.Box3();
    const center = new THREE.Vector3();
    for (let t = 0; t < batchTris; t++) {
      const base = (t0 + t) * 3;
      for (let k = 0; k < 3; k++) {
        const vi = index.getX(base + k);
        center.fromBufferAttribute(pos, vi);
        box.expandByPoint(center);
      }
    }
    box.getCenter(center);
    meshletScores.push({
      start: t0 * 3,
      count: batchTris * 3,
      score: center.length(),
    });
  }

  meshletScores.sort((a, b) => a.score - b.score);

  const lodIndices: THREE.BufferAttribute[] = [];

  for (const ratio of LOD_RATIOS) {
    const keepCount = Math.max(3, Math.floor(meshletScores.length * ratio));
    const kept = meshletScores.slice(0, keepCount);
    kept.sort((a, b) => a.start - b.start);
    let total = 0;
    for (const m of kept) total += m.count;
    const out = new Uint32Array(total);
    let ptr = 0;
    for (const m of kept) {
      for (let i = 0; i < m.count; i++) {
        out[ptr++] = index.getX(m.start + i);
      }
    }
    lodIndices.push(createIndexAttribute(out, pos.count));
  }

  let lodMorphIndex: number | null = null;
  const lod1 = lodIndices[1];

  if (enableGeomorph && lod1 && !geometry.userData.__heavyLodMorphAdded) {
    const used = new Uint8Array(pos.count);
    for (let i = 0; i < lod1.count; i++) {
      used[lod1.getX(i)] = 1;
    }

    const collapse = new Float32Array(pos.count * 3);
    const neighborSum = new Float32Array(pos.count * 3);
    const neighborCount = new Uint16Array(pos.count);

    for (let t = 0; t < triCount; t++) {
      const ia = index.getX(t * 3);
      const ib = index.getX(t * 3 + 1);
      const ic = index.getX(t * 3 + 2);
      const verts = [ia, ib, ic];
      for (let i = 0; i < 3; i++) {
        const v = verts[i]!;
        for (let j = 0; j < 3; j++) {
          if (i === j) continue;
          const n = verts[j]!;
          neighborSum[v * 3] += pos.getX(n);
          neighborSum[v * 3 + 1] += pos.getY(n);
          neighborSum[v * 3 + 2] += pos.getZ(n);
          neighborCount[v]!++;
        }
      }
    }

    for (let v = 0; v < pos.count; v++) {
      const ox = pos.getX(v);
      const oy = pos.getY(v);
      const oz = pos.getZ(v);
      if (used[v]) {
        collapse[v * 3] = ox;
        collapse[v * 3 + 1] = oy;
        collapse[v * 3 + 2] = oz;
      } else if (neighborCount[v]! > 0) {
        const n = neighborCount[v]!;
        collapse[v * 3] = neighborSum[v * 3]! / n;
        collapse[v * 3 + 1] = neighborSum[v * 3 + 1]! / n;
        collapse[v * 3 + 2] = neighborSum[v * 3 + 2]! / n;
      } else {
        collapse[v * 3] = ox;
        collapse[v * 3 + 1] = oy;
        collapse[v * 3 + 2] = oz;
      }
    }

    const morphAttr = new THREE.Float32BufferAttribute(collapse, 3);
    morphAttr.name = 'heavyLodCollapse';
    if (!geometry.morphAttributes.position) {
      geometry.morphAttributes.position = [];
    }
    geometry.morphAttributes.position.push(morphAttr);
    geometry.userData.__heavyLodMorphAdded = true;
    lodMorphIndex = geometry.morphAttributes.position.length - 1;
  }

  geometry.userData.__heavyLodBuilt = true;
  geometry.userData.__heavyLodIndices = lodIndices;
  geometry.userData.__heavyLodMorphIndex = lodMorphIndex;

  return { lodIndices, lodMorphIndex };
}

const LOD_DISTANCES =
  HEAVY_MESH_MEMORY.lodLevels >= 3 ? [0, 18, 38, 60] : [0, 24, 48];
const LOD_BLEND_BAND = 6;

export function updateSkinnedLodState(
  object: THREE.Object3D,
  camera: THREE.Camera,
  state: SkinnedLodState
): void {
  camera.getWorldPosition(_camPos);
  object.getWorldPosition(_objPos);
  const distance = _camPos.distanceTo(_objPos);
  state.distance = distance;

  let lod = 0;
  for (let i = LOD_DISTANCES.length - 1; i >= 1; i--) {
    if (distance >= LOD_DISTANCES[i]!) {
      lod = i;
      break;
    }
  }

  const nextDist = LOD_DISTANCES[lod + 1] ?? LOD_DISTANCES[LOD_DISTANCES.length - 1]! + 999;
  const startBlend = nextDist - LOD_BLEND_BAND;
  let blend = 0;
  const maxLod = LOD_RATIOS.length - 1;
  if (lod < maxLod && distance > startBlend && distance < nextDist) {
    blend = THREE.MathUtils.clamp((distance - startBlend) / LOD_BLEND_BAND, 0, 1);
  }

  state.activeLod = lod;
  state.blend = blend;
}

export function applyLodToCluster(
  cluster: SkinnedMeshCluster,
  lodState: SkinnedLodState
): void {
  const { lodIndices, lodMorphIndex, mesh } = cluster;
  if (lodIndices.length === 0) return;

  const lod = Math.min(lodState.activeLod, lodIndices.length - 1);
  const targetIndex = lodIndices[lod]!;
  if (mesh.geometry.getIndex() !== targetIndex) {
    mesh.geometry.setIndex(targetIndex);
  }

  if (lodMorphIndex !== null && mesh.morphTargetInfluences) {
    if (mesh.morphTargetInfluences.length <= lodMorphIndex) {
      mesh.morphTargetInfluences.length = lodMorphIndex + 1;
    }
    mesh.morphTargetInfluences[lodMorphIndex] = lodState.blend;
  }
}

const _frustum = new THREE.Frustum();
const _projScreenMatrix = new THREE.Matrix4();

export function cullMeshClusters(
  clusters: SkinnedMeshCluster[],
  camera: THREE.Camera,
  object: THREE.Object3D
): void {
  if (clusters.length <= 1) return;

  _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  _frustum.setFromProjectionMatrix(_projScreenMatrix);
  object.updateMatrixWorld(true);

  for (const cluster of clusters) {
    const { mesh, meshlets } = cluster;
    if (meshlets.length === 0) {
      mesh.visible = true;
      continue;
    }

    let anyVisible = false;
    for (const ml of meshlets) {
      _sphere.center.copy(ml.center).applyMatrix4(object.matrixWorld);
      _sphere.radius = ml.radius * object.matrixWorld.getMaxScaleOnAxis();
      if (_frustum.intersectsSphere(_sphere)) {
        anyVisible = true;
        break;
      }
    }
    mesh.visible = anyVisible;
  }
}

export function applyClusteredForwardLayers(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const pos = new THREE.Vector3();
  root.getWorldPosition(pos);
  const layer = pos.x >= 0 ? (pos.z >= 0 ? 0 : 1) : pos.z >= 0 ? 2 : 3;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
      obj.layers.set(layer % 2);
    }
  });
}

export function disposeLodResources(geometry: THREE.BufferGeometry): void {
  delete geometry.userData.__heavyLodBuilt;
  delete geometry.userData.__heavyLodIndices;
  delete geometry.userData.__heavyLodMorphIndex;
  delete geometry.userData.__heavyLodMorphAdded;
}
