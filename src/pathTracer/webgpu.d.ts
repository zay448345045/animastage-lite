/** Minimal WebGPU typings for path tracer (DOM lib coverage varies by TS version). */
interface GPUCanvasContext {
  configure(configuration: GPUCanvasConfiguration): void;
  getCurrentTexture(): GPUTexture;
}

interface GPUCanvasConfiguration {
  device: GPUDevice;
  format: GPUTextureFormat;
  alphaMode?: GPUCanvasAlphaMode;
  usage?: number;
}

interface Navigator {
  gpu?: GPU;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
  getPreferredCanvasFormat(): GPUTextureFormat;
}

interface GPURequestAdapterOptions {
  powerPreference?: 'low-power' | 'high-performance';
}

interface GPUAdapter {
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

interface GPUDeviceDescriptor {
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
}

interface GPUDevice {
  queue: GPUQueue;
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
  createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
}

interface GPUTextureDescriptor {
  size: [number, number, number] | GPUExtent3D;
  format: GPUTextureFormat;
  usage: number;
  dimension?: '1d' | '2d' | '3d';
}

interface GPUExtent3D {
  width: number;
  height?: number;
  depthOrArrayLayers?: number;
}

interface GPUSamplerDescriptor {
  magFilter?: GPUFilterMode;
  minFilter?: GPUFilterMode;
  addressModeU?: GPUAddressMode;
  addressModeV?: GPUAddressMode;
}

type GPUFilterMode = 'nearest' | 'linear';
type GPUAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';

interface GPUSampler {}

interface GPUTexture {
  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
  destroy(): void;
}

interface GPUTextureViewDescriptor {
  dimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
}

interface GPUQueue {
  writeBuffer(
    buffer: GPUBuffer,
    bufferOffset: number,
    data: BufferSource | SharedArrayBuffer,
    dataOffset?: number,
    size?: number
  ): void;
  submit(commandBuffers: GPUCommandBuffer[]): void;
  onSubmittedWorkDone(): Promise<void>;
  copyExternalImageToTexture(
    source: GPUCopyExternalImageSource,
    destination: GPUCopyExternalImageDestination,
    copySize: [number, number, number]
  ): void;
}

interface GPUCopyExternalImageSource {
  source: ImageBitmap | HTMLCanvasElement | OffscreenCanvas;
}

interface GPUCopyExternalImageDestination {
  texture: GPUTexture;
  origin?: { x?: number; y?: number; z?: number };
}

interface GPUBufferDescriptor {
  size: number;
  usage: number;
  mappedAtCreation?: boolean;
}

interface GPUBuffer {
  destroy(): void;
  mapAsync(mode: number): Promise<void>;
  getMappedRange(offset?: number, size?: number): ArrayBuffer;
  unmap(): void;
}

interface GPUShaderModuleDescriptor {
  code: string;
}

interface GPUShaderModule {}

interface GPUComputePipelineDescriptor {
  layout: 'auto' | GPUPipelineLayout;
  compute: GPUProgrammableStage;
}

interface GPURenderPipelineDescriptor {
  layout: 'auto' | GPUPipelineLayout;
  vertex: GPUVertexState;
  fragment?: GPUFragmentState;
  primitive?: GPUPrimitiveState;
}

interface GPUProgrammableStage {
  module: GPUShaderModule;
  entryPoint: string;
}

interface GPUVertexState {
  module: GPUShaderModule;
  entryPoint: string;
}

interface GPUFragmentState {
  module: GPUShaderModule;
  entryPoint: string;
  targets: GPUColorTargetState[];
}

interface GPUColorTargetState {
  format: GPUTextureFormat;
}

interface GPUPrimitiveState {
  topology?: GPUPrimitiveTopology;
}

type GPUPrimitiveTopology = 'triangle-list' | 'triangle-strip' | 'line-list' | 'point-list';

interface GPUPipelineLayout {}

interface GPUComputePipeline {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPURenderPipeline {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPUBindGroupLayout {}

interface GPUBindGroupDescriptor {
  layout: GPUBindGroupLayout;
  entries: GPUBindGroupEntry[];
}

interface GPUBindGroupEntry {
  binding: number;
  resource: GPUBindingResource;
}

type GPUBindingResource =
  | { buffer: GPUBuffer }
  | GPUTextureView
  | GPUSampler;

interface GPUCommandEncoderDescriptor {}

interface GPUCommandEncoder {
  beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
  copyTextureToBuffer(
    source: GPUImageCopyTexture,
    destination: GPUImageCopyBuffer,
    copySize: GPUExtent3D
  ): void;
  finish(): GPUCommandBuffer;
}

interface GPUImageCopyTexture {
  texture: GPUTexture;
}

interface GPUImageCopyBuffer {
  buffer: GPUBuffer;
  bytesPerRow: number;
  rowsPerImage?: number;
}

interface GPUComputePassDescriptor {}

interface GPUComputePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup): void;
  dispatchWorkgroups(workgroupCountX: number, workgroupCountY?: number, workgroupCountZ?: number): void;
  end(): void;
}

interface GPURenderPassDescriptor {
  colorAttachments: GPURenderPassColorAttachment[];
}

interface GPURenderPassColorAttachment {
  view: GPUTextureView;
  clearValue?: GPUColor;
  loadOp: GPULoadOp;
  storeOp: GPUStoreOp;
}

interface GPUColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

type GPULoadOp = 'clear' | 'load';
type GPUStoreOp = 'store' | 'discard';

interface GPURenderPassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup): void;
  draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
  end(): void;
}

interface GPUCommandBuffer {}

interface GPUTexture {
  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
}

interface GPUTextureViewDescriptor {}

interface GPUTextureView {}

type GPUTextureFormat = string;
type GPUCanvasAlphaMode = 'opaque' | 'premultiplied';

declare const GPUBufferUsage: {
  STORAGE: number;
  COPY_DST: number;
  COPY_SRC: number;
  UNIFORM: number;
  MAP_READ: number;
};

declare const GPUTextureUsage: {
  TEXTURE_BINDING: number;
  COPY_DST: number;
  COPY_SRC: number;
  RENDER_ATTACHMENT: number;
};

declare const GPUMapMode: {
  READ: number;
};

interface HTMLCanvasElement {
  getContext(contextId: 'webgpu'): GPUCanvasContext | null;
  convertToBlob?(options?: { type?: string; quality?: number }): Promise<Blob>;
}

interface GPUFeatureName extends string {}

export {};
