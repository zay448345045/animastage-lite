/** WebGPU path tracing shaders — triangle mesh + floor + NEE + denoise + bloom. */

export const PATH_TRACER_WGSL = /* wgsl */`
struct Uniforms {
  resolution: vec2<f32>,
  aperture: f32,
  focusDist: f32,
  cameraPos: vec3<f32>,
  skyIntensity: f32,
  cameraRight: vec3<f32>,
  sunIntensity: f32,
  cameraUp: vec3<f32>,
  sunDiscSize: f32,
  cameraForward: vec3<f32>,
  _p0: f32,
  sunDir: vec3<f32>,
  _p1: f32,
  sunColor: vec3<f32>,
  _p2: f32,
  skyColorTop: vec3<f32>,
  _p3: f32,
  skyColorHoriz: vec3<f32>,
  fogDensity: f32,
  frame: u32,
  maxBounces: u32,
  samplesPerFrame: u32,
  numTriangles: u32,
  enableNEE: u32,
  enableFog: u32,
  floorY: f32,
  fov: f32,
  numTextures: u32,
  numMaterials: u32,
};

const MMD_SPHERE_MUL: u32 = 1u;
const MMD_ALPHA_TEST: u32 = 2u;

struct GpuMaterial {
  color: vec3<f32>,
  matType: u32,
  emissive: vec3<f32>,
  emissiveIntensity: f32,
  mapIndex: u32,
  sphereIndex: u32,
  gradientIndex: u32,
  normalIndex: u32,
  emissiveMapIndex: u32,
  alphaIndex: u32,
  flags: u32,
  alphaCutoff: f32,
  normalScale: f32,
  toonStrength: f32,
  _pad: f32,
};

struct GpuTriangle {
  v0: vec3<f32>,
  uv0x: f32,
  v1: vec3<f32>,
  uv0y: f32,
  v2: vec3<f32>,
  uv1x: f32,
  uv1y: f32,
  uv2x: f32,
  uv2y: f32,
  matIndex: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read_write> accum: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> triangles: array<GpuTriangle>;
@group(0) @binding(3) var<storage, read_write> gNormalDepth: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> gAlbedoMat: array<vec4<f32>>;
@group(0) @binding(5) var texArray: texture_2d_array<f32>;
@group(0) @binding(6) var texSampler: sampler;
@group(0) @binding(7) var<storage, read> materials: array<GpuMaterial>;

fn pcg(state: ptr<function, u32>) -> u32 {
  *state = *state * 747796405u + 2891336453u;
  let word = ((*state >> ((*state >> 28u) + 4u)) ^ *state) * 277803737u;
  return (word >> 22u) ^ word;
}
fn rand1(state: ptr<function, u32>) -> f32 { return f32(pcg(state)) * (1.0 / 4294967296.0); }
fn rand2(state: ptr<function, u32>) -> vec2<f32> { return vec2<f32>(rand1(state), rand1(state)); }

fn buildONB(n: vec3<f32>) -> mat3x3<f32> {
  let s = select(-1.0, 1.0, n.z >= 0.0);
  let a = -1.0 / (s + n.z);
  let b = n.x * n.y * a;
  let t = vec3<f32>(1.0 + s * n.x * n.x * a, s * b, -s * n.x);
  let bt = vec3<f32>(b, s + n.y * n.y * a, -n.y);
  return mat3x3<f32>(t, bt, n);
}

fn sampleCosineHemisphere(n: vec3<f32>, state: ptr<function, u32>) -> vec3<f32> {
  let r = rand2(state);
  let phi = 6.28318530718 * r.x;
  let cosTheta = sqrt(r.y);
  let sinTheta = sqrt(max(0.0, 1.0 - r.y));
  return buildONB(n) * vec3<f32>(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
}

fn sampleGGXHalf(n: vec3<f32>, roughness: f32, state: ptr<function, u32>) -> vec3<f32> {
  let r = rand2(state);
  let a = max(0.001, roughness * roughness);
  let phi = 6.28318530718 * r.x;
  let cosTheta2 = (1.0 - r.y) / (1.0 + (a * a - 1.0) * r.y);
  let cosTheta = sqrt(max(0.0, cosTheta2));
  let sinTheta = sqrt(max(0.0, 1.0 - cosTheta2));
  return buildONB(n) * vec3<f32>(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  let k = clamp(1.0 - cosTheta, 0.0, 1.0);
  return F0 + (vec3<f32>(1.0) - F0) * (k * k * k * k * k);
}

fn intersectPlane(ro: vec3<f32>, rd: vec3<f32>, py: f32) -> f32 {
  if (abs(rd.y) < 0.0001) { return -1.0; }
  let t = (py - ro.y) / rd.y;
  if (t < 0.001) { return -1.0; }
  return t;
}

fn intersectTriangle(ro: vec3<f32>, rd: vec3<f32>, v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>) -> vec4<f32> {
  let e1 = v1 - v0;
  let e2 = v2 - v0;
  let pvec = cross(rd, e2);
  let det = dot(e1, pvec);
  if (abs(det) < 1e-8) { return vec4<f32>(-1.0, 0.0, 1.0, 0.0); }
  let invDet = 1.0 / det;
  let tvec = ro - v0;
  let tu = dot(tvec, pvec) * invDet;
  if (tu < 0.0 || tu > 1.0) { return vec4<f32>(-1.0, 0.0, 1.0, 0.0); }
  let qvec = cross(tvec, e1);
  let tv = dot(rd, qvec) * invDet;
  if (tv < 0.0 || tu + tv > 1.0) { return vec4<f32>(-1.0, 0.0, 1.0, 0.0); }
  let t = dot(e2, qvec) * invDet;
  if (t < 0.001) { return vec4<f32>(-1.0, 0.0, 1.0, 0.0); }
  var n = cross(e1, e2);
  let len = length(n);
  if (len < 1e-8) { return vec4<f32>(-1.0, 0.0, 1.0, 0.0); }
  n = n / len;
  return vec4<f32>(t, n);
}

struct Hit {
  t: f32,
  triIdx: i32,
  isFloor: bool,
  pos: vec3<f32>,
  normal: vec3<f32>,
  frontFace: bool,
};

fn intersectScene(ro: vec3<f32>, rd: vec3<f32>) -> Hit {
  var hit: Hit;
  hit.t = 1e20;
  hit.triIdx = -1;
  hit.isFloor = false;

  let tFloor = intersectPlane(ro, rd, u.floorY);
  if (tFloor > 0.0 && tFloor < hit.t) {
    hit.t = tFloor;
    hit.isFloor = true;
    hit.pos = ro + rd * tFloor;
    hit.normal = vec3<f32>(0.0, 1.0, 0.0);
    hit.frontFace = true;
  }

  for (var ti: u32 = 0u; ti < u.numTriangles; ti = ti + 1u) {
    let tri = triangles[ti];
    let tr = intersectTriangle(ro, rd, tri.v0, tri.v1, tri.v2);
    if (tr.x > 0.0 && tr.x < hit.t) {
      hit.t = tr.x;
      hit.isFloor = false;
      hit.triIdx = i32(ti);
      hit.pos = ro + rd * tr.x;
      let nRaw = tr.yzw;
      hit.frontFace = dot(rd, nRaw) < 0.0;
      hit.normal = select(-nRaw, nRaw, hit.frontFace);
    }
  }
  return hit;
}

fn occluded(ro: vec3<f32>, rd: vec3<f32>, maxT: f32) -> bool {
  let tFloor = intersectPlane(ro, rd, u.floorY);
  if (tFloor > 0.001 && tFloor < maxT) { return true; }
  for (var ti: u32 = 0u; ti < u.numTriangles; ti = ti + 1u) {
    let tri = triangles[ti];
    let tr = intersectTriangle(ro, rd, tri.v0, tri.v1, tri.v2);
    if (tr.x > 0.001 && tr.x < maxT) { return true; }
  }
  return false;
}

fn sampleSky(dir: vec3<f32>) -> vec3<f32> {
  let sd = normalize(-u.sunDir);
  let sunCos = dot(dir, sd);
  if (sunCos > u.sunDiscSize) {
    return u.sunColor * u.sunIntensity * 32.0;
  }
  let t = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  let baseSky = mix(u.skyColorHoriz, u.skyColorTop, t);
  let glow = pow(max(0.0, sunCos), 32.0);
  return (baseSky + u.sunColor * glow * 0.4) * u.skyIntensity;
}

fn barycentricWeights(p: vec3<f32>, v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>) -> vec3<f32> {
  let v0v1 = v1 - v0;
  let v0v2 = v2 - v0;
  let v0p = p - v0;
  let d00 = dot(v0v1, v0v1);
  let d01 = dot(v0v1, v0v2);
  let d11 = dot(v0v2, v0v2);
  let d20 = dot(v0p, v0v1);
  let d21 = dot(v0p, v0v2);
  let denom = d00 * d11 - d01 * d01;
  if (abs(denom) < 1e-10) { return vec3<f32>(1.0, 0.0, 0.0); }
  let v = (d11 * d20 - d01 * d21) / denom;
  let w = (d00 * d21 - d01 * d20) / denom;
  return vec3<f32>(1.0 - v - w, v, w);
}

fn triUvAt(tri: GpuTriangle, p: vec3<f32>) -> vec2<f32> {
  let bc = barycentricWeights(p, tri.v0, tri.v1, tri.v2);
  let uv0 = vec2<f32>(tri.uv0x, tri.uv0y);
  let uv1 = vec2<f32>(tri.uv1x, tri.uv1y);
  let uv2 = vec2<f32>(tri.uv2x, tri.uv2y);
  return bc.x * uv0 + bc.y * uv1 + bc.z * uv2;
}

fn triUvs(tri: GpuTriangle) -> array<vec2<f32>, 3> {
  return array<vec2<f32>, 3>(
    vec2<f32>(tri.uv0x, tri.uv0y),
    vec2<f32>(tri.uv1x, tri.uv1y),
    vec2<f32>(tri.uv2x, tri.uv2y)
  );
}

fn sampleTexIdx(idx: u32, uv: vec2<f32>) -> vec4<f32> {
  if (idx == 0xFFFFFFFFu || idx >= u.numTextures) {
    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
  }
  return textureSampleLevel(texArray, texSampler, uv, idx, 0.0);
}

fn sphereUvFromNormal(n: vec3<f32>) -> vec2<f32> {
  let clamped = clamp(n, vec3<f32>(-1.0), vec3<f32>(1.0));
  let v = asin(clamped.y) * 0.318309886 + 0.5;
  let uCoord = atan2(clamped.z, clamped.x) * 0.159154943 + 0.5;
  return vec2<f32>(uCoord, v);
}

fn computeTbn(tri: GpuTriangle, geomN: vec3<f32>) -> mat3x3<f32> {
  let uvs = triUvs(tri);
  let edge1 = tri.v1 - tri.v0;
  let edge2 = tri.v2 - tri.v0;
  let duv1 = uvs[1] - uvs[0];
  let duv2 = uvs[2] - uvs[0];
  let det = duv1.x * duv2.y - duv2.x * duv1.y;
  if (abs(det) < 1e-8) {
    return buildONB(normalize(geomN));
  }
  let f = 1.0 / det;
  let t = normalize(f * (duv2.y * edge1 - duv1.y * edge2));
  let b = normalize(f * (-duv2.x * edge1 + duv1.x * edge2));
  let n = normalize(cross(edge1, edge2));
  return mat3x3<f32>(t, b, n);
}

fn perturbNormal(mat: GpuMaterial, tri: GpuTriangle, geomN: vec3<f32>, p: vec3<f32>) -> vec3<f32> {
  if (mat.normalIndex == 0xFFFFFFFFu) {
    return normalize(geomN);
  }
  let uv = triUvAt(tri, p);
  let mapNSample = sampleTexIdx(mat.normalIndex, uv).xyz * 2.0 - 1.0;
  let mapN = vec3<f32>(mapNSample.xy * mat.normalScale, mapNSample.z);
  let tbn = computeTbn(tri, geomN);
  return normalize(tbn * mapN);
}

fn toonFactor(mat: GpuMaterial, n: vec3<f32>, l: vec3<f32>) -> f32 {
  if (mat.toonStrength < 0.001 || mat.gradientIndex == 0xFFFFFFFFu) {
    return 1.0;
  }
  let ndotl = clamp(dot(n, l) * 0.5 + 0.5, 0.0, 1.0);
  let g = sampleTexIdx(mat.gradientIndex, vec2<f32>(ndotl, 0.5)).r;
  return mix(1.0, g, mat.toonStrength);
}

fn evaluateMmdSurface(
  mat: GpuMaterial,
  tri: GpuTriangle,
  p: vec3<f32>,
  geomN: vec3<f32>,
  viewDir: vec3<f32>
) -> vec4<f32> {
  let uv = triUvAt(tri, p);
  var col = mat.color;
  col = col * sampleTexIdx(mat.mapIndex, uv).rgb;

  if (mat.sphereIndex != 0xFFFFFFFFu) {
    let shadN = perturbNormal(mat, tri, geomN, p);
    let sph = sampleTexIdx(mat.sphereIndex, sphereUvFromNormal(shadN)).rgb;
    if ((mat.flags & MMD_SPHERE_MUL) != 0u) {
      col = col * sph;
    } else {
      col = col + sph;
    }
  }

  var alpha = sampleTexIdx(mat.mapIndex, uv).a;
  if (mat.alphaIndex != 0xFFFFFFFFu) {
    alpha = alpha * sampleTexIdx(mat.alphaIndex, uv).r;
  }

  var emissive = mat.emissive * mat.emissiveIntensity;
  if (mat.emissiveMapIndex != 0xFFFFFFFFu) {
    emissive = emissive * sampleTexIdx(mat.emissiveMapIndex, uv).rgb;
  }

  return vec4<f32>(col, alpha);
}

struct SurfaceHit {
  albedo: vec3<f32>,
  emission: vec3<f32>,
  alpha: f32,
  matType: u32,
  shadN: vec3<f32>,
  mat: GpuMaterial,
};

fn resolveSurfaceHit(hit: Hit, viewDir: vec3<f32>) -> SurfaceHit {
  var result: SurfaceHit;
  result.albedo = vec3<f32>(0.5);
  result.emission = vec3<f32>(0.0);
  result.alpha = 1.0;
  result.matType = 0u;
  result.shadN = hit.normal;

  if (hit.isFloor) {
    let cx = floor(hit.pos.x * 0.55);
    let cz = floor(hit.pos.z * 0.55);
    let c = abs(fract((cx + cz) * 0.5)) * 2.0;
    result.albedo = mix(vec3<f32>(0.86, 0.87, 0.90), vec3<f32>(0.12, 0.13, 0.16), c);
    return result;
  }

  let tri = triangles[u32(hit.triIdx)];
  let mat = materials[tri.matIndex];
  let surf = evaluateMmdSurface(mat, tri, hit.pos, hit.normal, viewDir);
  result.albedo = surf.rgb;
  result.alpha = surf.a;
  let uv = triUvAt(tri, hit.pos);
  result.emission = mat.emissive * mat.emissiveIntensity;
  if (mat.emissiveMapIndex != 0xFFFFFFFFu) {
    result.emission = result.emission * sampleTexIdx(mat.emissiveMapIndex, uv).rgb;
  }
  result.matType = mat.matType;
  result.shadN = perturbNormal(mat, tri, hit.normal, hit.pos);
  result.mat = mat;
  return result;
}

fn evalLambert(albedo: vec3<f32>, n: vec3<f32>, wi: vec3<f32>) -> vec3<f32> {
  return albedo * max(0.0, dot(n, wi)) / 3.14159265;
}

fn evalGGX(albedo: vec3<f32>, n: vec3<f32>, wo: vec3<f32>, wi: vec3<f32>, roughness: f32) -> vec3<f32> {
  let cosT = max(0.0, dot(n, wi));
  if (cosT <= 0.0) { return vec3<f32>(0.0); }
  let h = normalize(wo + wi);
  let nDotH = max(0.0, dot(n, h));
  let nDotV = max(0.001, dot(n, wo));
  let vDotH = max(0.0, dot(wo, h));
  let a = roughness * roughness;
  let a2 = max(0.0001, a * a);
  let denom = nDotH * nDotH * (a2 - 1.0) + 1.0;
  let D = a2 / (3.14159265 * denom * denom);
  let k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  let G = (nDotV / (nDotV * (1.0 - k) + k)) * (cosT / (cosT * (1.0 - k) + k));
  let F = fresnelSchlick(vDotH, albedo);
  return F * D * G / max(0.0001, 4.0 * nDotV * cosT) * cosT;
}

fn directSun(
  p: vec3<f32>, n: vec3<f32>, wo: vec3<f32>,
  matType: u32, albedo: vec3<f32>, roughness: f32,
  mat: GpuMaterial,
  state: ptr<function, u32>
) -> vec3<f32> {
  let sd = normalize(-u.sunDir);
  let cone = 0.012;
  let r = rand2(state) * 2.0 - 1.0;
  let sunSample = normalize(buildONB(sd) * vec3<f32>(r.x * cone, r.y * cone, 1.0));
  if (dot(sunSample, n) <= 0.0 || occluded(p + n * 0.001, sunSample, 1000.0)) {
    return vec3<f32>(0.0);
  }
  var brdf: vec3<f32>;
  if (matType == 1u) { brdf = evalGGX(albedo, n, wo, sunSample, roughness); }
  else { brdf = evalLambert(albedo, n, sunSample); }
  let toon = toonFactor(mat, n, sunSample);
  return brdf * toon * u.sunColor * u.sunIntensity * 32.0;
}

fn findValidHit(roIn: vec3<f32>, rdIn: vec3<f32>) -> Hit {
  var ro = roIn;
  var rd = rdIn;
  for (var attempt: u32 = 0u; attempt < 8u; attempt = attempt + 1u) {
    let hit = intersectScene(ro, rd);
    if (hit.t > 1e10) { return hit; }
    if (hit.isFloor) { return hit; }
    let tri = triangles[u32(hit.triIdx)];
    let mat = materials[tri.matIndex];
    if ((mat.flags & MMD_ALPHA_TEST) != 0u) {
      let surf = evaluateMmdSurface(mat, tri, hit.pos, hit.normal, -rd);
      if (surf.a < mat.alphaCutoff) {
        ro = hit.pos + rd * 0.002;
        continue;
      }
    }
    return hit;
  }
  var miss: Hit;
  miss.t = 1e20;
  miss.triIdx = -1;
  miss.isFloor = false;
  return miss;
}

fn tracePath(roIn: vec3<f32>, rdIn: vec3<f32>, state: ptr<function, u32>) -> vec3<f32> {
  var ro = roIn;
  var rd = rdIn;
  var radiance = vec3<f32>(0.0);
  var throughput = vec3<f32>(1.0);
  var prevSpecular = true;

  for (var bounce: u32 = 0u; bounce < u.maxBounces; bounce = bounce + 1u) {
    let hit = findValidHit(ro, rd);
    if (hit.t > 1e10) {
      radiance = radiance + throughput * sampleSky(rd);
      break;
    }

    let wo = -rd;
    let surf = resolveSurfaceHit(hit, wo);
    let n = surf.shadN;
    let p = hit.pos;
    let albedo = surf.albedo;
    let matType = surf.matType;
    var roughness = select(0.88, 0.18, matType == 1u);

    radiance = radiance + throughput * surf.emission;

    let isSpecular = matType == 1u && roughness < 0.12;

    if (u.enableNEE > 0u && !isSpecular) {
      radiance = radiance + throughput * directSun(p, n, wo, matType, albedo, roughness, surf.mat, state);
    }

    if (matType == 1u) {
      let h = sampleGGXHalf(n, roughness, state);
      let newRd = reflect(rd, h);
      if (dot(newRd, n) <= 0.0) { break; }
      let cosNV = max(dot(n, -rd), 0.0);
      throughput = throughput * fresnelSchlick(cosNV, albedo);
      rd = newRd;
      ro = p + n * 0.001;
      prevSpecular = isSpecular;
    } else {
      rd = sampleCosineHemisphere(n, state);
      throughput = throughput * albedo;
      ro = p + n * 0.001;
      prevSpecular = false;
    }

    if (bounce >= 3u) {
      let q = max(throughput.x, max(throughput.y, throughput.z));
      let pS = clamp(q, 0.05, 0.95);
      if (rand1(state) > pS) { break; }
      throughput = throughput / pS;
    }
  }
  return radiance;
}

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let w = u32(u.resolution.x);
  let h = u32(u.resolution.y);
  if (gid.x >= w || gid.y >= h) { return; }

  var seed: u32 = gid.x * 1973u + gid.y * 9277u + u.frame * 26699u;
  seed = seed ^ (seed << 13u);
  seed = seed ^ (seed >> 17u);
  seed = seed ^ (seed << 5u);

  let cw = normalize(u.cameraForward);
  let cu = normalize(u.cameraRight);
  let cv = normalize(u.cameraUp);
  var color = vec3<f32>(0.0);
  var wroteGbuf = false;

  for (var s: u32 = 0u; s < u.samplesPerFrame; s = s + 1u) {
    let jitter = rand2(&seed) - 0.5;
    let pixX = f32(gid.x) + jitter.x;
    let pixY = (u.resolution.y - 1.0 - f32(gid.y)) + jitter.y;
    let uvx = (2.0 * pixX - u.resolution.x) / u.resolution.y;
    let uvy = (2.0 * pixY - u.resolution.y) / u.resolution.y;
    let fovRad = u.fov * 0.0174532925;
    let focalLen = 1.0 / max(0.001, tan(fovRad * 0.5));
    var rd = normalize(uvx * cu + uvy * cv + focalLen * cw);
    var ro = u.cameraPos;

    if (u.aperture > 0.0001) {
      let focal = ro + rd * u.focusDist;
      let disk = rand2(&seed) * u.aperture;
      ro = ro + cu * disk.x + cv * disk.y;
      rd = normalize(focal - ro);
    }

    if (!wroteGbuf) {
      let h0 = findValidHit(ro, rd);
      let idx0 = gid.y * w + gid.x;
      if (h0.t > 1e10) {
        gNormalDepth[idx0] = vec4<f32>(0.0, 1.0, 0.0, 1e6);
        gAlbedoMat[idx0] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
      } else {
        let surf0 = resolveSurfaceHit(h0, -rd);
        gNormalDepth[idx0] = vec4<f32>(surf0.shadN, h0.t);
        gAlbedoMat[idx0] = vec4<f32>(surf0.albedo, f32(surf0.matType));
      }
      wroteGbuf = true;
    }

    color = color + tracePath(ro, rd, &seed);
  }

  color = color / f32(u.samplesPerFrame);
  color = min(color, vec3<f32>(40.0));
  let idx = gid.y * w + gid.x;
  let prev = accum[idx];
  accum[idx] = vec4<f32>(prev.rgb + color, prev.a + 1.0);
}
`;

export const DENOISE_WGSL = /* wgsl */`
struct DU { resolution: vec2<f32>, radius: u32, _p: u32 }
@group(0) @binding(0) var<uniform> du: DU;
@group(0) @binding(1) var<storage, read> accum: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> gNormalDepth: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> outBuf: array<vec4<f32>>;

fn idxAt(x: i32, y: i32, w: i32) -> u32 { return u32(y) * u32(w) + u32(x); }
fn loadColor(x: i32, y: i32, w: i32, h: i32) -> vec3<f32> {
  let cx = clamp(x, 0, w - 1); let cy = clamp(y, 0, h - 1);
  let s = accum[idxAt(cx, cy, w)];
  return s.rgb / max(s.a, 1.0);
}

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let w = i32(du.resolution.x); let h = i32(du.resolution.y);
  if (i32(gid.x) >= w || i32(gid.y) >= h) { return; }
  let x = i32(gid.x); let y = i32(gid.y);
  let r = i32(du.radius);
  let center = loadColor(x, y, w, h);
  if (r <= 0) { outBuf[idxAt(x, y, w)] = vec4<f32>(center, 1.0); return; }
  let cnd = gNormalDepth[idxAt(x, y, w)];
  var totalW = 0.0;
  var totalC = vec3<f32>(0.0);
  for (var dy = -r; dy <= r; dy = dy + 1) {
    for (var dx = -r; dx <= r; dx = dx + 1) {
      let nc = loadColor(x + dx, y + dy, w, h);
      let nnd = gNormalDepth[idxAt(x + dx, y + dy, w)];
      let wS = exp(-f32(dx * dx + dy * dy) / 8.0);
      let wN = exp(-max(0.0, 1.0 - dot(cnd.xyz, nnd.xyz)) * 8.0);
      let wD = exp(-abs(cnd.w - nnd.w) * 0.08);
      let wt = wS * wN * wD;
      totalW = totalW + wt;
      totalC = totalC + nc * wt;
    }
  }
  outBuf[idxAt(x, y, w)] = vec4<f32>(totalC / max(totalW, 0.0001), 1.0);
}
`;

export const BLOOM_EXTRACT_WGSL = /* wgsl */`
struct BU { fullRes: vec2<f32>, halfRes: vec2<f32>, threshold: f32, strength: f32, _p: vec2<f32> }
@group(0) @binding(0) var<uniform> bu: BU;
@group(0) @binding(1) var<storage, read> srcBuf: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> dstBuf: array<vec4<f32>>;
@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let hw = i32(bu.halfRes.x); let hh = i32(bu.halfRes.y);
  if (i32(gid.x) >= hw || i32(gid.y) >= hh) { return; }
  let fw = i32(bu.fullRes.x); let fh = i32(bu.fullRes.y);
  let sx = i32(gid.x) * 2; let sy = i32(gid.y) * 2;
  var sum = vec3<f32>(0.0);
  for (var dy = 0; dy < 2; dy = dy + 1) {
    for (var dx = 0; dx < 2; dx = dx + 1) {
      let xx = clamp(sx + dx, 0, fw - 1);
      let yy = clamp(sy + dy, 0, fh - 1);
      let c = srcBuf[u32(yy) * u32(fw) + u32(xx)].rgb;
      let br = max(c.r, max(c.g, c.b));
      let factor = max(0.0, br - bu.threshold) / max(br, 0.0001);
      sum = sum + c * factor;
    }
  }
  dstBuf[u32(gid.y) * u32(hw) + u32(gid.x)] = vec4<f32>(sum * 0.25, 1.0);
}
`;

export const BLOOM_BLUR_WGSL = /* wgsl */`
struct BU { fullRes: vec2<f32>, halfRes: vec2<f32>, direction: vec2<f32>, _p: vec2<f32> }
@group(0) @binding(0) var<uniform> bu: BU;
@group(0) @binding(1) var<storage, read> srcBuf: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> dstBuf: array<vec4<f32>>;
@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let hw = i32(bu.halfRes.x); let hh = i32(bu.halfRes.y);
  if (i32(gid.x) >= hw || i32(gid.y) >= hh) { return; }
  let weights = array<f32, 5>(0.2270270, 0.1945946, 0.1216216, 0.0540541, 0.0162162);
  var col = srcBuf[u32(gid.y) * u32(hw) + u32(gid.x)].rgb * weights[0];
  for (var i = 1; i < 5; i = i + 1) {
    let off = vec2<f32>(bu.direction) * f32(i);
    let xp = clamp(i32(gid.x) + i32(off.x), 0, hw - 1);
    let yp = clamp(i32(gid.y) + i32(off.y), 0, hh - 1);
    let xn = clamp(i32(gid.x) - i32(off.x), 0, hw - 1);
    let yn = clamp(i32(gid.y) - i32(off.y), 0, hh - 1);
    col = col + srcBuf[u32(yp) * u32(hw) + u32(xp)].rgb * weights[i];
    col = col + srcBuf[u32(yn) * u32(hw) + u32(xn)].rgb * weights[i];
  }
  dstBuf[u32(gid.y) * u32(hw) + u32(gid.x)] = vec4<f32>(col, 1.0);
}
`;

export const DISPLAY_WGSL = /* wgsl */`
struct DisplayU {
  resolution: vec2<f32>, halfRes: vec2<f32>,
  bloomStrength: f32, bloomEnabled: u32, exposure: f32, vignetteStrength: f32,
  useAccumFormat: u32, _pad: f32,
}
@group(0) @binding(0) var<uniform> du: DisplayU;
@group(0) @binding(1) var<storage, read> mainBuf: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> bloomBuf: array<vec4<f32>>;

struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) uv: vec2<f32> }
@vertex fn vs_main(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  var o: VSOut;
  o.pos = vec4<f32>(p[i], 0.0, 1.0);
  o.uv = p[i] * 0.5 + 0.5;
  return o;
}

fn tmACES(c: vec3<f32>) -> vec3<f32> {
  return (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
}

fn sampleBloom(uv: vec2<f32>) -> vec3<f32> {
  let fx = uv.x * du.halfRes.x - 0.5;
  let fy = uv.y * du.halfRes.y - 0.5;
  let x0 = i32(floor(fx)); let y0 = i32(floor(fy));
  let tx = fx - f32(x0); let ty = fy - f32(y0);
  let hw = i32(du.halfRes.x); let hh = i32(du.halfRes.y);
  let x1 = clamp(x0 + 1, 0, hw - 1); let y1 = clamp(y0 + 1, 0, hh - 1);
  let xc0 = clamp(x0, 0, hw - 1); let yc0 = clamp(y0, 0, hh - 1);
  let c00 = bloomBuf[u32(yc0) * u32(hw) + u32(xc0)].rgb;
  let c10 = bloomBuf[u32(yc0) * u32(hw) + u32(x1)].rgb;
  let c01 = bloomBuf[u32(y1) * u32(hw) + u32(xc0)].rgb;
  let c11 = bloomBuf[u32(y1) * u32(hw) + u32(x1)].rgb;
  return mix(mix(c00, c10, tx), mix(c01, c11, tx), ty);
}

@fragment fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  let w = i32(du.resolution.x); let h = i32(du.resolution.y);
  let px = i32(in.uv.x * du.resolution.x);
  let py = i32((1.0 - in.uv.y) * du.resolution.y);
  let cx = clamp(px, 0, w - 1); let cy = clamp(py, 0, h - 1);
  let pix = mainBuf[u32(cy) * u32(w) + u32(cx)];
  var col = select(pix.rgb, pix.rgb / max(pix.a, 1.0), du.useAccumFormat > 0u);
  col = col * du.exposure;
  if (du.bloomEnabled > 0u) {
    col = col + sampleBloom(in.uv) * du.bloomStrength;
  }
  col = tmACES(col);
  col = pow(clamp(col, vec3<f32>(0.0), vec3<f32>(1.0)), vec3<f32>(1.0 / 2.2));
  let vig = 1.0 - du.vignetteStrength * pow(length(in.uv - 0.5) * 1.4, 2.0);
  col = col * clamp(vig, 0.0, 1.0);
  return vec4<f32>(col, 1.0);
}
`;

export const PT_UNIFORM_SIZE = 192;
export const DISPLAY_UNIFORM_SIZE = 48;
