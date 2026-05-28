import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Stars } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ParticlePresetId, VisualFxSettings } from '../types';
import { isWebGpuRenderer } from '../utils/webgpuSupport';

interface SceneParticlesProps {
  visualFx: VisualFxSettings;
  active: boolean;
}

function WebGpuSparkles({
  count,
  color,
  scale,
  position,
  intensity,
}: {
  count: number;
  color: string;
  scale: [number, number, number];
  position: [number, number, number];
  intensity: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * scale[0];
      arr[i * 3 + 1] = Math.random() * scale[1];
      arr[i * 3 + 2] = (Math.random() - 0.5) * scale[2];
    }
    return arr;
  }, [count, scale]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.08 * intensity;
  });

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        color={color}
        transparent
        opacity={0.55 + intensity * 0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function WebGpuStarfield({ count, intensity }: { count: number; intensity: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 25 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 2;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.04 * intensity;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ffffff"
        transparent
        opacity={0.65 * intensity}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingDust({ count, intensity }: { count: number; intensity: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 28;
      arr[i * 3 + 1] = Math.random() * 18 + 1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.04 * intensity;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffe8c8"
        transparent
        opacity={0.35 * intensity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FallingParticles({
  count,
  color,
  spread,
  speed,
  intensity,
}: {
  count: number;
  color: string;
  spread: [number, number, number];
  speed: number;
  intensity: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread[0];
      positions[i * 3 + 1] = Math.random() * spread[1] + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
      velocities[i] = 0.4 + Math.random() * 1.2;
    }
    return { positions, velocities };
  }, [count, spread]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - delta * data.velocities[i]! * speed * intensity;
      if (y < 0) y = spread[1] + Math.random() * 4;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color={color}
        transparent
        opacity={0.7 * intensity}
        depthWrite={false}
      />
    </points>
  );
}

function presetConfig(preset: ParticlePresetId) {
  switch (preset) {
    case 'snow':
      return { color: '#e8f4ff', count: 400, spread: [24, 22, 24] as [number, number, number], speed: 0.8 };
    case 'petals':
      return { color: '#ffb8d8', count: 180, spread: [20, 16, 20] as [number, number, number], speed: 0.55 };
    case 'confetti':
      return { color: '#ffd040', count: 220, spread: [18, 20, 18] as [number, number, number], speed: 1.1 };
    default:
      return null;
  }
}

export default function SceneParticles({ visualFx, active }: SceneParticlesProps) {
  const { gl } = useThree();
  const webgpu = isWebGpuRenderer(gl);

  if (!active || !visualFx.particlesEnabled || visualFx.particlePreset === 'none') {
    return null;
  }

  const intensity = visualFx.particleIntensity;
  const preset = visualFx.particlePreset;

  if (preset === 'sparkles') {
    const count = Math.floor(80 + intensity * 120);
    if (webgpu) {
      return (
        <WebGpuSparkles
          count={count}
          scale={[14, 16, 14]}
          position={[0, 9, 0]}
          intensity={intensity}
          color="#ffe8ff"
        />
      );
    }
    return (
      <Sparkles
        count={count}
        scale={[14, 16, 14]}
        position={[0, 9, 0]}
        size={2.5}
        speed={0.35 * intensity}
        opacity={0.55 + intensity * 0.35}
        color="#ffe8ff"
      />
    );
  }

  if (preset === 'fireflies') {
    const count = Math.floor(40 + intensity * 80);
    if (webgpu) {
      return (
        <WebGpuSparkles
          count={count}
          scale={[20, 12, 20]}
          position={[0, 6, 0]}
          intensity={intensity}
          color="#a0ff80"
        />
      );
    }
    return (
      <Sparkles
        count={count}
        scale={[20, 12, 20]}
        position={[0, 6, 0]}
        size={3}
        speed={0.15 * intensity}
        opacity={0.65 + intensity * 0.3}
        color="#a0ff80"
      />
    );
  }

  if (preset === 'dust') {
    return <FloatingDust count={Math.floor(120 + intensity * 180)} intensity={intensity} />;
  }

  if (preset === 'snow' || preset === 'petals' || preset === 'confetti') {
    const cfg = presetConfig(preset)!;
    return (
      <FallingParticles
        count={Math.floor(cfg.count * (0.5 + intensity * 0.8))}
        color={cfg.color}
        spread={cfg.spread}
        speed={cfg.speed}
        intensity={intensity}
      />
    );
  }

  if (webgpu) {
    return (
      <WebGpuStarfield
        count={Math.floor(800 * intensity)}
        intensity={intensity}
      />
    );
  }

  return (
    <Stars
      radius={40}
      depth={30}
      count={Math.floor(800 * intensity)}
      factor={2}
      saturation={0.2}
      fade
      speed={0.4}
    />
  );
}
