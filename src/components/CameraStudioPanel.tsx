import { useRef } from 'react';
import { Camera, ImagePlus, Sparkles, RotateCw, Shield } from 'lucide-react';
import type { CameraOrbitPresetId, CameraStudioSettings, VisualFxSettings } from '../types';
import { CAMERA_STUDIO_PRESETS, getCameraStudioPreset } from '../camera/cameraStudioPresets';
import { Button, Panel, SectionHeader, Select, Slider, Toggle } from './UI';

interface CameraStudioPanelProps {
  appState: { cameraStudio: CameraStudioSettings };
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

  return (
    <div className="ds-stack">
      <Panel>
        <SectionHeader
          title={
            <>
              <Camera className="w-3.5 h-3.5" />
              Auto focus
            </>
          }
        />
        <div className="ds-stack ds-stack--sm">
          <Toggle
            label="Track model while orbiting"
            checked={studio.autoFocus}
            onChange={(e) => onPatchCameraStudio({ autoFocus: e.target.checked })}
          />
          <Toggle
            label="Manual camera (MMD + Free orbit)"
            checked={Boolean(studio.manualCameraLock)}
            onChange={(e) =>
              onPatchCameraStudio({
                manualCameraLock: e.target.checked,
                autoFocus: e.target.checked ? false : true,
              })
            }
          />
          <div className="ds-segmented">
            {(['face', 'body', 'full'] as const).map((target) => (
              <div key={target} className="ds-segmented__item">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  active={studio.focusTarget === target}
                  className="w-full capitalize"
                  onClick={() => onPatchCameraStudio({ focusTarget: target })}
                >
                  {target}
                </Button>
              </div>
            ))}
          </div>
          <Toggle
            label={
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                Modest angle (no low view)
              </span>
            }
            checked={studio.modestAngle}
            onChange={(e) => onPatchCameraStudio({ modestAngle: e.target.checked })}
          />
        </div>
      </Panel>

      <Panel>
        <SectionHeader
          accent="accent"
          title={
            <>
              <RotateCw className="w-3.5 h-3.5" />
              Orbit presets
            </>
          }
        />
        <div className="ds-stack ds-stack--sm">
          <Select
            value={studio.orbitPreset}
            onChange={(e) => onPatchCameraStudio({ orbitPreset: e.target.value as CameraOrbitPresetId })}
          >
            {CAMERA_STUDIO_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
          {selectedPreset ? (
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] leading-snug m-0">
              {selectedPreset.description}
            </p>
          ) : null}
          <Slider
            label="Orbit speed"
            valueLabel={studio.orbitSpeed.toFixed(2)}
            min={0.25}
            max={2}
            step={0.05}
            value={studio.orbitSpeed}
            onChange={(e) => onPatchCameraStudio({ orbitSpeed: Number(e.target.value) })}
          />
          <Toggle
            label="Live orbit while playing"
            checked={studio.liveOrbit}
            onChange={(e) => onPatchCameraStudio({ liveOrbit: e.target.checked })}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={studio.orbitPreset === 'manual'}
            onClick={() => onApplyCameraPreset(studio.orbitPreset)}
          >
            Apply preset to timeline
          </Button>
        </div>
      </Panel>

      <Panel>
        <SectionHeader
          accent="accent"
          title={
            <>
              <ImagePlus className="w-3.5 h-3.5" />
              Camera background
            </>
          }
        />
        <div className="ds-stack ds-stack--sm">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleBackgroundFile(e.target.files?.[0])}
          />
          <Button type="button" variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>
            Upload background image
          </Button>
          {studio.backgroundImageUrl ? (
            <>
              <div
                className="h-20 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-cover bg-center"
                style={{
                  backgroundImage: `url(${studio.backgroundImageUrl})`,
                  opacity: studio.backgroundOpacity,
                  filter: studio.backgroundBlur > 0 ? `blur(${studio.backgroundBlur}px)` : undefined,
                }}
              />
              <Slider
                label="Opacity"
                valueLabel={studio.backgroundOpacity.toFixed(2)}
                min={0}
                max={1}
                step={0.05}
                value={studio.backgroundOpacity}
                onChange={(e) => onPatchCameraStudio({ backgroundOpacity: Number(e.target.value) })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onPatchCameraStudio({ backgroundImageUrl: null })}
              >
                Remove background
              </Button>
            </>
          ) : null}
        </div>
      </Panel>

      <Panel>
        <SectionHeader
          accent="warning"
          title={
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Quick bloom
            </>
          }
        />
        <div className="ds-segmented">
          <div className="ds-segmented__item">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => onSetVisualFx({ bloomEnabled: true, bloomIntensity: 0.45, bloomThreshold: 0.78 })}
            >
              Soft
            </Button>
          </div>
          <div className="ds-segmented__item">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => onSetVisualFx({ bloomEnabled: true, bloomIntensity: 0.75, bloomThreshold: 0.62 })}
            >
              Strong
            </Button>
          </div>
          <div className="ds-segmented__item">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => onSetVisualFx({ bloomEnabled: false })}
            >
              Off
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
