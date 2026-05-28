import React, { useRef } from 'react';
import { Camera, ImagePlus, Sparkles, RotateCw, Shield } from 'lucide-react';
import type { AppState, CameraOrbitPresetId, CameraStudioSettings, VisualFxSettings } from '../types';
import { CAMERA_STUDIO_PRESETS, getCameraStudioPreset } from '../camera/cameraStudioPresets';
import { isNativeApp } from '../utils/platform';

interface CameraStudioPanelProps {
  appState: AppState;
  onPatchCameraStudio: (patch: Partial<CameraStudioSettings>) => void;
  onApplyCameraPreset: (presetId: CameraOrbitPresetId) => void;
  onSetVisualFx: (patch: Partial<VisualFxSettings>) => void;
}

export default function CameraStudioPanel({
  appState,
  onPatchCameraStudio,
  onApplyCameraPreset,
  onSetVisualFx,
}: CameraStudioPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const studio = appState.cameraStudio;
  const selectedPreset = getCameraStudioPreset(studio.orbitPreset);

  const handleBackgroundFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    onPatchCameraStudio({ backgroundImageUrl: url });
  };

  if (isNativeApp()) {
    return (
      <p className="text-[11px] text-zinc-500 px-1">
        Camera Studio presets are optimized for the web desktop viewer. Use Free camera + timeline templates on mobile.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#22252c] bg-[#121418] p-3 space-y-3">
        <div className="flex items-center gap-2 text-[#39c5bb] text-xs font-bold uppercase">
          <Camera className="w-3.5 h-3.5" />
          Auto focus
        </div>

        <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
          <span>Track model while orbiting</span>
          <input
            type="checkbox"
            checked={studio.autoFocus}
            onChange={(e) => onPatchCameraStudio({ autoFocus: e.target.checked })}
            className="accent-[#39c5bb]"
          />
        </label>

        <div className="grid grid-cols-3 gap-1">
          {(['face', 'body', 'full'] as const).map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => onPatchCameraStudio({ focusTarget: target })}
              className={`py-1.5 text-[10px] font-bold rounded border cursor-pointer ${
                studio.focusTarget === target
                  ? 'border-[#39c5bb]/50 bg-teal-950/40 text-[#39c5bb]'
                  : 'border-[#2c3240] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {target === 'face' ? 'Face' : target === 'body' ? 'Body' : 'Full'}
            </button>
          ))}
        </div>

        <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Modest angle (no low view)
          </span>
          <input
            type="checkbox"
            checked={studio.modestAngle}
            onChange={(e) => onPatchCameraStudio({ modestAngle: e.target.checked })}
            className="accent-amber-400"
          />
        </label>
      </div>

      <div className="rounded-lg border border-[#22252c] bg-[#121418] p-3 space-y-3">
        <div className="flex items-center gap-2 text-[#e879ff] text-xs font-bold uppercase">
          <RotateCw className="w-3.5 h-3.5" />
          Orbit presets
        </div>

        <select
          value={studio.orbitPreset}
          onChange={(e) => onPatchCameraStudio({ orbitPreset: e.target.value as CameraOrbitPresetId })}
          className="w-full bg-[#1e212a] border border-[#2c3240] rounded text-xs p-2 text-zinc-200 outline-none focus:border-[#e879ff]/40"
        >
          {CAMERA_STUDIO_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        {selectedPreset && (
          <p className="text-[10px] text-zinc-500 leading-snug">{selectedPreset.description}</p>
        )}

        <label className="block text-[10px] text-zinc-500">
          Orbit speed
          <input
            type="range"
            min={0.25}
            max={2}
            step={0.05}
            value={studio.orbitSpeed}
            onChange={(e) => onPatchCameraStudio({ orbitSpeed: Number(e.target.value) })}
            className="w-full mt-1 accent-[#e879ff]"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
          <span>Live orbit while playing</span>
          <input
            type="checkbox"
            checked={studio.liveOrbit}
            onChange={(e) => onPatchCameraStudio({ liveOrbit: e.target.checked })}
            className="accent-[#e879ff]"
          />
        </label>

        <button
          type="button"
          onClick={() => onApplyCameraPreset(studio.orbitPreset)}
          disabled={studio.orbitPreset === 'manual'}
          className="w-full py-2 rounded text-xs font-bold bg-[#9d27ff]/20 border border-[#9d27ff]/40 text-[#e879ff] hover:bg-[#9d27ff]/30 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          Apply preset to timeline + bloom
        </button>
      </div>

      <div className="rounded-lg border border-[#22252c] bg-[#121418] p-3 space-y-3">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase">
          <ImagePlus className="w-3.5 h-3.5" />
          Camera background
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleBackgroundFile(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full py-2 rounded text-xs font-bold border border-sky-500/30 text-sky-300 hover:bg-sky-950/30 cursor-pointer"
        >
          Upload background image
        </button>

        {studio.backgroundImageUrl && (
          <>
            <div
              className="h-20 rounded border border-[#2c3240] bg-cover bg-center"
              style={{
                backgroundImage: `url(${studio.backgroundImageUrl})`,
                opacity: studio.backgroundOpacity,
                filter: studio.backgroundBlur > 0 ? `blur(${studio.backgroundBlur}px)` : undefined,
              }}
            />
            <label className="block text-[10px] text-zinc-500">
              Opacity
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={studio.backgroundOpacity}
                onChange={(e) => onPatchCameraStudio({ backgroundOpacity: Number(e.target.value) })}
                className="w-full mt-1 accent-sky-400"
              />
            </label>
            <button
              type="button"
              onClick={() => onPatchCameraStudio({ backgroundImageUrl: null })}
              className="text-[10px] text-zinc-500 hover:text-red-400 cursor-pointer"
            >
              Remove background
            </button>
          </>
        )}
      </div>

      <div className="rounded-lg border border-[#22252c] bg-[#121418] p-3">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Quick bloom
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetVisualFx({ bloomEnabled: true, bloomIntensity: 0.45, bloomThreshold: 0.78 })}
            className="flex-1 py-1.5 text-[10px] font-bold rounded border border-amber-500/30 text-amber-200 cursor-pointer hover:bg-amber-950/20"
          >
            Soft
          </button>
          <button
            type="button"
            onClick={() => onSetVisualFx({ bloomEnabled: true, bloomIntensity: 0.75, bloomThreshold: 0.62 })}
            className="flex-1 py-1.5 text-[10px] font-bold rounded border border-amber-500/30 text-amber-200 cursor-pointer hover:bg-amber-950/20"
          >
            Strong
          </button>
          <button
            type="button"
            onClick={() => onSetVisualFx({ bloomEnabled: false })}
            className="flex-1 py-1.5 text-[10px] font-bold rounded border border-zinc-600 text-zinc-400 cursor-pointer hover:bg-zinc-900"
          >
            Off
          </button>
        </div>
      </div>
    </div>
  );
}
