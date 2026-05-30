import { useEffect, useState } from 'react';
import { Play, Timer } from 'lucide-react';
import { DEMO_CATEGORY_LABELS } from '../../demos/demoCatalog';
import { LANDING_PREVIEW_DEMOS } from '../../demos/landingDemos';

interface DemoGalleryGridProps {
  onSelectDemo: (id: string) => void;
}

export default function DemoGalleryGrid({ onSelectDemo }: DemoGalleryGridProps) {
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHighlightIndex((i) => (i + 1) % LANDING_PREVIEW_DEMOS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {LANDING_PREVIEW_DEMOS.map((demo, index) => {
        const isHighlight = highlightIndex === index && !hoveredId;
        const isHovered = hoveredId === demo.id;

        return (
          <button
            key={demo.id}
            type="button"
            onClick={() => onSelectDemo(demo.id)}
            onMouseEnter={() => setHoveredId(demo.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(demo.id)}
            onBlur={() => setHoveredId(null)}
            className={`group relative text-left rounded-xl overflow-hidden transition-all duration-300 cursor-pointer glass-panel ${
              isHighlight || isHovered
                ? 'border-cyan-500/50 ring-2 ring-cyan-500/30 scale-[1.02] z-10'
                : 'hover:border-cyan-500/30'
            }`}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={demo.thumbnail}
                alt=""
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isHovered || isHighlight ? 'scale-110' : 'scale-100'
                }`}
                loading="lazy"
                decoding="async"
              />
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-opacity duration-300 ${
                  isHovered || isHighlight ? 'opacity-100 bg-black/50' : 'opacity-0 group-hover:opacity-100 bg-black/40'
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-zinc-950 shadow-lg landing-pulse-play">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </span>
                <span className="text-[10px] font-bold text-white flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  ~2s to play
                </span>
              </div>
              {isHighlight && !hoveredId && (
                <span className="absolute top-1.5 left-1.5 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500 text-zinc-950">
                  Preview
                </span>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[9px] font-bold uppercase text-violet-400">
                {DEMO_CATEGORY_LABELS[demo.category]}
              </p>
              <p className="text-xs font-semibold text-zinc-100 truncate">{demo.title}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
