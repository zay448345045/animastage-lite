import * as THREE from 'three';
import { HEAVY_MESH_MEMORY } from './memoryProfile';
import { yieldToMain } from '../../utils/yieldMainThread';

function resizeTextureSource(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  maxSize: number
): HTMLCanvasElement {
  const w = 'width' in image ? image.width : 0;
  const h = 'height' in image ? image.height : 0;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const tw = Math.max(1, Math.floor(w * scale));
  const th = Math.max(1, Math.floor(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(image as CanvasImageSource, 0, 0, tw, th);
  }
  return canvas;
}

async function resizeTextureSourceAsync(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  maxSize: number
): Promise<HTMLCanvasElement | ImageBitmap> {
  const w = 'width' in image ? image.width : 0;
  const h = 'height' in image ? image.height : 0;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const tw = Math.max(1, Math.floor(w * scale));
  const th = Math.max(1, Math.floor(h * scale));

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(image as ImageBitmapSource, {
        resizeWidth: tw,
        resizeHeight: th,
        resizeQuality: 'high',
      });
    } catch {
      // fallback to canvas resizing below
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(image as CanvasImageSource, 0, 0, tw, th);
  }
  return canvas;
}

const TEXTURE_KEYS = [
  'map',
  'normalMap',
  'emissiveMap',
  'alphaMap',
  'specularMap',
  'lightMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'roughnessMap',
  'metalnessMap',
] as const;

/** Downscale oversized textures to reduce GPU + RAM pressure on ultra-heavy imports. */
export function capMaterialTextureResolution(
  root: THREE.Object3D,
  maxSize = HEAVY_MESH_MEMORY.maxTextureSize
): number {
  let capped = 0;
  const seen = new WeakSet<THREE.Texture>();

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.SkinnedMesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat) continue;
      for (const key of TEXTURE_KEYS) {
        const tex = (mat as Record<string, THREE.Texture | undefined>)[key];
        if (!tex || seen.has(tex) || tex.userData.__memoryCapped) continue;
        seen.add(tex);
        const img = tex.image as { width?: number; height?: number } | undefined;
        if (!img?.width || !img.height) continue;
        if (img.width <= maxSize && img.height <= maxSize) continue;

        try {
          const canvas = resizeTextureSource(img as HTMLImageElement | HTMLCanvasElement | ImageBitmap, maxSize);
          tex.image = canvas;
          tex.needsUpdate = true;
          tex.userData.__memoryCapped = true;
          capped++;
        } catch {
          /* ignore broken image sources */
        }
      }
    }
  });

  return capped;
}

/** Same as capMaterialTextureResolution but yields between textures so the UI stays responsive. */
const YIELD_CHUNK_SIZE = 8;

export async function capMaterialTextureResolutionAsync(
  root: THREE.Object3D,
  maxSize = HEAVY_MESH_MEMORY.maxTextureSize
): Promise<number> {
  const seen = new WeakSet<THREE.Texture>();
  const stack: THREE.Object3D[] = [root];

  let capped = 0;
  let processed = 0;

  while (stack.length > 0) {
    const obj = stack.pop()!;
    for (const child of obj.children) {
      stack.push(child);
    }

    if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.SkinnedMesh)) continue;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat) continue;
      for (const key of TEXTURE_KEYS) {
        const tex = (mat as Record<string, THREE.Texture | undefined>)[key];
        if (!tex || seen.has(tex) || tex.userData.__memoryCapped) continue;
        seen.add(tex);
        const img = tex.image as { width?: number; height?: number } | undefined;
        if (!img?.width || !img.height) continue;
        if (img.width <= maxSize && img.height <= maxSize) continue;
        try {
          const resized = await resizeTextureSourceAsync(img, maxSize);
          tex.image = resized;
          tex.needsUpdate = true;
          tex.userData.__memoryCapped = true;
          capped++;
        } catch {
          /* ignore */
        }
        processed++;
        await yieldToMain();
      }
    }
  }

  if (processed > 0 && processed % YIELD_CHUNK_SIZE !== 0) {
    await yieldToMain();
  }

  return capped;
}
