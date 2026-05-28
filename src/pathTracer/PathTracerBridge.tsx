import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { AppState } from '../types';
import { bakeSceneForPathTracer, cameraFromThree, focusDistFromBaked } from './meshBake';
import { PathTracerEngine } from './PathTracerEngine';
import { getPathTracerTierConfig } from './pathTracerTierConfig';
import type { PathTracerRenderSettings, PathTracerSceneData } from './types';
import { isWebGpuRenderer } from '../utils/webgpuSupport';

interface PathTracerBridgeProps {
  appState: AppState;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pathTracerCanvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
}

function buildRenderSettings(appState: AppState): PathTracerRenderSettings {
  const tier = getPathTracerTierConfig(appState.renderTier);
  return {
    visualFx: appState.visualFx,
    bounces: tier.maxBounces,
    samplesPerFrame: 1,
    denoise: tier.enableDenoise,
    denoiseMaxRadius: tier.denoiseMaxRadius,
    bloom: tier.enableBloom,
    bloomThreshold: appState.visualFx.bloomThreshold ?? 0.85,
    bloomStrength: tier.enableBloom
      ? (appState.visualFx.bloomIntensity ?? 0.45) * 0.2
      : 0,
    exposure: tier.exposure,
    vignetteStrength: appState.visualFx.vignetteEnabled
      ? appState.visualFx.vignetteIntensity * 0.25
      : 0.08,
    floorY: 0,
    resolutionScale: tier.resolutionScale,
    textureSize: tier.textureSize,
    maxTextures: tier.maxTextures,
    maxInternalWidth: tier.maxInternalWidth,
    maxInternalHeight: tier.maxInternalHeight,
    sunIntensityScale: tier.sunIntensityScale,
    enableNEE: tier.enableNEE,
  };
}

function bakeOptions(appState: AppState) {
  const tier = getPathTracerTierConfig(appState.renderTier);
  return {
    maxTriangles: tier.maxTriangles,
    maxTextures: tier.maxTextures,
    skipAlphaMaterials: tier.skipAlphaMaterials,
  };
}

function setOverlayVisible(
  canvas: HTMLCanvasElement | null | undefined,
  visible: boolean,
  sampleCount = 0,
  maxSamples = 10
): void {
  if (!canvas) return;
  if (!visible || sampleCount <= 0) {
    canvas.style.opacity = '0';
    canvas.style.zIndex = '-1';
    return;
  }
  const fade = Math.min(1, sampleCount / Math.min(8, maxSamples));
  canvas.style.opacity = String(fade);
  canvas.style.zIndex = '5';
  canvas.style.pointerEvents = 'none';
}

export default function PathTracerBridge({
  appState,
  containerRef,
  pathTracerCanvasRef,
}: PathTracerBridgeProps) {
  const { scene, camera, size, gl } = useThree();
  const engineRef = useRef<PathTracerEngine | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const uploadTickRef = useRef(0);
  const cachedSceneRef = useRef<PathTracerSceneData | null>(null);
  const lastCameraKeyRef = useRef('');
  const lastPreviewMsRef = useRef(0);
  const previewBusyRef = useRef(false);

  const tierCfg = getPathTracerTierConfig(appState.renderTier);

  const pathTracePreview =
    tierCfg.previewEnabled &&
    appState.rtxModeEnabled &&
    !appState.isPlaying;
  const pathTraceActive = pathTracePreview;

  useEffect(() => {
    if (!isWebGpuRenderer(gl)) return;
    let cancelled = false;

    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 w-full h-full pointer-events-none';
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 0.2s';
    canvas.style.imageRendering = 'auto';
    containerRef.current?.appendChild(canvas);
    if (pathTracerCanvasRef) pathTracerCanvasRef.current = canvas;

    const engine = new PathTracerEngine(canvas);
    engineRef.current = engine;
    initPromiseRef.current = PathTracerEngine.isSupported()
      .then(async (ok) => {
        if (!ok || cancelled) return;
        await engine.init();
        engine.setSettings(buildRenderSettings(appState));
        engine.resize(size.width, size.height, tierCfg.resolutionScale);
      })
      .catch((err) => {
        console.warn('[PathTracer] Init failed:', err);
      });

    return () => {
      cancelled = true;
      canvas.remove();
      if (pathTracerCanvasRef) pathTracerCanvasRef.current = null;
      engineRef.current = null;
      cachedSceneRef.current = null;
    };
  }, [gl, containerRef, pathTracerCanvasRef, tierCfg.resolutionScale]);

  useEffect(() => {
    void initPromiseRef.current?.then(() => {
      engineRef.current?.setSettings(buildRenderSettings(appState));
      engineRef.current?.resize(size.width, size.height, tierCfg.resolutionScale);
    });
  }, [size.width, size.height, tierCfg.resolutionScale, appState.renderTier]);

  useEffect(() => {
    if (!pathTraceActive) {
      setOverlayVisible(pathTracerCanvasRef?.current, false);
    }
  }, [pathTraceActive, pathTracerCanvasRef]);

  useEffect(() => {
    cachedSceneRef.current = null;
    uploadTickRef.current = 0;
    lastPreviewMsRef.current = 0;
    setOverlayVisible(pathTracerCanvasRef?.current, false);
  }, [appState.models.length, pathTracerCanvasRef]);

  useFrame(() => {
    if (!pathTraceActive) return;

    if (pathTracePreview) {
      const now = performance.now();
      if (now - lastPreviewMsRef.current < tierCfg.previewIntervalMs) return;
      if (previewBusyRef.current) return;

      const engine = engineRef.current;
      if (engine && engine.getSampleCount() >= tierCfg.previewMaxSamples) {
        setOverlayVisible(
          pathTracerCanvasRef?.current,
          true,
          engine.getSampleCount(),
          tierCfg.previewMaxSamples
        );
        return;
      }
    }

    previewBusyRef.current = true;
    lastPreviewMsRef.current = performance.now();

    void (async () => {
      try {
        await initPromiseRef.current;
        const engine = engineRef.current;
        if (!engine) return;

        const persp = camera as THREE.PerspectiveCamera;
        persp.updateMatrixWorld(true);
        const baked = cachedSceneRef.current;

        engine.setSettings({
          ...buildRenderSettings(appState),
          samplesPerFrame: pathTraceVideo ? tierCfg.videoSamplesPerFrame : 1,
        });
        engine.setCamera(
          cameraFromThree(persp, {
            aperture: appState.visualFx.dofEnabled && !pathTraceVideo ? 0.015 : 0,
            focusDist: baked ? focusDistFromBaked(persp, baked) : 15,
          })
        );

        uploadTickRef.current += 1;
        const forceUpload =
          pathTraceVideo ||
          !cachedSceneRef.current ||
          uploadTickRef.current % tierCfg.sceneUploadIntervalFrames === 0;

        if (forceUpload) {
          scene.updateMatrixWorld(true);
          cachedSceneRef.current = bakeSceneForPathTracer(scene, bakeOptions(appState));
          await engine.uploadScene(cachedSceneRef.current);
        }

        const triCount = cachedSceneRef.current?.triangles.length ?? 0;
        if (triCount === 0) {
          setOverlayVisible(pathTracerCanvasRef?.current, false);
          return;
        }

        const camKey = `${persp.position.x.toFixed(1)}:${persp.position.y.toFixed(1)}:${persp.position.z.toFixed(1)}:${persp.quaternion.y.toFixed(2)}`;
        if (camKey !== lastCameraKeyRef.current) {
          lastCameraKeyRef.current = camKey;
          engine.resetAccumulation();
        }

        if (pathTracePreview) {
          if (engine.getSampleCount() >= tierCfg.previewMaxSamples) {
            return;
          }
          engine.renderFrame();
          setOverlayVisible(
            pathTracerCanvasRef?.current,
            true,
            engine.getSampleCount(),
            tierCfg.previewMaxSamples
          );
        }

        if (pathTraceVideo) {
          engine.renderFrame();
          setOverlayVisible(
            pathTracerCanvasRef?.current,
            true,
            engine.getSampleCount(),
            tierCfg.previewMaxSamples
          );
        }
      } finally {
        previewBusyRef.current = false;
      }
    })();
  });

  return null;
}

export function shouldUsePathTracer(appState: AppState, webgpu: boolean): boolean {
  return webgpu && (appState.rtxModeEnabled || appState.renderTier === 'pro');
}
