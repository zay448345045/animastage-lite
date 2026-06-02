import * as THREE from 'three';
import { HEAVY_MESHLET_SIZE, type MeshletBounds } from './types';

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _v = new THREE.Vector3();

function copyGeometryAttributes(
  source: THREE.BufferGeometry,
  target: THREE.BufferGeometry
): void {
  for (const name in source.attributes) {
    target.setAttribute(name, source.attributes[name]!);
  }
  if (source.morphAttributes) {
    target.morphAttributes = source.morphAttributes;
  }
  target.morphTargetsRelative = source.morphTargetsRelative;
  target.userData = { ...source.userData };
}

function buildMeshlets(
  geometry: THREE.BufferGeometry,
  indexStart: number,
  indexCount: number
): MeshletBounds[] {
  const index = geometry.getIndex();
  const pos = geometry.getAttribute('position');
  if (!index || !pos) return [];

  const meshlets: MeshletBounds[] = [];
  const triCount = Math.floor(indexCount / 3);

  for (let t0 = 0; t0 < triCount; t0 += HEAVY_MESHLET_SIZE) {
    const batchTris = Math.min(HEAVY_MESHLET_SIZE, triCount - t0);
    _box.makeEmpty();
    for (let t = 0; t < batchTris; t++) {
      const base = indexStart + (t0 + t) * 3;
      for (let k = 0; k < 3; k++) {
        const vi = index.getX(base + k);
        _v.fromBufferAttribute(pos, vi);
        _box.expandByPoint(_v);
      }
    }
    _box.getCenter(_center);
    const radius = _center.distanceTo(_box.max);
    meshlets.push({
      id: meshlets.length,
      center: _center.clone(),
      radius,
      indexStart: indexStart + t0 * 3,
      indexCount: batchTris * 3,
    });
  }

  return meshlets;
}

function extractGroupGeometry(
  source: THREE.BufferGeometry,
  groupStart: number,
  groupCount: number
): THREE.BufferGeometry {
  const index = source.getIndex();
  if (!index) return source.clone();

  const slice = new Uint32Array(groupCount);
  for (let i = 0; i < groupCount; i++) {
    slice[i] = index.getX(groupStart + i);
  }

  const geo = new THREE.BufferGeometry();
  copyGeometryAttributes(source, geo);
  geo.setIndex(new THREE.BufferAttribute(slice, 1));
  geo.groups = [{ start: 0, count: groupCount, materialIndex: 0 }];
  return geo;
}

export interface BuiltSkinnedCluster {
  mesh: THREE.SkinnedMesh;
  meshlets: MeshletBounds[];
  materialIndex: number;
}

export function buildSkinnedMeshClusters(
  source: THREE.SkinnedMesh
): BuiltSkinnedCluster[] {
  const geometry = source.geometry;
  const groups =
    geometry.groups.length > 0
      ? geometry.groups
      : [{ start: 0, count: geometry.getIndex()?.count ?? 0, materialIndex: 0 }];

  const materials = Array.isArray(source.material) ? source.material : [source.material];
  const clusters: BuiltSkinnedCluster[] = [];

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]!;
    if (group.count < 3) continue;

    const groupGeo = extractGroupGeometry(geometry, group.start, group.count);
    const mat = materials[group.materialIndex ?? gi] ?? materials[0];
    if (!mat) continue;

    const clusterMesh = new THREE.SkinnedMesh(groupGeo, mat);
    clusterMesh.frustumCulled = true;
    clusterMesh.castShadow = source.castShadow;
    clusterMesh.receiveShadow = source.receiveShadow;
    clusterMesh.layers.mask = source.layers.mask;

    if (source.skeleton) {
      clusterMesh.bind(source.skeleton, source.bindMatrix);
      clusterMesh.bindMatrixInverse.copy(source.bindMatrixInverse);
    }

    if (source.morphTargetDictionary && source.morphTargetInfluences) {
      clusterMesh.morphTargetDictionary = source.morphTargetDictionary;
      clusterMesh.morphTargetInfluences = source.morphTargetInfluences;
    }

    const meshlets = buildMeshlets(groupGeo, 0, group.count);
    clusters.push({
      mesh: clusterMesh,
      meshlets,
      materialIndex: group.materialIndex ?? gi,
    });
  }

  return clusters;
}

/** GPU instancing batch for identical rigid meshes (accessories, props). */
export function batchIdenticalMeshes(
  root: THREE.Object3D,
  minInstances = 2
): THREE.InstancedMesh[] {
  const buckets = new Map<
    string,
    { geometry: THREE.BufferGeometry; material: THREE.Material; matrices: THREE.Matrix4[] }
  >();

  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj instanceof THREE.SkinnedMesh) return;
    if (obj instanceof THREE.InstancedMesh) return;
    const geo = obj.geometry;
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (!geo || !mat) return;
    const key = `${geo.uuid}:${mat.uuid}`;
    const bucket = buckets.get(key) ?? { geometry: geo, material: mat, matrices: [] };
    bucket.matrices.push(obj.matrixWorld.clone());
    buckets.set(key, bucket);
    obj.visible = false;
  });

  const created: THREE.InstancedMesh[] = [];
  for (const bucket of buckets.values()) {
    if (bucket.matrices.length < minInstances) continue;
    const inst = new THREE.InstancedMesh(
      bucket.geometry,
      bucket.material,
      bucket.matrices.length
    );
    bucket.matrices.forEach((m, i) => inst.setMatrixAt(i, m));
    inst.instanceMatrix.needsUpdate = true;
    inst.frustumCulled = true;
    inst.castShadow = true;
    inst.receiveShadow = true;
    created.push(inst);
  }

  return created;
}
