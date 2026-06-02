import { Camera, Layers, Play, Pause, Sliders, Sparkles } from 'lucide-react';
import { cn } from '../../components/UI/cn';
import type { ProMobileTab } from './types';

interface ProMobileNavProps {
  activeTab: ProMobileTab | null;
  isPlaying: boolean;
  onTab: (tab: ProMobileTab) => void;
  onPlay: () => void;
}

const NAV_ITEMS: { id: ProMobileTab; label: string; Icon: typeof Layers }[] = [
  { id: 'scene', label: 'Scene', Icon: Layers },
  { id: 'control', label: 'Control', Icon: Sliders },
  { id: 'camera', label: 'Camera', Icon: Camera },
  { id: 'fx', label: 'FX', Icon: Sparkles },
];

export default function ProMobileNav({ activeTab, isPlaying, onTab, onPlay }: ProMobileNavProps) {
  return (
    <nav className="pro-nav shrink-0 z-[44] grid grid-cols-5 items-end px-1 pt-1 pb-[env(safe-area-inset-bottom)]" aria-label="Studio">
      {NAV_ITEMS.slice(0, 2).map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          className={cn('pro-nav__item', activeTab === id && 'pro-nav__item--active')}
          aria-pressed={activeTab === id}
        >
          <Icon className="w-5 h-5" aria-hidden />
          <span>{label}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={onPlay}
        className="pro-nav__play"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-9 h-9" /> : <Play className="w-9 h-9 fill-current" />}
        <span>{isPlaying ? 'Pause' : 'Play'}</span>
      </button>

      {NAV_ITEMS.slice(2).map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          className={cn('pro-nav__item', activeTab === id && 'pro-nav__item--active')}
          aria-pressed={activeTab === id}
        >
          <Icon className="w-5 h-5" aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
