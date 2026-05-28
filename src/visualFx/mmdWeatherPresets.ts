import type { ParticlePresetId, VisualFxSettings, WeatherPresetId } from '../types';
import { DEFAULT_VISUAL_FX } from './visualFxPresets';

export interface WeatherPresetConfig {
  id: WeatherPresetId;
  label: string;
  precipType: 0 | 1 | 2;
  patch: Partial<VisualFxSettings>;
}

/** Port of mmd_rtx.html WEATHER → VisualFxSettings (lite, no volumetric pass). */
export const MMD_WEATHER_PRESETS: WeatherPresetConfig[] = [
  {
    id: 'clear',
    label: 'Clear',
    precipType: 0,
    patch: {
      weatherPreset: 'clear',
      precipIntensity: 0,
      wetness: 0,
      snowGround: 0,
      particlesEnabled: false,
      scenePreset: 'outdoor',
      lightPreset: 'natural',
      environmentIntensity: 1.0,
      floorReflection: 0.78,
    },
  },
  {
    id: 'rain',
    label: 'Rain',
    precipType: 1,
    patch: {
      weatherPreset: 'rain',
      precipIntensity: 0.8,
      wetness: 0.6,
      snowGround: 0,
      particlesEnabled: true,
      particlePreset: 'snow',
      particleIntensity: 0.35,
      scenePreset: 'cyber',
      lightPreset: 'natural',
      environmentIntensity: 0.7,
      floorReflection: 0.92,
      vignetteEnabled: true,
      vignetteIntensity: 0.35,
    },
  },
  {
    id: 'storm',
    label: 'Storm',
    precipType: 1,
    patch: {
      weatherPreset: 'storm',
      precipIntensity: 1.4,
      wetness: 0.95,
      snowGround: 0,
      particlesEnabled: true,
      particlePreset: 'dust',
      particleIntensity: 0.5,
      scenePreset: 'cyber',
      lightPreset: 'concert',
      environmentIntensity: 0.45,
      floorReflection: 0.95,
      bloomEnabled: true,
      bloomIntensity: 0.32,
      vignetteEnabled: true,
      vignetteIntensity: 0.55,
      colorGrade: 'noir',
    },
  },
  {
    id: 'fog',
    label: 'Fog',
    precipType: 0,
    patch: {
      weatherPreset: 'fog',
      precipIntensity: 0,
      wetness: 0.25,
      snowGround: 0,
      particlesEnabled: false,
      scenePreset: 'warehouse',
      lightPreset: 'natural',
      environmentIntensity: 0.9,
      floorReflection: 0.65,
      vignetteEnabled: true,
      vignetteIntensity: 0.4,
      colorGrade: 'cold',
    },
  },
  {
    id: 'snow',
    label: 'Snow',
    precipType: 2,
    patch: {
      weatherPreset: 'snow',
      precipIntensity: 1.0,
      wetness: 0,
      snowGround: 0.7,
      particlesEnabled: true,
      particlePreset: 'snow',
      particleIntensity: 0.85,
      scenePreset: 'outdoor',
      lightPreset: 'natural',
      environmentIntensity: 1.0,
      floorReflection: 0.7,
      colorGrade: 'cold',
    },
  },
];

export function applyMmdWeatherPreset(id: WeatherPresetId): VisualFxSettings {
  const preset = MMD_WEATHER_PRESETS.find((p) => p.id === id);
  if (!preset) return { ...DEFAULT_VISUAL_FX };
  return { ...DEFAULT_VISUAL_FX, ...preset.patch };
}

export function getWeatherPrecipType(
  visualFx: VisualFxSettings
): 0 | 1 | 2 {
  const preset = MMD_WEATHER_PRESETS.find((p) => p.id === visualFx.weatherPreset);
  return preset?.precipType ?? 0;
}

export function weatherParticlePreset(visualFx: VisualFxSettings): ParticlePresetId {
  const t = getWeatherPrecipType(visualFx);
  if (t === 2) return 'snow';
  if (t === 1) return 'dust';
  return visualFx.particlePreset;
}
