import { useMemo, useRef } from 'react';
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  GodRays,
  N8AO,
  SMAA,
  SSAO,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import type { ViewportFormat, VisualFxSettings } from '../types';
import type { RtxSettings } from '../utils/rtxSettings';
import { getLitePostFxTuning, resolveBloomParams } from '../postfx/litePostFxConfig';
import ModelDofFocus from './ModelDofFocus';
interface ScenePostProcessingProps {
  visualFx: VisualFxSettings;
  modelOffset?: { x: number; y: number; z: number };
  viewportFormat?: ViewportFormat;
  rtxModeEnabled?: boolean;
  rtxSettings?: RtxSettings;
  pauseRtx?: boolean;
  godRaySunRef?: React.RefObject<THREE.Mesh | null>;
}

export default function ScenePostProcessing({
  visualFx,
  modelOffset = { x: 0, y: 0, z: 0 },
  viewportFormat = '16:9',
  rtxModeEnabled = false,
  rtxSettings,
  pauseRtx = false,
  godRaySunRef,
}: ScenePostProcessingProps) {
  const focusTarget = useRef(new THREE.Vector3(0, 11, 0));
  const internalSunRef = useRef<THREE.Mesh>(null);
  const sunRef = godRaySunRef ?? internalSunRef;

  const tuning = useMemo(
    () => getLitePostFxTuning(visualFx, viewportFormat, rtxModeEnabled, pauseRtx),
    [visualFx, viewportFormat, rtxModeEnabled, pauseRtx]
  );

  const rtxLive = rtxModeEnabled && !pauseRtx;
  const bloomParams = useMemo(
    () => resolveBloomParams(visualFx, tuning, rtxSettings, rtxLive),
    [visualFx, tuning, rtxSettings, rtxLive]
  );

  const handleFocusPoint = useMemo(
    () => (point: THREE.Vector3) => {
      focusTarget.current.copy(point);
    },
    []
  );

  if (!tuning.enableComposer) return null;

  const showBloom = tuning.bloom && (visualFx.bloomEnabled || rtxLive);
  const vignetteOpacity = visualFx.vignetteEnabled
    ? (visualFx.vignetteIntensity ?? 0.4) * 0.85
    : 0;

  return (
    <>
      {tuning.dof && (
        <ModelDofFocus
          enabled
          modelOffset={modelOffset}
          onFocusPoint={handleFocusPoint}
        />
      )}
      <EffectComposer multisampling={tuning.multisampling} enableNormalPass>
        {rtxLive && rtxSettings ? (
          <N8AO
            aoRadius={rtxSettings.aoRadius}
            distanceFalloff={0.85}
            intensity={rtxSettings.aoIntensity}
            quality={rtxSettings.aoQuality}
            halfRes={rtxSettings.halfResAo}
          />
        ) : (
          tuning.ssao && (
            <SSAO
              blendFunction={BlendFunction.MULTIPLY}
              samples={viewportFormat === '9:16' ? 9 : 14}
              rings={3}
              radius={tuning.ssaoRadius}
              intensity={tuning.ssaoIntensity}
              bias={0.025}
              luminanceInfluence={0.4}
              resolutionScale={tuning.ssaoResolutionScale}
            />
          )
        )}

        {tuning.godRays && sunRef.current && (
          <GodRays
            sun={sunRef}
            blendFunction={BlendFunction.ADD}
            samples={tuning.godRaysSamples}
            density={tuning.godRaysDensity}
            decay={tuning.godRaysDecay}
            weight={0.35}
            exposure={0.42}
            clampMax={1}
            resolutionScale={0.35}
            blur
          />
        )}

        {tuning.dof && (
          <DepthOfField
            target={focusTarget.current}
            focusDistance={visualFx.dofFocusDistance ?? 0.03}
            focalLength={visualFx.dofFocalLength ?? 0.008}
            bokehScale={visualFx.dofBokehScale ?? 1.1}
            height={480}
          />
        )}

        {showBloom && (
          <Bloom
            intensity={bloomParams.intensity}
            luminanceThreshold={bloomParams.threshold}
            luminanceSmoothing={0.92}
            mipmapBlur={false}
            radius={bloomParams.radius}
          />
        )}

        {tuning.chromatic && (
          <ChromaticAberration
            offset={
              new THREE.Vector2(
                visualFx.chromaticAberration ?? 0.001,
                visualFx.chromaticAberration ?? 0.001
              )
            }
            radialModulation
            modulationOffset={0.4}
          />
        )}

        {tuning.vignette && vignetteOpacity > 0.01 && (
          <Vignette eskil={false} offset={0.2} darkness={vignetteOpacity} />
        )}

        {tuning.smaa && <SMAA />}
      </EffectComposer>
    </>
  );
}
