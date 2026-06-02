import { FolderOpen, Play, Upload } from 'lucide-react';
import { Button } from '../UI';

interface ViewportEmptyStateProps {
  onTryDemo?: () => void;
}

/** Centered empty state — replaces floating drag-drop panel. */
export default function ViewportEmptyState({ onTryDemo }: ViewportEmptyStateProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none p-[var(--space-xl)]">
      <div
        className="pointer-events-auto max-w-sm w-full text-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-panel)_92%,transparent)] backdrop-blur-md shadow-xl"
        style={{ padding: 'var(--space-xl)' }}
      >
        <div
          className="mx-auto mb-[var(--space-md)] flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]"
        >
          <Upload className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h2 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-main)] m-0 mb-[var(--space-sm)]">
          Add your first character
        </h2>
        <p className="text-[var(--font-size-base)] text-[var(--color-text-secondary)] m-0 mb-[var(--space-lg)] leading-relaxed">
          Drop a model folder or ZIP into the viewport, or load a sample scene to start editing.
        </p>
        <div className="flex flex-col gap-[var(--space-sm)]">
          {onTryDemo ? (
            <Button type="button" variant="primary" className="w-full" onClick={onTryDemo}>
              <Play className="w-4 h-4" />
              Try demo scene
            </Button>
          ) : null}
          <p className="flex items-center justify-center gap-1.5 text-[var(--font-size-sm)] text-[var(--color-text-muted)] m-0">
            <FolderOpen className="w-3.5 h-3.5" />
            PMX, PMD, VMD, textures · up to 4 characters
          </p>
        </div>
      </div>
    </div>
  );
}
