import { useMemo, useState } from 'react';
import { Loader2, Play, Sparkles } from 'lucide-react';
import {
  DEMO_CATALOG,
  DEMO_CATEGORY_LABELS,
  getFeaturedDemo,
} from '../../demos/demoCatalog';
import type { DemoGalleryCategory, DemoScene } from '../../demos/types';

export interface DemoGalleryPanelProps {
  onLoadDemo: (demoId: string) => void;
  loadingDemoId?: string | null;
  activeDemoId?: string | null;
  compact?: boolean;
}

type FilterCategory = DemoGalleryCategory | 'all';

function DemoCard({
  demo,
  loading,
  active,
  onLoad,
}: {
  demo: DemoScene;
  loading: boolean;
  active: boolean;
  onLoad: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onLoad}
      disabled={loading}
      className={`group relative flex flex-col text-left rounded-lg overflow-hidden border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
        active
          ? 'border-[#39c5bb] ring-1 ring-[#39c5bb]/40 bg-[#1a2428]'
          : 'border-[#2a2f38] bg-[#121418] hover:border-[#39c5bb]/50 hover:bg-[#161b22]'
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#0d0f12]">
        <img
          src={demo.thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {demo.featured && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/90 text-black">
            <Sparkles className="w-2.5 h-2.5" />
            Featured
          </span>
        )}
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/60 text-zinc-300">
          {demo.durationSec}s
        </span>
        <span
          className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-opacity ${
            loading ? 'opacity-100 bg-[#39c5bb] text-black' : 'opacity-0 group-hover:opacity-100 bg-[#39c5bb] text-black'
          }`}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
          {loading ? 'Loading…' : 'Play demo'}
        </span>
      </div>
      <div className="p-2.5 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-bold text-zinc-100 leading-tight">{demo.title}</h3>
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#39c5bb]/90">
            {DEMO_CATEGORY_LABELS[demo.category]}
          </span>
        </div>
        <p className="text-[10px] text-zinc-500 line-clamp-2 leading-snug">{demo.description}</p>
      </div>
    </button>
  );
}

export default function DemoGalleryPanel({
  onLoadDemo,
  loadingDemoId = null,
  activeDemoId = null,
  compact = false,
}: DemoGalleryPanelProps) {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const featured = getFeaturedDemo();

  const filtered = useMemo(() => listDemosFiltered(filter), [filter]);

  return (
    <div className={`flex flex-col gap-3 ${compact ? '' : 'min-h-0'}`}>
      <div className="space-y-1">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Demo Gallery</h2>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          One click loads a rig + motion into the viewport. No upload — playback starts automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {(['all', 'dance', 'vtuber', 'cinematic'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
              filter === cat
                ? 'bg-[#39c5bb]/15 text-[#39c5bb] border border-[#39c5bb]/30'
                : 'bg-[#1a1d24] text-zinc-400 border border-transparent hover:text-zinc-200'
            }`}
          >
            {cat === 'all' ? 'All' : DEMO_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onLoadDemo(featured.id)}
        disabled={Boolean(loadingDemoId)}
        className="w-full flex items-center gap-3 p-2 rounded-lg border border-[#39c5bb]/25 bg-gradient-to-r from-cyan-950/50 to-[#121418] hover:border-[#39c5bb]/50 transition-colors cursor-pointer disabled:opacity-60 text-left"
      >
        <img
          src={featured.thumbnail}
          alt=""
          className="w-16 h-10 rounded object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#39c5bb] uppercase">Quick start</p>
          <p className="text-xs font-bold text-white truncate">{featured.title}</p>
          <p className="text-[10px] text-zinc-500 truncate">{featured.description}</p>
        </div>
        {loadingDemoId === featured.id ? (
          <Loader2 className="w-4 h-4 text-[#39c5bb] animate-spin shrink-0" />
        ) : (
          <Play className="w-4 h-4 text-[#39c5bb] shrink-0 fill-current" />
        )}
      </button>

      <div
        className={`grid gap-2 ${
          compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        } max-h-[min(52dvh,420px)] overflow-y-auto pr-0.5`}
      >
        {filtered.map((demo) => (
          <DemoCard
            key={demo.id}
            demo={demo}
            loading={loadingDemoId === demo.id}
            active={activeDemoId === demo.id}
            onLoad={() => onLoadDemo(demo.id)}
          />
        ))}
      </div>

      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Drop your own PMX + VMD anytime via the viewport or File upload. Gallery demos use the built-in
        preview rig when no model pack is installed.
      </p>
    </div>
  );
}

function listDemosFiltered(filter: FilterCategory) {
  if (filter === 'all') return DEMO_CATALOG;
  return DEMO_CATALOG.filter((d) => d.category === filter);
}
