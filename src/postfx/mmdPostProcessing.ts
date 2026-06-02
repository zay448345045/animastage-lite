import type { EffectComposer } from 'postprocessing';
import * as THREE from 'three';
import type { CharacterQuality, ViewportFormat } from '../types';

/** Half-float composer buffers — lower VRAM bandwidth, HDR-safe bloom on discrete GPU. */
export const POST_FX_FRAMEBUFFER_TYPE = THREE.HalfFloatType;

/** Half-res buffers for Bloom / DoF — sharp glow with RTX headroom. */
export const POST_FX_HEAVY_PASS_SCALE = 0.5;

export const POST_FX_BLOOM_PASS_SCALE = 0.5;

export const POST_FX_DOF_PASS_SCALE = 0.5;

/** Quarter-res for SSAO / GodRays — cheaper ambient passes. */
export const POST_FX_SSAO_PASS_SCALE = 0.25;

export const POST_FX_GOD_RAYS_SCALE = 0.25;

export const POST_FX_DOF_HEIGHT = 180;

export const MAX_RENDERER_PIXEL_RATIO = 2;

export function resolvePostFxHeavyPassScale(
  _characterQuality: CharacterQuality,
  _viewportFormat: ViewportFormat,
  _emergencyLow = false
): number {
  return POST_FX_HEAVY_PASS_SCALE;
}

/** Free composer ping-pong buffers before allocating new sizes (HD/4K switch). */
export function disposeComposerRenderTargets(composer: EffectComposer): void {
  try {
    composer.inputBuffer?.dispose?.();
  } catch {
    /* already disposed */
  }
  try {
    composer.outputBuffer?.dispose?.();
  } catch {
    /* already disposed */
  }
}

/**
 * Flush renderer caches, dispose old composer RTs, then resize.
 * Required before HD/4K transitions to avoid VRAM accumulation.
 */
export function safeComposerResize(
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer,
  width: number,
  height: number
): void {
  try {
    renderer.renderLists?.dispose?.();
  } catch {
    /* optional on older three builds */
  }

  try {
    const bindingState = (
      renderer as THREE.WebGLRenderer & { bindingState?: { dispose?: () => void } }
    ).bindingState;
    bindingState?.dispose?.();
  } catch {
    /* WebGL2 internal cache — best-effort */
  }

  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  try {
    composer.inputBuffer?.setSize?.(w, h);
    composer.outputBuffer?.setSize?.(w, h);
  } catch {
    /* composer.setSize will rebuild buffers if needed */
  }
  composer.setSize(w, h);
}

export function clampRendererPixelRatio(renderer: THREE.WebGLRenderer): number {
  const capped = Math.min(window.devicePixelRatio || 1, MAX_RENDERER_PIXEL_RATIO);
  renderer.setPixelRatio(capped);
  return capped;
}
