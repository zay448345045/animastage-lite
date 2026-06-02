import * as THREE from 'three';

/** Prefer half-float for HDR bloom; fall back if the GPU rejects color-buffer half float. */
export function resolvePostFxFramebufferType(
  gl: THREE.WebGLRenderer
): THREE.TextureDataType {
  const ctx = gl.getContext();
  const halfFloatOk =
    ctx.getExtension('EXT_color_buffer_half_float') != null ||
    ctx.getExtension('WEBGL_color_buffer_float') != null;

  return halfFloatOk ? THREE.HalfFloatType : THREE.UnsignedByteType;
}
