import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import type { SceneBackgroundSettings } from '../types';

interface SceneBackgroundPickerProps {
  background: SceneBackgroundSettings;
  onChange: (patch: Partial<SceneBackgroundSettings>) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}

export default function SceneBackgroundPicker({
  background,
  onChange,
  onClear,
  disabled = false,
  className = '',
}: SceneBackgroundPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    onChange({ imageUrl: url, opacity: background.opacity || 1 });
  };

  return (
    <div
      className={`flex items-center gap-1.5 bg-[#121418]/85 border border-zinc-800 rounded-md px-2 py-1 shadow-md backdrop-blur-sm ${className}`}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1 text-[9px] font-bold uppercase text-zinc-300 hover:text-[#39c5bb] disabled:opacity-40 cursor-pointer transition-colors px-1"
        title="Upload custom background (jpg, png, webp)"
      >
        <ImagePlus className="w-3 h-3" />
        Background
      </button>
      {background.imageUrl && (
        <>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={background.opacity}
            disabled={disabled}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
            className="w-14 h-1 accent-[#39c5bb] cursor-pointer"
            title="Background opacity"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="p-0.5 text-zinc-500 hover:text-red-400 cursor-pointer disabled:opacity-40"
            title="Remove background"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}
