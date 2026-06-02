import { Save, FolderOpen, Share2, Smartphone, Gauge, Sparkles } from 'lucide-react';
import type { StudioUiMode } from '../../flow/types';
import type { QualityMode } from '../../product/scene/types';
import { DEBUG_UI } from '../../config/debugUi';
import { Button, cn } from '../UI';

interface StudioFlowBarProps {
  compact?: boolean;
  uiMode: StudioUiMode;
  onUiModeChange: (mode: StudioUiMode) => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onLoadProjectFile: () => void;
  onShareScene: () => void;
  onCreateShort: () => void;
  hasSavedProject: boolean;
  qualityMode: QualityMode;
  onQualityModeChange: (mode: QualityMode) => void;
  shareBusy?: boolean;
  readOnly?: boolean;
}

const QUALITY_OPTIONS: { id: QualityMode; label: string; tip: string }[] = [
  {
    id: 'performance',
    label: 'Performance',
    tip: 'Lowest GPU load — best for heavy models or recording Shorts',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    tip: 'Default editing — bloom on, physics on play',
  },
  {
    id: 'quality',
    label: 'Quality',
    tip: 'Full physics + HD — may drop FPS on large scenes',
  },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  options: { id: T; label: string; tip?: string }[];
  value: T;
  onChange: (id: T) => void;
  'aria-label'?: string;
}) {
  return (
    <div className="ds-segmented rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-0.5 bg-[var(--color-panel)]" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <div key={opt.id} className="ds-segmented__item">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            active={value === opt.id}
            title={opt.tip}
            className="w-full uppercase tracking-wide"
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function StudioFlowBar({
  compact = false,
  uiMode,
  onUiModeChange,
  onSaveProject,
  onLoadProject,
  onLoadProjectFile,
  onShareScene,
  onCreateShort,
  hasSavedProject,
  qualityMode,
  onQualityModeChange,
  shareBusy = false,
  readOnly = false,
}: StudioFlowBarProps) {
  if (readOnly) return null;

  return (
    <div
      className={cn(
        'studio-flow-bar shrink-0 flex flex-wrap items-center justify-between gap-[var(--space-md)] px-[var(--space-lg)] py-[var(--space-sm)] bg-[var(--color-bg)] border-b border-[var(--color-border)]',
        compact && 'studio-flow-bar--compact'
      )}
      style={{ fontSize: 'var(--font-size-base)' }}
    >
      <div className="flex flex-wrap items-center gap-[var(--space-md)] shrink-0">
        <Segmented
          aria-label="Editor mode"
          options={[
            { id: 'beginner' as const, label: 'Beginner' },
            { id: 'pro' as const, label: 'Pro' },
          ]}
          value={uiMode}
          onChange={onUiModeChange}
        />

        <div className="studio-flow-bar__quality flex items-center gap-[var(--space-sm)]">
          <Gauge className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden />
          <Segmented
            aria-label="Quality mode"
            options={QUALITY_OPTIONS}
            value={qualityMode}
            onChange={onQualityModeChange}
          />
        </div>
      </div>

      <div className="studio-flow-bar__actions flex flex-wrap items-center gap-[var(--space-sm)]">
        <Button type="button" variant="ghost" size="sm" onClick={onSaveProject} title="Download .animastage project file">
          <Save className="w-3.5 h-3.5" />
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onLoadProjectFile} title="Load .animastage from disk">
          <FolderOpen className="w-3.5 h-3.5" />
          Open
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLoadProject}
          disabled={!hasSavedProject}
          title="Restore last autosaved project"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Restore
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onShareScene}
          disabled={shareBusy}
          title="Copy viewer link"
          className="text-pink-300/90 hover:text-pink-200"
        >
          <Share2 className="w-3.5 h-3.5" />
          {shareBusy ? 'Sharing…' : 'Share'}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onCreateShort}
          title="9:16 vertical export"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Generate Short
        </Button>

        {DEBUG_UI && (
          <span className={cn('hidden lg:inline-flex items-center gap-1 text-[var(--color-text-muted)] ml-1')}>
            <Sparkles className="w-3 h-3" />
            {uiMode === 'beginner' ? 'Pose · Play · Export' : 'Timeline · Curves · Full tools'}
          </span>
        )}
      </div>
    </div>
  );
}
