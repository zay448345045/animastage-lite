import { Eye, EyeOff, FolderPlus, Lock, Unlock } from 'lucide-react';
import type { SceneGraphState } from './sceneGraph';

interface SceneGraphPanelProps {
  graph: SceneGraphState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (objectId: string) => void;
  onToggleLock: (objectId: string) => void;
  onCreateGroup: () => void;
}

export default function SceneGraphPanel({
  graph,
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onCreateGroup,
}: SceneGraphPanelProps) {
  const grouped = graph.groups.length > 0;
  const nodes = graph.nodes;

  return (
    <div className="rounded-lg border border-[#22252c] bg-[#121418] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wide">Scene graph</span>
        <button
          type="button"
          onClick={onCreateGroup}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
        >
          <FolderPlus className="w-3 h-3" />
          Group
        </button>
      </div>
      {grouped && (
        <p className="text-[10px] text-zinc-600">
          {graph.groups.map((g) => g.name).join(' · ')}
        </p>
      )}
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {nodes.map((node) => (
          <li key={node.objectId}>
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer ${
                selectedId === node.objectId
                  ? 'bg-teal-500/15 text-teal-200 border border-teal-500/20'
                  : 'hover:bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <button
                type="button"
                className="flex-1 text-left truncate cursor-pointer"
                onClick={() => !node.locked && onSelect(node.objectId)}
                disabled={node.locked}
              >
                {node.parentId ? '↳ ' : ''}
                {node.name}
              </button>
              <button
                type="button"
                title={node.locked ? 'Unlock' : 'Lock'}
                onClick={() => onToggleLock(node.objectId)}
                className="p-0.5 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                {node.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
              <button
                type="button"
                title={node.visible ? 'Hide' : 'Show'}
                onClick={() => onToggleVisibility(node.objectId)}
                className="p-0.5 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                {node.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
