import { useContext, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BloomEffect,
  BlendFunction,
  ChromaticAberrationEffect,
  DepthOfFieldEffect,
  MaskFunction,
  VignetteEffect,
} from 'postprocessing';
import * as THREE from 'three';
import { EffectComposerContext } from '@react-three/postprocessing';
import { postFxLive } from './postFxLiveStore';
import {
  POST_FX_BLOOM_PASS_SCALE,
  POST_FX_DOF_HEIGHT,
  POST_FX_DOF_PASS_SCALE,
} from '../postfx/mmdPostProcessing';

/** Tone mapping exposure — uniform-style update, no material recompile. */
export function StableToneExposure({
  cinematicMul = 1,
}: {
  cinematicMul?: number;
}) {
  const { gl } = useThree();
  useFrame(() => {
    gl.toneMappingExposure = postFxLive.toneExposure * cinematicMul;
  });
  return null;
}

export function StableBloomEffect({
  intensityMul = 1,
  rtxBloom = false,
}: {
  intensityMul?: number;
  rtxBloom?: boolean;
}) {
  const effect = useMemo(
    () =>
      new BloomEffect({
        blendFunction: BlendFunction.ADD,
        intensity: 0.28,
        luminanceThreshold: 0.78,
        luminanceSmoothing: 0.92,
        mipmapBlur: true,
        levels: 4,
        radius: 0.35,
        resolutionScale: POST_FX_BLOOM_PASS_SCALE,
      }),
    []
  );

  useFrame(() => {
    effect.intensity = postFxLive.bloomIntensity * intensityMul;
    effect.luminanceMaterial.threshold = postFxLive.bloomThreshold;
    effect.radius = postFxLive.bloomRadius;
    effect.enabled = rtxBloom || postFxLive.bloomEnabled;
  });

  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive object={effect} dispose={null} />;
}

export function StableDepthOfFieldEffect({
  target,
}: {
  target: THREE.Vector3;
}) {
  const { camera } = useContext(EffectComposerContext);
  const targetRef = useRef(target);

  const effect = useMemo(() => {
    const dof = new DepthOfFieldEffect(camera, {
      focusDistance: 0.03,
      focalLength: 0.008,
      bokehScale: 1.1,
      resolutionScale: POST_FX_DOF_PASS_SCALE,
      height: POST_FX_DOF_HEIGHT,
    });
    dof.target = new THREE.Vector3();
    const maskPass = (dof as unknown as { maskPass?: { maskFunction: number } }).maskPass;
    if (maskPass) maskPass.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA;
    return dof;
  }, [camera]);

  useFrame(() => {
    targetRef.current = target;
    effect.cocMaterial.uniforms.focusDistance.value = postFxLive.dofFocusDistance;
    effect.cocMaterial.uniforms.focalLength.value = postFxLive.dofFocalLength;
    effect.bokehScale = postFxLive.dofBokehScale;
    effect.target.copy(target);
    effect.enabled = postFxLive.dofEnabled;
  });

  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive object={effect} dispose={null} />;
}

export function StableVignetteEffect() {
  const effect = useMemo(
    () =>
      new VignetteEffect({
        blendFunction: BlendFunction.NORMAL,
        eskil: false,
        offset: 0.2,
        darkness: 0.34,
      }),
    []
  );

  useFrame(() => {
    const opacity = postFxLive.vignetteEnabled
      ? postFxLive.vignetteIntensity * 0.85
      : 0;
    effect.darkness = opacity;
    effect.enabled = postFxLive.vignetteEnabled && opacity > 0.01;
  });

  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive object={effect} dispose={null} />;
}

export function StableChromaticAberrationEffect() {
  const offset = useMemo(() => new THREE.Vector2(0.001, 0.001), []);
  const effect = useMemo(
    () =>
      new ChromaticAberrationEffect({
        blendFunction: BlendFunction.NORMAL,
        offset,
        radialModulation: true,
        modulationOffset: 0.4,
      }),
    [offset]
  );

  useFrame(() => {
    const v = postFxLive.chromaticAberration;
    offset.set(v, v);
    effect.offset = offset;
    effect.enabled = v > 0.0001;
  });

  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive object={effect} dispose={null} />;
}
