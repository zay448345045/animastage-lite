import { Layers, Film, Play, Pause, Sparkles, Menu } from 'lucide-react';

interface MobileStudioBarProps {
  isPlaying: boolean;
  panelOpen: boolean;
  timelineOpen: boolean;
  onTogglePanel: () => void;
  onToggleTimeline: () => void;
  onTogglePlay: () => void;
  onOpenMenu: () => void;
  onOpenFx: () => void;
}

const sideBtn =
  'mobile-studio-bar__side flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] py-1 text-[9px] font-semibold uppercase tracking-wide transition-colors cursor-pointer';

export default function MobileStudioBar({
  isPlaying,
  panelOpen,
  timelineOpen,
  onTogglePanel,
  onToggleTimeline,
  onTogglePlay,
  onOpenMenu,
  onOpenFx,
}: MobileStudioBarProps) {
  return (
    <nav
      className="mobile-studio-bar shrink-0 flex items-end gap-0 border-t border-[#22252c] bg-[#0e1014]/95 backdrop-blur-md z-40 px-1 pt-1 pb-[env(safe-area-inset-bottom)]"
      aria-label="Studio mobile controls"
    >
      <div className="flex flex-1 items-stretch min-w-0">
        <button type="button" onClick={onOpenMenu} className={`${sideBtn} text-zinc-400 active:text-[#39c5bb]`}>
          <Menu className="w-5 h-5 shrink-0" aria-hidden />
          <span>Menu</span>
        </button>
        <button
          type="button"
          onClick={onTogglePanel}
          className={`${sideBtn} ${panelOpen ? 'text-[#39c5bb] bg-[#39c5bb]/10 rounded-t-md' : 'text-zinc-400'}`}
          aria-pressed={panelOpen}
        >
          <Layers className="w-5 h-5 shrink-0" aria-hidden />
          <span>Scene</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onTogglePlay}
        className="mobile-studio-bar__play shrink-0 flex flex-col items-center justify-center gap-0.5 min-w-[4.5rem] min-h-[3.75rem] -mt-3 mx-1 px-3 py-2 rounded-2xl text-zinc-950 bg-[#39c5bb] shadow-[0_4px_20px_rgba(57,197,187,0.45)] active:bg-[#2eb8ae] active:scale-[0.98] cursor-pointer border-2 border-[#5ee0d6]/50"
        aria-label={isPlaying ? 'Pause playback' : 'Play animation'}
      >
        {isPlaying ? (
          <Pause className="w-8 h-8" aria-hidden />
        ) : (
          <Play className="w-8 h-8 fill-current" aria-hidden />
        )}
        <span className="text-[10px] font-extrabold uppercase tracking-wider">
          {isPlaying ? 'Pause' : 'Play'}
        </span>
      </button>

      <div className="flex flex-1 items-stretch min-w-0">
        <button
          type="button"
          onClick={onToggleTimeline}
          className={`${sideBtn} ${timelineOpen ? 'text-[#39c5bb] bg-[#39c5bb]/10 rounded-t-md' : 'text-zinc-400'}`}
          aria-pressed={timelineOpen}
        >
          <Film className="w-5 h-5 shrink-0" aria-hidden />
          <span>Timeline</span>
        </button>
        <button type="button" onClick={onOpenFx} className={`${sideBtn} text-zinc-400 active:text-[#76b900]`}>
          <Sparkles className="w-5 h-5 shrink-0" aria-hidden />
          <span>Effects</span>
        </button>
      </div>
    </nav>
  );
}
