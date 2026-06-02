import * as THREE from 'three';

const CACHE_SIZE = 32;

/**
 * Forsyth linear-speed vertex cache optimization (Tipsify-style).
 * Reorders triangle indices to improve post-transform vertex cache reuse.
 */
export function optimizeVertexCache(geometry: THREE.BufferGeometry): void {
  const index = geometry.getIndex();
  if (!index || index.count < 3) return;

  const triCount = Math.floor(index.count / 3);
  const indices = new Uint32Array(index.count);
  for (let i = 0; i < index.count; i++) {
    indices[i] = index.getX(i);
  }

  const vertexCount = geometry.getAttribute('position')?.count ?? 0;
  if (vertexCount === 0) return;

  const liveTriangles = new Int32Array(vertexCount).fill(-1);
  const emittedFlags = new Uint8Array(triCount);
  const triangleScore = new Float32Array(triCount);
  const vertexScore = new Float32Array(vertexCount);
  const cache = new Int32Array(CACHE_SIZE).fill(-1);
  let cacheCount = 0;

  const adjacency: number[][] = Array.from({ length: vertexCount }, () => []);
  for (let t = 0; t < triCount; t++) {
    const a = indices[t * 3];
    const b = indices[t * 3 + 1];
    const c = indices[t * 3 + 2];
    adjacency[a]!.push(t);
    adjacency[b]!.push(t);
    adjacency[c]!.push(t);
  }

  function findVertexScore(v: number): number {
    if (cacheCount > 0) {
      for (let i = 0; i < cacheCount; i++) {
        if (cache[i] === v) {
          if (i < 3) return 0.75;
          if (i < CACHE_SIZE - 3) return 0.45;
          return 0.1;
        }
      }
    }
    const remaining = liveTriangles[v] ?? 0;
    if (remaining <= 0) return -1;
    if (remaining === 1) return 0.75;
    if (remaining === 2) return 0.55;
    return 0.35;
  }

  function updateVertexScore(v: number): void {
    vertexScore[v] = findVertexScore(v);
  }

  function pushCache(v: number): void {
    for (let i = cacheCount; i > 0; i--) {
      cache[i] = cache[i - 1]!;
    }
    cache[0] = v;
    if (cacheCount < CACHE_SIZE) cacheCount++;
  }

  function scoreTriangle(t: number): number {
    const a = indices[t * 3]!;
    const b = indices[t * 3 + 1]!;
    const c = indices[t * 3 + 2]!;
    return vertexScore[a]! + vertexScore[b]! + vertexScore[c]!;
  }

  for (let v = 0; v < vertexCount; v++) {
    liveTriangles[v] = adjacency[v]!.length;
    updateVertexScore(v);
  }

  for (let t = 0; t < triCount; t++) {
    triangleScore[t] = scoreTriangle(t);
  }

  const output = new Uint32Array(index.count);
  let outPtr = 0;

  while (outPtr < index.count) {
    let bestTri = -1;
    let bestScore = -1;
    for (let t = 0; t < triCount; t++) {
      if (emittedFlags[t]) continue;
      const s = triangleScore[t]!;
      if (s > bestScore) {
        bestScore = s;
        bestTri = t;
      }
    }
    if (bestTri < 0) {
      for (let t = 0; t < triCount; t++) {
        if (!emittedFlags[t]) {
          bestTri = t;
          break;
        }
      }
    }
    if (bestTri < 0) break;

    emittedFlags[bestTri] = 1;
    const va = indices[bestTri * 3]!;
    const vb = indices[bestTri * 3 + 1]!;
    const vc = indices[bestTri * 3 + 2]!;

    output[outPtr++] = va;
    output[outPtr++] = vb;
    output[outPtr++] = vc;

    const verts = [va, vb, vc];
    for (const v of verts) {
      liveTriangles[v]!--;
      pushCache(v);
    }

    for (let i = 0; i < cacheCount; i++) {
      updateVertexScore(cache[i]!);
    }

    const touched = new Set<number>();
    for (const v of verts) {
      for (const t of adjacency[v]!) {
        if (emittedFlags[t]) continue;
        triangleScore[t] = scoreTriangle(t);
        touched.add(indices[t * 3]!);
        touched.add(indices[t * 3 + 1]!);
        touched.add(indices[t * 3 + 2]!);
      }
    }
    for (const v of touched) {
      updateVertexScore(v);
    }
  }

  geometry.setIndex(new THREE.BufferAttribute(output, 1));
}

export function countGeometryTriangles(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) return Math.floor(index.count / 3);
  const pos = geometry.getAttribute('position');
  return pos ? Math.floor(pos.count / 3) : 0;
}
