import type * as THREE from 'three';

type WebGpuRendererFlag = THREE.WebGLRenderer & { isWebGPURenderer?: boolean };

/** True when the active r3f renderer is Three.js WebGPURenderer. */
export function isWebGpuRenderer(gl: THREE.WebGLRenderer): boolean {
  return Boolean((gl as WebGpuRendererFlag).isWebGPURenderer);
}

/** Async WebGPU probe — avoids three/addons top-level await (breaks Vite optimizeDeps). */
export async function probeWebGpuSupport(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}
