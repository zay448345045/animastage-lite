import * as THREE from 'three';
import { NO_TEXTURE_INDEX, PATH_TRACER_MAX_TEXTURES } from './types';

export { NO_TEXTURE_INDEX, PATH_TRACER_MAX_TEXTURES, PATH_TRACER_NO_TEXTURE } from './types';
export const PATH_TRACER_TEX_SIZE = 1024;

export interface GpuTextureBundle {
  texture: GPUTexture;
  view: GPUTextureView;
  sampler: GPUSampler;
  layerCount: number;
}

const uploadCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (uploadCanvas) {
  uploadCanvas.width = PATH_TRACER_TEX_SIZE;
  uploadCanvas.height = PATH_TRACER_TEX_SIZE;
}

function isDataTextureImage(
  image: unknown
): image is { data: ArrayLike<number>; width: number; height: number } {
  if (!image || typeof image !== 'object') return false;
  const img = image as { data?: ArrayLike<number>; width?: number; height?: number };
  return (
    img.data !== undefined &&
    (img.width ?? 0) > 0 &&
    (img.height ?? 0) > 0 &&
    img.data.length >= (img.width ?? 0) * (img.height ?? 0) * 4
  );
}

function isCanvasImageSource(image: unknown): image is CanvasImageSource {
  if (!image) return false;
  if (image instanceof HTMLImageElement) {
    return image.complete && image.naturalWidth > 0;
  }
  if (image instanceof HTMLCanvasElement) return image.width > 0;
  if (typeof OffscreenCanvas !== 'undefined' && image instanceof OffscreenCanvas) {
    return image.width > 0;
  }
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return image.width > 0;
  }
  if (typeof VideoFrame !== 'undefined' && image instanceof VideoFrame) {
    return true;
  }
  return false;
}

/** Convert MMD DataTexture pixel buffer to a canvas (TGA / raw RGBA). */
function dataImageToCanvas(
  image: { data: ArrayLike<number>; width: number; height: number },
  flipY: boolean
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.createImageData(image.width, image.height);
  const rowBytes = image.width * 4;

  if (flipY) {
    for (let y = 0; y < image.height; y += 1) {
      const srcRow = image.height - 1 - y;
      for (let x = 0; x < rowBytes; x += 1) {
        imageData.data[y * rowBytes + x] = image.data[srcRow * rowBytes + x]!;
      }
    }
  } else {
    for (let i = 0; i < imageData.data.length; i += 1) {
      imageData.data[i] = image.data[i]!;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function resolveCanvasImageSource(tex: THREE.Texture): CanvasImageSource | null {
  const image = tex.image;
  if (!image) return null;

  if (isCanvasImageSource(image)) return image;

  if (isDataTextureImage(image)) {
    return dataImageToCanvas(image, tex.flipY);
  }

  return null;
}

/** Draw a Three.js texture into the upload canvas (letterboxed, sRGB-ish). */
function drawTextureToCanvas(
  tex: THREE.Texture,
  ctx: CanvasRenderingContext2D,
  texSize: number
): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, texSize, texSize);

  const source = resolveCanvasImageSource(tex);
  if (!source) return;

  let imgW = 0;
  let imgH = 0;
  if (source instanceof HTMLImageElement) {
    imgW = source.naturalWidth;
    imgH = source.naturalHeight;
  } else if ('width' in source && 'height' in source) {
    imgW = source.width as number;
    imgH = source.height as number;
  }
  if (imgW <= 0 || imgH <= 0) return;

  const scale = Math.min(texSize / imgW, texSize / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  const x = (texSize - w) * 0.5;
  const y = (texSize - h) * 0.5;

  ctx.drawImage(source, x, y, w, h);
}

export interface TextureUploadOptions {
  textureSize?: number;
  maxTextures?: number;
}

export function texturesFingerprint(textures: THREE.Texture[]): string {
  return textures.map((t) => `${t.uuid}:${t.version}`).join('|');
}

/** Pack MMD diffuse maps into a WebGPU 2D texture array for path tracing. */
export async function uploadTextureArray(
  device: GPUDevice,
  textures: THREE.Texture[],
  options?: TextureUploadOptions
): Promise<GpuTextureBundle> {
  const texSize = options?.textureSize ?? PATH_TRACER_TEX_SIZE;
  const maxTextures = options?.maxTextures ?? PATH_TRACER_MAX_TEXTURES;
  const layers = Math.max(1, Math.min(textures.length, maxTextures));

  const texture = device.createTexture({
    size: [texSize, texSize, layers],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
  });

  if (!uploadCanvas) {
    return {
      texture,
      view: texture.createView({ dimension: '2d-array' }),
      sampler,
      layerCount: layers,
    };
  }

  uploadCanvas.width = texSize;
  uploadCanvas.height = texSize;
  const ctx = uploadCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      texture,
      view: texture.createView({ dimension: '2d-array' }),
      sampler,
      layerCount: layers,
    };
  }

  for (let i = 0; i < textures.length && i < maxTextures; i += 1) {
    const tex = textures[i]!;
    if (tex.image && !resolveCanvasImageSource(tex)) {
      tex.needsUpdate = true;
    }

    try {
      drawTextureToCanvas(tex, ctx, texSize);
      const bitmap = await createImageBitmap(uploadCanvas);
      device.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture, origin: { x: 0, y: 0, z: i } },
        [texSize, texSize, 1]
      );
      bitmap.close();
    } catch (error) {
      console.warn('[PathTracer] Texture upload failed for layer', i, tex.name ?? '', error);
    }
  }

  await device.queue.onSubmittedWorkDone();

  return {
    texture,
    view: texture.createView({ dimension: '2d-array' }),
    sampler,
    layerCount: layers,
  };
}

export function destroyTextureBundle(bundle: GpuTextureBundle | null): void {
  bundle?.texture.destroy();
}
