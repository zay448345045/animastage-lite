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
  const btn =
    'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[52px] py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer';

  return (
    <nav
      className="mobile-studio-bar shrink-0 flex items-stretch border-t border-[#22252c] bg-[#0e1014]/95 backdrop-blur-md z-40 pb-[env(safe-area-inset-bottom)]"
      aria-label="Studio mobile controls"
    >
      <button type="button" onClick={onOpenMenu} className={`${btn} text-zinc-400 active:text-[#39c5bb]`}>
        <Menu className="w-5 h-5" />
        Menu
      </button>
      <button
        type="button"
        onClick={onTogglePanel}
        className={`${btn} ${panelOpen ? 'text-[#39c5bb] bg-[#39c5bb]/10' : 'text-zinc-400'}`}
      >
        <Layers className="w-5 h-5" />
        Panel
      </button>
      <button
        type="button"
        onClick={onTogglePlay}
        className={`${btn} text-zinc-950 bg-[#39c5bb] active:bg-[#2eb8ae] mx-1 my-1 rounded-lg min-w-[56px] flex-none`}
      >
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
        {isPlaying ? 'Stop' : 'Play'}
      </button>
      <button
        type="button"
        onClick={onToggleTimeline}
        className={`${btn} ${timelineOpen ? 'text-[#39c5bb] bg-[#39c5bb]/10' : 'text-zinc-400'}`}
      >
        <Film className="w-5 h-5" />
        Time
      </button>
      <button type="button" onClick={onOpenFx} className={`${btn} text-zinc-400 active:text-[#76b900]`}>
        <Sparkles className="w-5 h-5" />
        FX
      </button>
    </nav>
  );
}
