import {
  BLOOM_BLUR_WGSL,
  BLOOM_EXTRACT_WGSL,
  DENOISE_WGSL,
  DISPLAY_UNIFORM_SIZE,
  DISPLAY_WGSL,
  PATH_TRACER_WGSL,
  PT_UNIFORM_SIZE,
} from './shaders';
import type {
  BakedMaterial,
  BakedTriangle,
  PathTracerCamera,
  PathTracerRenderSettings,
  PathTracerSceneData,
} from './types';
import {
  MMD_FLAG_ALPHA_TEST,
  MMD_FLAG_SPHERE_MULTIPLY,
  PATH_TRACER_MAX_MATERIALS,
  PATH_TRACER_MAX_TRIANGLES,
} from './types';
import { NO_TEXTURE_INDEX } from './textureUpload';
import { getLightPreset, getScenePreset } from '../visualFx/visualFxPresets';
import {
  destroyTextureBundle,
  type GpuTextureBundle,
  texturesFingerprint,
  uploadTextureArray,
} from './textureUpload';

const TRIANGLE_STRIDE = 64;
const TRIANGLE_STRIDE_FLOATS = 16;
const MATERIAL_STRIDE = 96;
const MATERIAL_STRIDE_FLOATS = 24;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export class PathTracerEngine {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;
  private canvas: HTMLCanvasElement;

  private width = 1;
  private height = 1;
  private halfW = 1;
  private halfH = 1;

  private ptPipe!: GPUComputePipeline;
  private dnPipe!: GPUComputePipeline;
  private bePipe!: GPUComputePipeline;
  private bbPipe!: GPUComputePipeline;
  private dpPipe!: GPURenderPipeline;

  private ptBG!: GPUBindGroup;
  private dnBG!: GPUBindGroup;
  private beBG!: GPUBindGroup;
  private bbH!: GPUBindGroup;
  private bbV!: GPUBindGroup;
  private dpBG!: GPUBindGroup;
  private dpBGAccum!: GPUBindGroup;

  private ptUni!: GPUBuffer;
  private denoiseUni!: GPUBuffer;
  private bloomUni!: GPUBuffer;
  private displayUni!: GPUBuffer;
  private trianglesBuf!: GPUBuffer;
  private materialsBuf!: GPUBuffer;
  private accumBuf!: GPUBuffer;
  private gNormalDepth!: GPUBuffer;
  private gAlbedoMat!: GPUBuffer;
  private denoisedBuf!: GPUBuffer;
  private bloomA!: GPUBuffer;
  private bloomB!: GPUBuffer;

  private texBundle: GpuTextureBundle | null = null;
  private textureKey = '';
  private textureLayerCount = 0;
  private textureUploadOptions: { textureSize: number; maxTextures: number } = {
    textureSize: 512,
    maxTextures: 64,
  };

  private ptUniData = new ArrayBuffer(PT_UNIFORM_SIZE);
  private ptF = new Float32Array(this.ptUniData);
  private ptU = new Uint32Array(this.ptUniData);
  private dpUniData = new ArrayBuffer(DISPLAY_UNIFORM_SIZE);
  private dpF = new Float32Array(this.dpUniData);
  private dpU = new Uint32Array(this.dpUniData);

  private frame = 0;
  private triangleCount = 0;
  private materialCount = 0;
  private initialized = false;
  private deviceLost = false;
  private presentTex: GPUTexture | null = null;

  private camera: PathTracerCamera = {
    position: [0, 14, 28],
    target: [0, 10, 0],
    right: [1, 0, 0],
    up: [0, 1, 0],
    forward: [0, -0.25, -1],
    fov: 45,
    aperture: 0,
    focusDist: 20,
  };

  private settings: PathTracerRenderSettings = {
    visualFx: {} as PathTracerRenderSettings['visualFx'],
    bounces: 5,
    samplesPerFrame: 1,
    denoise: true,
    bloom: true,
    bloomThreshold: 0.85,
    bloomStrength: 0.14,
    exposure: 1.05,
    vignetteStrength: 0.25,
    floorY: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  static async isSupported(): Promise<boolean> {
    return typeof navigator !== 'undefined' && Boolean(navigator.gpu);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (!navigator.gpu) throw new Error('WebGPU is not available');

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('No WebGPU adapter');

    this.device = await adapter.requestDevice();
    void this.device.lost.then((info) => {
      console.warn('[PathTracer] WebGPU device lost:', info.message);
      this.initialized = false;
      this.deviceLost = true;
      destroyTextureBundle(this.texBundle);
      this.texBundle = null;
    });
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    this.ptPipe = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: PATH_TRACER_WGSL }),
        entryPoint: 'cs_main',
      },
    });
    this.dnPipe = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: DENOISE_WGSL }),
        entryPoint: 'cs_main',
      },
    });
    this.bePipe = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: BLOOM_EXTRACT_WGSL }),
        entryPoint: 'cs_main',
      },
    });
    this.bbPipe = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({ code: BLOOM_BLUR_WGSL }),
        entryPoint: 'cs_main',
      },
    });
    const dpMod = this.device.createShaderModule({ code: DISPLAY_WGSL });
    this.dpPipe = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: dpMod, entryPoint: 'vs_main' },
      fragment: { module: dpMod, entryPoint: 'fs_main', targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list' },
    });

    this.ptUni = this.device.createBuffer({
      size: PT_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.denoiseUni = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.bloomUni = this.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.displayUni = this.device.createBuffer({
      size: DISPLAY_UNIFORM_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.trianglesBuf = this.device.createBuffer({
      size: TRIANGLE_STRIDE * PATH_TRACER_MAX_TRIANGLES,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.materialsBuf = this.device.createBuffer({
      size: MATERIAL_STRIDE * PATH_TRACER_MAX_MATERIALS,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.texBundle = await uploadTextureArray(this.device, []);
    this.textureLayerCount = 0;

    this.initialized = true;
    this.resize(this.canvas.clientWidth || 640, this.canvas.clientHeight || 480);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getSampleCount(): number {
    return this.frame;
  }

  isReady(): boolean {
    return this.initialized && !this.deviceLost;
  }

  dispose(): void {
    destroyTextureBundle(this.texBundle);
    this.texBundle = null;
    this.presentTex?.destroy();
    this.presentTex = null;
    this.accumBuf?.destroy();
    this.gNormalDepth?.destroy();
    this.gAlbedoMat?.destroy();
    this.denoisedBuf?.destroy();
    this.bloomA?.destroy();
    this.bloomB?.destroy();
    this.trianglesBuf?.destroy();
    this.materialsBuf?.destroy();
    this.initialized = false;
  }

  resize(width: number, height: number, scale = 1): void {
    if (!this.initialized || !this.device) return;

    const s = Math.max(0.25, Math.min(1, scale));
    let w = Math.max(64, Math.floor(width * s));
    let h = Math.max(64, Math.floor(height * s));

    const maxW = this.settings.maxInternalWidth ?? 1280;
    const maxH = this.settings.maxInternalHeight ?? 720;
    if (w > maxW || h > maxH) {
      const fit = Math.min(maxW / w, maxH / h);
      w = Math.max(64, Math.floor(w * fit));
      h = Math.max(64, Math.floor(h * fit));
    }

    if (w === this.width && h === this.height && this.accumBuf && this.presentTex) return;

    const prevW = this.width;
    const prevH = this.height;
    this.width = w;
    this.height = h;
    this.halfW = Math.max(1, Math.floor(w / 2));
    this.halfH = Math.max(1, Math.floor(h / 2));
    this.canvas.width = w;
    this.canvas.height = h;
    this.presentTex?.destroy();
    this.presentTex = this.device.createTexture({
      size: [w, h, 1],
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const fullPixels = w * h;
    const halfPixels = this.halfW * this.halfH;
    const fullSize = fullPixels * 16;
    const halfSize = halfPixels * 16;

    this.accumBuf?.destroy();
    this.gNormalDepth?.destroy();
    this.gAlbedoMat?.destroy();
    this.denoisedBuf?.destroy();
    this.bloomA?.destroy();
    this.bloomB?.destroy();

    this.accumBuf = this.device.createBuffer({
      size: fullSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.gNormalDepth = this.device.createBuffer({
      size: fullSize,
      usage: GPUBufferUsage.STORAGE,
    });
    this.gAlbedoMat = this.device.createBuffer({
      size: fullSize,
      usage: GPUBufferUsage.STORAGE,
    });
    this.denoisedBuf = this.device.createBuffer({
      size: fullSize,
      usage: GPUBufferUsage.STORAGE,
    });
    this.bloomA = this.device.createBuffer({
      size: halfSize,
      usage: GPUBufferUsage.STORAGE,
    });
    this.bloomB = this.device.createBuffer({
      size: halfSize,
      usage: GPUBufferUsage.STORAGE,
    });

    this.dnBG = this.device.createBindGroup({
      layout: this.dnPipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.denoiseUni } },
        { binding: 1, resource: { buffer: this.accumBuf } },
        { binding: 2, resource: { buffer: this.gNormalDepth } },
        { binding: 3, resource: { buffer: this.denoisedBuf } },
      ],
    });
    this.beBG = this.device.createBindGroup({
      layout: this.bePipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.bloomUni } },
        { binding: 1, resource: { buffer: this.denoisedBuf } },
        { binding: 2, resource: { buffer: this.bloomA } },
      ],
    });
    this.bbH = this.device.createBindGroup({
      layout: this.bbPipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.bloomUni } },
        { binding: 1, resource: { buffer: this.bloomA } },
        { binding: 2, resource: { buffer: this.bloomB } },
      ],
    });
    this.bbV = this.device.createBindGroup({
      layout: this.bbPipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.bloomUni } },
        { binding: 1, resource: { buffer: this.bloomB } },
        { binding: 2, resource: { buffer: this.bloomA } },
      ],
    });
    this.dpBG = this.device.createBindGroup({
      layout: this.dpPipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.displayUni } },
        { binding: 1, resource: { buffer: this.denoisedBuf } },
        { binding: 2, resource: { buffer: this.bloomA } },
      ],
    });
    this.dpBGAccum = this.device.createBindGroup({
      layout: this.dpPipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.displayUni } },
        { binding: 1, resource: { buffer: this.accumBuf } },
        { binding: 2, resource: { buffer: this.bloomA } },
      ],
    });

    this.rebuildPtBindGroup();
    const dw = Math.abs(w - prevW);
    const dh = Math.abs(h - prevH);
    if (dw > 12 || dh > 12) {
      this.resetAccumulation();
    }
  }

  private rebuildPtBindGroup(): void {
    if (!this.texBundle || !this.accumBuf) return;
    this.ptBG = this.device.createBindGroup({
      layout: this.ptPipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.ptUni } },
        { binding: 1, resource: { buffer: this.accumBuf } },
        { binding: 2, resource: { buffer: this.trianglesBuf } },
        { binding: 3, resource: { buffer: this.gNormalDepth } },
        { binding: 4, resource: { buffer: this.gAlbedoMat } },
        { binding: 5, resource: this.texBundle.view },
        { binding: 6, resource: this.texBundle.sampler },
        { binding: 7, resource: { buffer: this.materialsBuf } },
      ],
    });
  }

  private async ensureTextures(textures: import('three').Texture[]): Promise<void> {
    const key = `${texturesFingerprint(textures)}|${this.textureUploadOptions.textureSize}|${this.textureUploadOptions.maxTextures}`;
    if (key === this.textureKey && this.texBundle) {
      this.textureLayerCount = Math.min(textures.length, this.textureUploadOptions.maxTextures);
      return;
    }

    destroyTextureBundle(this.texBundle);
    this.texBundle = await uploadTextureArray(this.device, textures, this.textureUploadOptions);
    this.textureKey = key;
    this.textureLayerCount = Math.min(textures.length, this.textureUploadOptions.maxTextures);
    this.rebuildPtBindGroup();
  }

  setCamera(camera: PathTracerCamera): void {
    this.camera = camera;
  }

  setSettings(settings: PathTracerRenderSettings): void {
    this.settings = { ...this.settings, ...settings };
    if (settings.textureSize !== undefined || settings.maxTextures !== undefined) {
      this.textureUploadOptions = {
        textureSize: settings.textureSize ?? this.textureUploadOptions.textureSize,
        maxTextures: settings.maxTextures ?? this.textureUploadOptions.maxTextures,
      };
    }
  }

  private packMaterialIndex(idx: number): number {
    return idx === NO_TEXTURE_INDEX ? 0xffffffff : idx;
  }

  private uploadMaterials(materials: BakedMaterial[]): void {
    const mats = materials.slice(0, PATH_TRACER_MAX_MATERIALS);
    this.materialCount = Math.max(1, mats.length);
    const bytes = new ArrayBuffer(MATERIAL_STRIDE * PATH_TRACER_MAX_MATERIALS);
    const f32 = new Float32Array(bytes);
    const u32 = new Uint32Array(bytes);

    const writeMat = (mat: BakedMaterial, i: number) => {
      const b = i * MATERIAL_STRIDE_FLOATS;
      f32[b + 0] = mat.color[0];
      f32[b + 1] = mat.color[1];
      f32[b + 2] = mat.color[2];
      u32[b + 3] = mat.matType;
      f32[b + 4] = mat.emissive[0];
      f32[b + 5] = mat.emissive[1];
      f32[b + 6] = mat.emissive[2];
      f32[b + 7] = mat.emissiveIntensity;
      u32[b + 8] = this.packMaterialIndex(mat.mapIndex);
      u32[b + 9] = this.packMaterialIndex(mat.sphereIndex);
      u32[b + 10] = this.packMaterialIndex(mat.gradientIndex);
      u32[b + 11] = this.packMaterialIndex(mat.normalIndex);
      u32[b + 12] = this.packMaterialIndex(mat.emissiveMapIndex);
      u32[b + 13] = this.packMaterialIndex(mat.alphaIndex);
      let flags = 0;
      if (mat.sphereMultiply) flags |= MMD_FLAG_SPHERE_MULTIPLY;
      if (mat.alphaTest) flags |= MMD_FLAG_ALPHA_TEST;
      u32[b + 14] = flags;
      f32[b + 15] = mat.alphaCutoff;
      f32[b + 16] = mat.normalScale;
      f32[b + 17] = mat.toonStrength;
    };

    if (mats.length === 0) {
      writeMat(
        {
          color: [1, 1, 1],
          emissive: [0, 0, 0],
          emissiveIntensity: 1,
          matType: 0,
          mapIndex: NO_TEXTURE_INDEX,
          sphereIndex: NO_TEXTURE_INDEX,
          gradientIndex: NO_TEXTURE_INDEX,
          normalIndex: NO_TEXTURE_INDEX,
          emissiveMapIndex: NO_TEXTURE_INDEX,
          alphaIndex: NO_TEXTURE_INDEX,
          sphereMultiply: true,
          alphaTest: false,
          alphaCutoff: 0.5,
          normalScale: 1,
          toonStrength: 0,
        },
        0
      );
    } else {
      mats.forEach((mat, i) => writeMat(mat, i));
    }

    this.device.queue.writeBuffer(this.materialsBuf, 0, bytes);
  }

  async uploadScene(scene: PathTracerSceneData): Promise<void> {
    if (!this.initialized || !this.device) return;

    try {
      await this.ensureTextures(scene.textures);
    } catch (err) {
      console.warn('[PathTracer] Texture upload aborted:', err);
      this.initialized = false;
      return;
    }
    this.uploadMaterials(scene.materials);

    const tris = scene.triangles.slice(0, PATH_TRACER_MAX_TRIANGLES);
    this.triangleCount = tris.length;
    const bytes = new ArrayBuffer(TRIANGLE_STRIDE * PATH_TRACER_MAX_TRIANGLES);
    const f32 = new Float32Array(bytes);
    const u32 = new Uint32Array(bytes);

    tris.forEach((tri, i) => {
      const b = i * TRIANGLE_STRIDE_FLOATS;
      f32[b + 0] = tri.v0[0];
      f32[b + 1] = tri.v0[1];
      f32[b + 2] = tri.v0[2];
      f32[b + 3] = tri.uv0[0];
      f32[b + 4] = tri.v1[0];
      f32[b + 5] = tri.v1[1];
      f32[b + 6] = tri.v1[2];
      f32[b + 7] = tri.uv0[1];
      f32[b + 8] = tri.v2[0];
      f32[b + 9] = tri.v2[1];
      f32[b + 10] = tri.v2[2];
      f32[b + 11] = tri.uv1[0];
      f32[b + 12] = tri.uv1[1];
      f32[b + 13] = tri.uv2[0];
      f32[b + 14] = tri.uv2[1];
      u32[b + 15] = tri.matIndex;
    });

    this.device.queue.writeBuffer(this.trianglesBuf, 0, bytes);
    if (scene.floorY !== undefined) {
      this.settings.floorY = scene.floorY;
    }
  }

  resetAccumulation(): void {
    if (!this.accumBuf) return;
    this.frame = 0;
    this.device.queue.writeBuffer(
      this.accumBuf,
      0,
      new Uint8Array(this.width * this.height * 16)
    );
  }

  renderFrame(): void {
    if (!this.initialized || !this.device || this.deviceLost) return;

    this.writePathTraceUniforms();
    this.writeDenoiseUniforms();
    this.writeDisplayUniforms();

    const useBloom =
      this.settings.bloom !== false && this.settings.visualFx.bloomEnabled;
    const useDenoise = this.settings.denoise !== false;
    const displayBg = useDenoise ? this.dpBG : this.dpBGAccum;

    const enc = this.device.createCommandEncoder();
    {
      const pass = enc.beginComputePass();
      pass.setPipeline(this.ptPipe);
      pass.setBindGroup(0, this.ptBG);
      pass.dispatchWorkgroups(Math.ceil(this.width / 8), Math.ceil(this.height / 8));
      pass.end();
    }
    if (useDenoise) {
      const pass = enc.beginComputePass();
      pass.setPipeline(this.dnPipe);
      pass.setBindGroup(0, this.dnBG);
      pass.dispatchWorkgroups(Math.ceil(this.width / 8), Math.ceil(this.height / 8));
      pass.end();
    }
    if (useBloom) {
      this.writeBloomUniform({ threshold: true });
      {
        const pass = enc.beginComputePass();
        pass.setPipeline(this.bePipe);
        pass.setBindGroup(0, this.beBG);
        pass.dispatchWorkgroups(Math.ceil(this.halfW / 8), Math.ceil(this.halfH / 8));
        pass.end();
      }
      this.writeBloomUniform({ dir: [1, 0] });
      {
        const pass = enc.beginComputePass();
        pass.setPipeline(this.bbPipe);
        pass.setBindGroup(0, this.bbH);
        pass.dispatchWorkgroups(Math.ceil(this.halfW / 8), Math.ceil(this.halfH / 8));
        pass.end();
      }
      this.writeBloomUniform({ dir: [0, 1] });
      {
        const pass = enc.beginComputePass();
        pass.setPipeline(this.bbPipe);
        pass.setBindGroup(0, this.bbV);
        pass.dispatchWorkgroups(Math.ceil(this.halfW / 8), Math.ceil(this.halfH / 8));
        pass.end();
      }
    }
    {
      const view = this.presentTex!.createView();
      const pass = enc.beginRenderPass({
        colorAttachments: [
          {
            view,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });
      pass.setPipeline(this.dpPipe);
      pass.setBindGroup(0, displayBg);
      pass.draw(6);
      pass.end();
    }
    {
      const swapView = this.context.getCurrentTexture().createView();
      const pass = enc.beginRenderPass({
        colorAttachments: [
          {
            view: swapView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });
      pass.setPipeline(this.dpPipe);
      pass.setBindGroup(0, displayBg);
      pass.draw(6);
      pass.end();
    }
    this.device.queue.submit([enc.finish()]);
    this.frame += 1;
  }

  async renderUntilSamples(
    targetSamples: number,
    onProgress?: (samples: number, target: number) => void,
    frameDelayMs = 80
  ): Promise<void> {
    while (this.frame < targetSamples) {
      this.renderFrame();
      onProgress?.(this.frame, targetSamples);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, frameDelayMs);
      });
    }
  }

  private encodeDisplayPass(encoder: GPUCommandEncoder): void {
    if (!this.presentTex) return;
    this.writeDisplayUniforms();
    const useDenoise = this.settings.denoise !== false;
    const displayBg = useDenoise ? this.dpBG : this.dpBGAccum;
    const view = this.presentTex.createView();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    pass.setPipeline(this.dpPipe);
    pass.setBindGroup(0, displayBg);
    pass.draw(6);
    pass.end();
  }

  private writePathTraceUniforms(): void {
    const scenePreset = getScenePreset(this.settings.visualFx.scenePreset);
    const lightPreset = getLightPreset(this.settings.visualFx.lightPreset);
    const sunCol = hexToRgb(lightPreset.key.color);
    const skyTop = hexToRgb(scenePreset.background);
    const skyHor = hexToRgb(lightPreset.hemisphere.ground);

    const sunAz = this.settings.sunAzimuth ?? -0.7;
    const sunEl =
      this.settings.sunAltDeg !== undefined
        ? (this.settings.sunAltDeg * Math.PI) / 180
        : 0.55;
    const ce = Math.cos(sunEl);
    const se = Math.sin(sunEl);
    const ca = Math.cos(sunAz);
    const sa = Math.sin(sunAz);
    const sunVec: [number, number, number] = [-ce * sa, -se, -ce * ca];

    this.ptF[0] = this.width;
    this.ptF[1] = this.height;
    this.ptF[2] = this.camera.aperture ?? 0;
    this.ptF[3] = this.camera.focusDist ?? 20;
    this.ptF[4] = this.camera.position[0];
    this.ptF[5] = this.camera.position[1];
    this.ptF[6] = this.camera.position[2];
    this.ptF[7] = 1.0;
    this.ptF[8] = this.camera.right[0];
    this.ptF[9] = this.camera.right[1];
    this.ptF[10] = this.camera.right[2];
    this.ptF[11] =
      lightPreset.key.intensity * 0.85 * (this.settings.sunIntensityScale ?? 1);
    this.ptF[12] = this.camera.up[0];
    this.ptF[13] = this.camera.up[1];
    this.ptF[14] = this.camera.up[2];
    this.ptF[15] = 0.9995;
    this.ptF[16] = this.camera.forward[0];
    this.ptF[17] = this.camera.forward[1];
    this.ptF[18] = this.camera.forward[2];
    this.ptF[19] = 0;
    this.ptF[20] = sunVec[0];
    this.ptF[21] = sunVec[1];
    this.ptF[22] = sunVec[2];
    this.ptF[23] = 0;
    this.ptF[24] = sunCol[0];
    this.ptF[25] = sunCol[1];
    this.ptF[26] = sunCol[2];
    this.ptF[27] = 0;
    this.ptF[28] = skyTop[0];
    this.ptF[29] = skyTop[1];
    this.ptF[30] = skyTop[2];
    this.ptF[31] = 0;
    this.ptF[32] = skyHor[0];
    this.ptF[33] = skyHor[1];
    this.ptF[34] = skyHor[2];
    this.ptF[35] = 0;
    this.ptU[36] = this.frame;
    this.ptU[37] = this.settings.bounces ?? 5;
    this.ptU[38] = this.settings.samplesPerFrame ?? 1;
    this.ptU[39] = this.triangleCount;
    this.ptU[40] = this.settings.enableNEE === false ? 0 : 1;
    this.ptU[41] = 0;
    this.ptF[42] = this.settings.floorY ?? 0;
    this.ptF[43] = this.camera.fov;
    this.ptU[44] = this.textureLayerCount;
    this.ptU[45] = this.materialCount;

    this.device.queue.writeBuffer(this.ptUni, 0, this.ptUniData);
  }

  private writeDenoiseUniforms(): void {
    const data = new ArrayBuffer(16);
    const f = new Float32Array(data);
    const u = new Uint32Array(data);
    f[0] = this.width;
    f[1] = this.height;
    let radius = 0;
    if (this.settings.denoise !== false && this.frame >= 24) {
      const cap = this.settings.denoiseMaxRadius ?? 2;
      if (this.frame < 48) radius = 1;
      else if (this.frame < 96) radius = Math.min(cap, 2);
      else radius = cap;
    }
    u[2] = radius;
    this.device.queue.writeBuffer(this.denoiseUni, 0, data);
  }

  private writeBloomUniform(opts: { threshold?: boolean; dir?: [number, number] }): void {
    const data = new ArrayBuffer(32);
    const f = new Float32Array(data);
    f[0] = this.width;
    f[1] = this.height;
    f[2] = this.halfW;
    f[3] = this.halfH;
    if (opts.dir) {
      f[4] = opts.dir[0];
      f[5] = opts.dir[1];
    } else {
      f[4] = this.settings.bloomThreshold ?? 0.85;
      f[5] = 1;
    }
    this.device.queue.writeBuffer(this.bloomUni, 0, data);
  }

  private writeDisplayUniforms(): void {
    this.dpF[0] = this.width;
    this.dpF[1] = this.height;
    this.dpF[2] = this.halfW;
    this.dpF[3] = this.halfH;
    this.dpF[4] = this.settings.bloomStrength ?? 0.14;
    this.dpU[5] =
      this.settings.bloom !== false && this.settings.visualFx.bloomEnabled ? 1 : 0;
    this.dpF[6] = this.settings.exposure ?? 1.05;
    this.dpF[7] = this.settings.vignetteStrength ?? 0.25;
    this.dpU[8] = this.settings.denoise === false ? 1 : 0;
    this.device.queue.writeBuffer(this.displayUni, 0, this.dpUniData);
  }
}

export function packTrianglesForDebug(triangles: BakedTriangle[]): number {
  return triangles.length;
}
