import type { WebGLRenderer } from 'three';

/**
 * EffectComposer reads `getContextAttributes().alpha` on init — must be non-null.
 */
export function isWebGlContextReady(gl: WebGLRenderer): boolean {
  try {
    const ctx = gl.getContext();
    if (!ctx) return false;
    const attrs = ctx.getContextAttributes();
    return attrs != null && typeof attrs.alpha === 'boolean';
  } catch {
    return false;
  }
}
