import { ContactShadows, Environment, MeshReflectorMaterial } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { VisualFxSettings } from '../types';
import {
  getLightPreset,
  getScenePreset,
  isCinematicVisualsActive,
} from '../visualFx/visualFxPresets';
import { getRenderTierConfig } from '../render/renderTierConfig';
import type { RenderTier } from '../types';
import { isWebGpuRenderer } from '../utils/webgpuSupport';

interface SceneEnvironmentProps {
  visualFx: VisualFxSettings;
  ultraPhoto: boolean;
  rtxActive: boolean;
  shadowMapSize: number;
  renderTier?: import('../types').RenderTier;
}

function SceneFog({ visualFx }: { visualFx: VisualFxSettings }) {
  const scene = getScenePreset(visualFx.scenePreset);
  const { scene: threeScene } = useThree();

  useEffect(() => {
    if (!scene.fog) {
      threeScene.fog = null;
      return;
    }
    threeScene.fog = new THREE.Fog(
      scene.fog.color,
      scene.fog.near,
      scene.fog.far
    );
    return () => {
      threeScene.fog = null;
    };
  }, [scene, threeScene]);

  return null;
}

function SceneLighting({
  visualFx,
  ultraPhoto,
  shadowMapSize,
}: {
  visualFx: VisualFxSettings;
  ultraPhoto: boolean;
  shadowMapSize: number;
}) {
  const light = getLightPreset(visualFx.lightPreset);
  const boost = ultraPhoto ? 1.12 : 1;

  return (
    <>
      <ambientLight
        intensity={light.ambient.intensity * boost}
        color={light.ambient.color}
      />

      <directionalLight
        castShadow={light.key.castShadow}
        position={light.key.position}
        intensity={light.key.intensity * boost}
        color={light.key.color}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-near={0.5}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      <directionalLight
        position={light.fill.position}
        intensity={light.fill.intensity * boost}
        color={light.fill.color}
      />

      {light.rim && (
        <directionalLight
          position={light.rim.position}
          intensity={light.rim.intensity * boost}
          color={light.rim.color}
        />
      )}

      {light.spot && (
        <spotLight
          castShadow={ultraPhoto}
          position={light.spot.position}
          intensity={light.spot.intensity * boost}
          angle={light.spot.angle}
          penumbra={light.spot.penumbra}
          color={light.spot.color}
          distance={80}
          shadow-mapSize={[2048, 2048]}
        />
      )}

      <hemisphereLight
        intensity={light.hemisphere.intensity * boost}
        color={light.hemisphere.sky}
        groundColor={light.hemisphere.ground}
      />
    </>
  );
}

function SimpleFloor({ webgpu = false }: { webgpu?: boolean }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      userData={{ pathTracerSkip: true }}
    >
      <planeGeometry args={[60, 60]} />
      {webgpu ? (
        <meshStandardMaterial color="#c8ccd8" roughness={0.92} metalness={0.05} />
      ) : (
        <shadowMaterial opacity={0.35} color="#000000" />
      )}
    </mesh>
  );
}

/** WebGPU-safe floor — ContactShadows / MeshReflectorMaterial use legacy depth & shader passes. */
function WebGpuFloor({
  visualFx,
  mirror,
}: {
  visualFx: VisualFxSettings;
  mirror: boolean;
}) {
  const scene = getScenePreset(visualFx.scenePreset);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
      userData={{ pathTracerSkip: true }}
    >
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial
        color={scene.floorColor}
        metalness={mirror ? scene.floorMetalness : scene.floorMetalness * 0.5}
        roughness={scene.floorRoughness}
      />
    </mesh>
  );
}

function CinematicFloor({
  visualFx,
  mirror,
  renderTier = 'lite',
  webgpu = false,
}: {
  visualFx: VisualFxSettings;
  mirror: boolean;
  renderTier?: RenderTier;
  webgpu?: boolean;
}) {
  if (webgpu) {
    return <WebGpuFloor visualFx={visualFx} mirror={mirror} />;
  }

  const scene = getScenePreset(visualFx.scenePreset);
  const tierGpu = getRenderTierConfig(renderTier).gpu;

  if (mirror) {
    return (
      <>
        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={0.55}
          scale={28}
          blur={2.4}
          far={14}
          resolution={tierGpu.contactShadowResolution}
          frames={1}
          color="#050508"
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <planeGeometry args={[60, 60]} />
          <MeshReflectorMaterial
            blur={[256, 64]}
            resolution={tierGpu.mirrorFloorResolution}
            mixBlur={1}
            mixStrength={visualFx.floorReflection}
            roughness={scene.floorRoughness}
            depthScale={1.1}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.6}
            color={scene.floorColor}
            metalness={scene.floorMetalness}
            mirror={0.75 + visualFx.floorReflection * 0.12}
            reflectorOffset={0.02}
          />
        </mesh>
      </>
    );
  }

  return (
    <>
      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.55}
        scale={24}
        blur={2.4}
        far={14}
        resolution={tierGpu.contactShadowResolution}
        frames={1}
        color="#080810"
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color={scene.floorColor}
          metalness={scene.floorMetalness * 0.5}
          roughness={scene.floorRoughness}
        />
      </mesh>
    </>
  );
}

/**
 * Scene IBL, lighting rig, floor and fog driven by Visual FX presets.
 */
export default function SceneEnvironment({
  visualFx,
  ultraPhoto,
  rtxActive,
  shadowMapSize,
  renderTier = 'lite',
}: SceneEnvironmentProps) {
  const { gl } = useThree();
  const webgpu = isWebGpuRenderer(gl);
  const cinematic = isCinematicVisualsActive(visualFx, rtxActive);
  const scene = getScenePreset(visualFx.scenePreset);
  const tierGpu = getRenderTierConfig(renderTier).gpu;

  if (!cinematic) {
    return (
      <>
        <color attach="background" args={['#e8ecf4']} />
        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={2.5}
          color="#fff8f0"
          shadow-mapSize={[shadowMapSize, shadowMapSize]}
          shadow-camera-near={0.5}
          shadow-camera-far={120}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-8, 12, -6]} intensity={1.2} color="#c8d8ff" />
        <hemisphereLight intensity={0.6} color="#e8f0ff" groundColor="#404050" />
        <SimpleFloor webgpu={webgpu} />
      </>
    );
  }

  return (
    <>
      <color attach="background" args={[scene.background]} />
      <SceneFog visualFx={visualFx} />

      {!webgpu && (
        <Environment
          preset={scene.environment}
          environmentIntensity={visualFx.environmentIntensity}
          background={ultraPhoto && scene.showEnvironmentBackground}
          resolution={ultraPhoto ? tierGpu.environmentResolution : Math.min(tierGpu.environmentResolution, 128)}
        />
      )}

      <SceneLighting
        visualFx={visualFx}
        ultraPhoto={ultraPhoto}
        shadowMapSize={shadowMapSize}
      />

      <CinematicFloor
        visualFx={visualFx}
        mirror={ultraPhoto}
        renderTier={renderTier}
        webgpu={webgpu}
      />
    </>
  );
}
