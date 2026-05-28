import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { VisualFxSettings } from '../types';
import { getWeatherPrecipType } from '../visualFx/mmdWeatherPresets';

interface MmdWeatherPrecipProps {
  visualFx: VisualFxSettings;
}

const MAX_PARTICLES = 4000;

/**
 * Rain / snow from mmd_rtx precip system (lite Points, no 6000-particle storm by default).
 */
export default function MmdWeatherPrecip({ visualFx }: MmdWeatherPrecipProps) {
  const precipType = getWeatherPrecipType(visualFx);
  const intensity = visualFx.precipIntensity ?? 0;
  const ref = useRef<THREE.Points>(null);

  const { positions, velocities, count } = useMemo(() => {
    if (precipType === 0 || intensity <= 0.01) {
      return { positions: new Float32Array(0), velocities: new Float32Array(0), count: 0 };
    }
    const n = Math.min(
      MAX_PARTICLES,
      Math.floor(800 + intensity * (precipType === 1 ? 2200 : 1800))
    );
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 28 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      vel[i] = 8 + Math.random() * 10;
    }
    return { positions: pos, velocities: vel, count: n };
  }, [precipType, intensity]);

  useFrame((_, delta) => {
    if (!ref.current || count === 0) return;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const isSnow = precipType === 2;
    const fallMul = (isSnow ? 4 : 14) * intensity;
    const drift = isSnow ? 0.4 : 0.15;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= velocities[i] * fallMul * delta;
      arr[i * 3] += Math.sin(performance.now() * 0.001 + i) * drift * delta;
      arr[i * 3 + 2] += Math.cos(performance.now() * 0.0008 + i) * drift * delta;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 22 + Math.random() * 8;
        arr[i * 3] = (Math.random() - 0.5) * 40;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
    }
    attr.needsUpdate = true;
  });

  if (count === 0) return null;

  const isSnow = precipType === 2;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={isSnow ? 0.12 : 0.06}
        color={isSnow ? '#e8f0ff' : '#a8b8d0'}
        transparent
        opacity={0.35 + intensity * 0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
