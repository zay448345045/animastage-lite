import {
  Camera as CameraIcon,
  Sun,
  User,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { FEATURED_DEMO_ID } from '../../demos/demoCatalog';
import type { AppState } from '../../types';
import SceneGraphPanel from '../../product/ux/SceneGraphPanel';
import type { SceneGraphState } from '../../product/ux/sceneGraph';
import { Button } from '../UI';

interface SceneSectionProps {
  appState: AppState;
  sceneGraph?: SceneGraphState;
  onSelectModel: (id: string | null) => void;
  onToggleVisibility: (id: string, type: 'model' | 'other') => void;
  onDeleteModel: (id: string) => void;
  onSceneGraphToggleVisibility?: (objectId: string) => void;
  onSceneGraphToggleLock?: (objectId: string) => void;
  onSceneGraphCreateGroup?: () => void;
  onLoadDemo?: (demoId: string) => void;
  onLoadModel?: (preset: 'miku' | 'kizuna' | 'custom') => void;
}

export default function SceneSection({
  appState,
  sceneGraph,
  onSelectModel,
  onToggleVisibility,
  onDeleteModel,
  onSceneGraphToggleVisibility,
  onSceneGraphToggleLock,
  onSceneGraphCreateGroup,
  onLoadDemo,
  onLoadModel,
}: SceneSectionProps) {
  const { models, objects, selectedObjectId } = appState;

  return (
    <>
      {sceneGraph && onSceneGraphToggleVisibility && onSceneGraphToggleLock && onSceneGraphCreateGroup ? (
        <SceneGraphPanel
          graph={sceneGraph}
          selectedId={selectedObjectId}
          onSelect={onSelectModel}
          onToggleVisibility={onSceneGraphToggleVisibility}
          onToggleLock={onSceneGraphToggleLock}
          onCreateGroup={onSceneGraphCreateGroup}
        />
      ) : null}

      {models.length > 0 ? (
        <div>
          <label className="block text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-[var(--space-xs)]">
            Selected character
          </label>
          <select
            value={selectedObjectId || ''}
            onChange={(e) => onSelectModel(e.target.value || null)}
            className="ds-select"
          >
            <option value="">Choose a character…</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-[var(--space-sm)] m-0">
          Scene objects ({objects.length + models.length})
        </p>
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden">
          {objects
            .filter((obj) => obj.type !== 'model')
            .map((obj) => {
              const selected = selectedObjectId === obj.id;
              return (
                <div
                  key={obj.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectModel(obj.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectModel(obj.id);
                  }}
                  className={`flex items-center justify-between px-[var(--space-sm)] py-[var(--space-sm)] text-[var(--font-size-base)] cursor-pointer border-b border-[var(--color-border)] last:border-b-0 ${
                    selected
                      ? 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-panel-raised)]'
                  }`}
                >
                  <span className="flex items-center gap-[var(--space-sm)] truncate">
                    {obj.type === 'camera' ? (
                      <CameraIcon className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{obj.name}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(obj.id, 'other');
                    }}
                    aria-label={obj.visible ? 'Hide' : 'Show'}
                  >
                    {obj.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-50" />}
                  </Button>
                </div>
              );
            })}

          {models.length === 0 ? (
            <div className="py-[var(--space-xl)] px-[var(--space-md)] text-center">
              <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] m-0 mb-[var(--space-md)]">
                No characters in scene yet
              </p>
              {onLoadDemo ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => onLoadDemo(FEATURED_DEMO_ID)}>
                  Load demo scene
                </Button>
              ) : onLoadModel ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => onLoadModel('miku')}>
                  Load sample character
                </Button>
              ) : null}
            </div>
          ) : (
            models.map((model) => {
              const selected = selectedObjectId === model.id;
              return (
                <div
                  key={model.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectModel(model.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectModel(model.id);
                  }}
                  className={`flex items-center justify-between px-[var(--space-sm)] py-[var(--space-sm)] text-[var(--font-size-base)] cursor-pointer border-b border-[var(--color-border)] last:border-b-0 ${
                    selected
                      ? 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-panel-raised)]'
                  }`}
                >
                  <span className="flex items-center gap-[var(--space-sm)] truncate">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{model.name}</span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="!p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(model.id, 'model');
                      }}
                      aria-label={model.visible ? 'Hide character' : 'Show character'}
                    >
                      {model.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-50" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="!p-1 text-[var(--color-error)] hover:text-[var(--color-error)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteModel(model.id);
                      }}
                      aria-label="Remove character"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
