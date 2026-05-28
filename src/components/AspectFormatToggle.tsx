import { Smartphone, Monitor } from 'lucide-react';
import type { ViewportFormat } from '../types';
import { VIEWPORT_FORMAT_OPTIONS } from '../utils/viewportFormat';

interface AspectFormatToggleProps {
  format: ViewportFormat;
  onChange: (format: ViewportFormat) => void;
  className?: string;
}

export default function AspectFormatToggle({
  format,
  onChange,
  className = '',
}: AspectFormatToggleProps) {
  return (
    <div
      className={`flex items-center bg-[#121418]/85 border border-zinc-800 rounded-md overflow-hidden shadow-md backdrop-blur-sm ${className}`}
      role="group"
      aria-label="Viewport aspect ratio"
    >
      {VIEWPORT_FORMAT_OPTIONS.map((opt) => {
        const active = format === opt.id;
        const Icon = opt.id === '9:16' ? Smartphone : Monitor;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-2.5 py-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
              active
                ? opt.id === '9:16'
                  ? 'bg-[#ff3385]/20 text-[#ff6ba8]'
                  : 'bg-[#39c5bb]/20 text-[#39c5bb]'
                : 'text-zinc-400 hover:text-zinc-200'
            } ${opt.id === '9:16' ? 'border-l border-zinc-800' : ''}`}
            title={opt.id === '9:16' ? 'Vertical Shorts / TikTok (9:16)' : 'Landscape editor (16:9)'}
          >
            <Icon className="w-3 h-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
