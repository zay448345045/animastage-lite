import { useMemo } from 'react';
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
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
import { usePostFxGlReady } from '../postfx/usePostFxGlReady';
import PostFxDeferredComposer from '../postfx/PostFxDeferredComposer';
import ModelDofFocus from './ModelDofFocus';
import PostFxDirectRenderSync from './PostFxDirectRenderSync';

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
}: ScenePostProcessingProps) {
  const glReady = usePostFxGlReady();
  const focusTarget = useMemo(() => new THREE.Vector3(0, 11, 0), []);

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
      focusTarget.copy(point);
    },
    [focusTarget]
  );

  const showBloom = tuning.bloom && (visualFx.bloomEnabled || rtxLive);
  const vignetteOpacity = visualFx.vignetteEnabled
    ? (visualFx.vignetteIntensity ?? 0.4) * 0.85
    : 0;

  const needsNormalPass =
    (tuning.ssao || rtxLive) && (visualFx.ssaoEnabled === true || rtxLive);

  const hasPasses =
    rtxLive ||
    tuning.ssao ||
    tuning.dof ||
    showBloom ||
    tuning.chromatic ||
    (tuning.vignette && vignetteOpacity > 0.01) ||
    tuning.smaa;

  const composerActive = tuning.enableComposer && glReady && hasPasses;

  const chromaticOffset = useMemo(
    () =>
      new THREE.Vector2(
        visualFx.chromaticAberration ?? 0.001,
        visualFx.chromaticAberration ?? 0.001
      ),
    [visualFx.chromaticAberration]
  );

  const composerKey = useMemo(
    () =>
      [
        viewportFormat,
        rtxLive ? 'rtx' : 'lite',
        tuning.ssao ? 'ssao' : '',
        tuning.dof ? 'dof' : '',
        showBloom ? 'bloom' : '',
        tuning.smaa ? 'smaa' : '',
        tuning.vignette && vignetteOpacity > 0.01 ? 'vig' : '',
      ].join('-'),
    [
      viewportFormat,
      rtxLive,
      tuning.ssao,
      tuning.dof,
      showBloom,
      tuning.smaa,
      tuning.vignette,
      vignetteOpacity,
    ]
  );

  return (
    <>
      <PostFxDirectRenderSync composerEnabled={composerActive} />
      {tuning.dof && composerActive && (
        <ModelDofFocus enabled modelOffset={modelOffset} onFocusPoint={handleFocusPoint} />
      )}
      <PostFxDeferredComposer
        enabled={composerActive}
        composerKey={composerKey}
        multisampling={tuning.multisampling}
        enableNormalPass={needsNormalPass}
      >
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

        {tuning.dof && (
          <DepthOfField
            target={focusTarget}
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
            offset={chromaticOffset}
            radialModulation
            modulationOffset={0.4}
          />
        )}

        {tuning.vignette && vignetteOpacity > 0.01 && (
          <Vignette eskil={false} offset={0.2} darkness={vignetteOpacity} />
        )}

        {tuning.smaa && <SMAA />}
      </PostFxDeferredComposer>
    </>
  );
}
