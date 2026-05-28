import * as THREE from 'three';
import {
  NO_TEXTURE_INDEX,
  PATH_TRACER_MAX_TEXTURES,
  type BakedMaterial,
} from './types';

export class TextureRegistry {
  private readonly indexByUuid = new Map<string, number>();
  readonly textures: THREE.Texture[] = [];

  constructor(private readonly maxTextures = PATH_TRACER_MAX_TEXTURES) {}

  register(tex: THREE.Texture | null | undefined): number {
    if (!tex?.image) return NO_TEXTURE_INDEX;
    const existing = this.indexByUuid.get(tex.uuid);
    if (existing !== undefined) return existing;
    if (this.textures.length >= this.maxTextures) return NO_TEXTURE_INDEX;
    const idx = this.textures.length;
    this.textures.push(tex);
    this.indexByUuid.set(tex.uuid, idx);
    return idx;
  }
}

type MmdLikeMaterial = THREE.Material & {
  map?: THREE.Texture | null;
  envMap?: THREE.Texture | null;
  gradientMap?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  emissiveMap?: THREE.Texture | null;
  alphaMap?: THREE.Texture | null;
  emissive?: THREE.Color;
  color?: THREE.Color;
  emissiveIntensity?: number;
  normalScale?: THREE.Vector2;
  combine?: number;
  opacity?: number;
  transparent?: boolean;
  alphaTest?: number;
  metalness?: number;
};

function textureHint(tex: THREE.Texture | null | undefined): string {
  if (!tex) return '';
  const ud = tex.userData as { sourceFile?: string; fileName?: string } | undefined;
  return `${tex.name ?? ''} ${ud?.sourceFile ?? ''} ${ud?.fileName ?? ''}`.toLowerCase();
}

function isSphereMultiply(
  combine: number | undefined,
  envMap: THREE.Texture | null | undefined
): boolean {
  if (combine === THREE.AddOperation) return false;
  if (combine === THREE.MultiplyOperation) return true;
  const hint = textureHint(envMap);
  if (hint.includes('.spa')) return false;
  if (hint.includes('.sph')) return true;
  return true;
}

function getMaterialMap(material: THREE.Material): THREE.Texture | null {
  const mat = material as MmdLikeMaterial;
  if (mat.map?.image) return mat.map;
  return null;
}

function getEnvMap(material: THREE.Material): THREE.Texture | null {
  const mat = material as MmdLikeMaterial;
  if (mat.envMap?.image) return mat.envMap;
  const ud = material.userData as { mmdEnvMap?: THREE.Texture | null } | undefined;
  if (ud?.mmdEnvMap?.image) return ud.mmdEnvMap;
  return null;
}

function getCombine(material: THREE.Material): number | undefined {
  const mat = material as MmdLikeMaterial;
  if (mat.combine !== undefined) return mat.combine;
  const ud = material.userData as { mmdCombine?: number } | undefined;
  return ud?.mmdCombine;
}

function getNormalMap(material: THREE.Material): THREE.Texture | null {
  const mat = material as MmdLikeMaterial;
  if (mat.normalMap?.image) return mat.normalMap;
  return null;
}

export function bakeMmdMaterial(
  material: THREE.Material,
  registry: TextureRegistry
): BakedMaterial {
  const mat = material as MmdLikeMaterial;
  const name = material.name?.toLowerCase() ?? '';

  let matType = 0;
  if (name.includes('skin') || name.includes('face') || name.includes('body')) {
    matType = 4;
  } else if (mat.metalness !== undefined && mat.metalness > 0.55) {
    matType = 1;
  }

  const color = mat.color
    ? ([mat.color.r, mat.color.g, mat.color.b] as [number, number, number])
    : ([1, 1, 1] as [number, number, number]);

  const emissive = mat.emissive
    ? ([mat.emissive.r, mat.emissive.g, mat.emissive.b] as [number, number, number])
    : ([0, 0, 0] as [number, number, number]);

  const hasGradient = Boolean(mat.gradientMap?.image);
  const alphaTest =
    (mat.transparent && mat.opacity !== undefined && mat.opacity < 0.999) ||
    Boolean(mat.alphaMap?.image) ||
    (mat.alphaTest !== undefined && mat.alphaTest > 0.01);

  const sphereMultiply = isSphereMultiply(getCombine(material), getEnvMap(material));

  return {
    color,
    emissive,
    emissiveIntensity: mat.emissiveIntensity ?? 1,
    matType,
    mapIndex: registry.register(getMaterialMap(material) ?? mat.map),
    sphereIndex: registry.register(getEnvMap(material)),
    gradientIndex: registry.register(mat.gradientMap),
    normalIndex: registry.register(getNormalMap(material) ?? mat.normalMap),
    emissiveMapIndex: registry.register(mat.emissiveMap),
    alphaIndex: registry.register(mat.alphaMap),
    sphereMultiply,
    alphaTest,
    alphaCutoff: Math.max(0.35, mat.alphaTest ?? 0.4),
    normalScale: mat.normalScale?.x ?? 1,
    toonStrength: hasGradient ? 1 : 0,
  };
}

export class MaterialRegistry {
  private readonly indexByUuid = new Map<string, number>();
  readonly materials: BakedMaterial[] = [];

  register(material: THREE.Material, textureRegistry: TextureRegistry): number {
    const existing = this.indexByUuid.get(material.uuid);
    if (existing !== undefined) return existing;
    const idx = this.materials.length;
    this.materials.push(bakeMmdMaterial(material, textureRegistry));
    this.indexByUuid.set(material.uuid, idx);
    return idx;
  }
}
