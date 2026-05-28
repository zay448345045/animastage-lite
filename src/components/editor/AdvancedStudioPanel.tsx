import { useState, useRef } from 'react';
import {
  Users,
  Sparkles,
  Video,
  Layers,
  Loader2,
  Radio,
  Wand2,
} from 'lucide-react';
import type { AnimationLayerDef, MMDModel, TimelineKeyframe } from '../../types';
import type { CollabMode } from '../../collab/collabSync';
import { createDefaultLayers } from '../../editor/animationLayers';
import { extractMocapFromVideo, type MocapProgress } from '../../mocap/videoMocap';
import {
  generateKeyframesFromPrompt,
  infillKeyframes,
  retargetKeyframes,
  hasMotionAi,
} from '../../ai/motionAi';
interface AdvancedStudioPanelProps {
  selectedModel: MMDModel | undefined;
  maxFrames: number;
  collabConnected: boolean;
  collabRoom: string;
  collabPeers: number;
  collabStatus?: string;
  onCollabJoin: (room: string, mode: CollabMode) => void;
  onCollabLeave: () => void;
  onApplyKeyframes: (keyframes: TimelineKeyframe[], mode: 'merge' | 'replace') => void;
  onUpdateLayers: (layers: AnimationLayerDef[]) => void;
  onToggleGroupSolo: (groupId: string) => void;
  onToggleGroupMute: (groupId: string) => void;
}

export default function AdvancedStudioPanel({
  selectedModel,
  maxFrames,
  collabConnected,
  collabRoom,
  collabPeers,
  collabStatus = '',
  onCollabJoin,
  onCollabLeave,
  onApplyKeyframes,
  onUpdateLayers,
  onToggleGroupSolo,
  onToggleGroupMute,
}: AdvancedStudioPanelProps) {
  const [roomInput, setRoomInput] = useState('animastage-room');
  const [aiPrompt, setAiPrompt] = useState('gentle wave dance');
  const [mocapProgress, setMocapProgress] = useState<MocapProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  const layers = selectedModel?.animLayers ?? [];

  const handleMocap = async (file: File) => {
    setBusy(true);
    try {
      const keys = await extractMocapFromVideo(file, setMocapProgress);
      onApplyKeyframes(keys, 'merge');
      setStatus(`Mocap: +${keys.length} keys`);
    } catch (e) {
      setStatus((e as Error).message);
      setMocapProgress({ phase: 'error', progress: 0, message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!hasMotionAi()) {
      setStatus('Set VITE_GEMINI_API_KEY in .env');
      return;
    }
    setBusy(true);
    try {
      const keys = await generateKeyframesFromPrompt(aiPrompt, maxFrames);
      onApplyKeyframes(keys, 'merge');
      setStatus(`AI: ${keys.length} keys`);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleAiInfill = async () => {
    if (!selectedModel || !hasMotionAi()) return;
    setBusy(true);
    try {
      const start = Math.max(0, selectedModel.keyframes.length ? 10 : 0);
      const end = Math.min(maxFrames, start + 30);
      const keys = await infillKeyframes(selectedModel.keyframes, start, end, aiPrompt);
      onApplyKeyframes(keys, 'merge');
      setStatus(`Infill ${start}-${end}: ${keys.length} keys`);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleRetarget = () => {
    if (!selectedModel?.keyframes.length) return;
    const keys = retargetKeyframes(selectedModel.keyframes, 1.25);
    onApplyKeyframes(keys, 'replace');
    setStatus('Retarget ×1.25');
  };

  const addLayer = () => {
    if (!selectedModel) return;
    const next = [
      ...layers,
      {
        id: `layer_${Date.now()}`,
        name: `Layer ${layers.length + 1}`,
        weight: 0.5,
        keyframes: [],
        muted: false,
        boneMask: null,
      },
    ];
    onUpdateLayers(next);
  };

  if (!selectedModel) {
    return (
      <p className="text-[10px] text-zinc-500 p-2">Select a model for Mocap / AI / Collab</p>
    );
  }

  return (
    <div className="space-y-3 p-1 max-h-[420px] overflow-y-auto">
      {/* Layers */}
      <section className="border border-amber-500/25 rounded-md p-2 bg-amber-950/10">
        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-200 mb-2">
          <Layers className="w-3 h-3" />
          Animation layers
        </div>
        {layers.length === 0 ? (
          <button
            type="button"
            onClick={() =>
              onUpdateLayers(createDefaultLayers(selectedModel.keyframes))
            }
            className="text-[9px] font-bold text-amber-300 border border-amber-500/40 px-2 py-1 rounded cursor-pointer"
          >
            Initialize layers
          </button>
        ) : (
          <div className="space-y-2">
            {layers.map((layer) => (
              <div key={layer.id} className="bg-zinc-900/80 rounded p-1.5 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-zinc-300">{layer.name}</span>
                  <label className="flex items-center gap-1 text-[8px] text-zinc-500">
                    <input
                      type="checkbox"
                      checked={layer.muted}
                      onChange={() =>
                        onUpdateLayers(
                          layers.map((l) =>
                            l.id === layer.id ? { ...l, muted: !l.muted } : l
                          )
                        )
                      }
                    />
                    mute
                  </label>
                </div>
                <label className="block text-[8px] text-zinc-500">
                  Weight {(layer.weight * 100).toFixed(0)}%
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={layer.weight}
                    className="w-full accent-amber-400"
                    onChange={(e) =>
                      onUpdateLayers(
                        layers.map((l) =>
                          l.id === layer.id
                            ? { ...l, weight: parseFloat(e.target.value) }
                            : l
                        )
                      )
                    }
                  />
                </label>
                <span className="text-[8px] text-zinc-600 font-mono">
                  {layer.keyframes.length} keys
                  {layer.boneMask?.length ? ` · mask ${layer.boneMask.length}` : ''}
                </span>
              </div>
            ))}
            <button
              type="button"
              onClick={addLayer}
              className="text-[9px] text-amber-300 cursor-pointer"
            >
              + layer
            </button>
          </div>
        )}
        {selectedModel.boneGroups && selectedModel.boneGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedModel.boneGroups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onToggleGroupSolo(g.id)}
                className={`text-[8px] px-1 rounded border cursor-pointer ${
                  g.solo ? 'border-amber-400 text-amber-300' : 'border-zinc-700 text-zinc-500'
                }`}
              >
                solo {g.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Mocap */}
      <section className="border border-cyan-500/25 rounded-md p-2 bg-cyan-950/10">
        <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-200 mb-2">
          <Video className="w-3 h-3" />
          Mocap (video → keys)
        </div>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleMocap(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => videoInputRef.current?.click()}
          className="w-full py-1.5 text-[9px] font-bold rounded border border-cyan-500/40 text-cyan-200 cursor-pointer disabled:opacity-50"
        >
          {busy && mocapProgress?.phase === 'processing' ? (
            <span className="flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {mocapProgress.message}
            </span>
          ) : (
            'Upload video…'
          )}
        </button>
      </section>

      {/* AI */}
      <section className="border border-violet-500/25 rounded-md p-2 bg-violet-950/10">
        <div className="flex items-center gap-1 text-[10px] font-bold text-violet-200 mb-2">
          <Sparkles className="w-3 h-3" />
          AI motion {hasMotionAi() ? '' : '(no API key)'}
        </div>
        <input
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          className="w-full text-[10px] bg-zinc-900 border border-zinc-700 rounded px-2 py-1 mb-2 text-zinc-200"
          placeholder="motion description"
        />
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleAiGenerate()}
            className="flex-1 py-1 text-[9px] font-bold rounded border border-violet-500/40 text-violet-200 cursor-pointer"
          >
            <Wand2 className="w-3 h-3 inline mr-0.5" />
            Generate
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleAiInfill()}
            className="flex-1 py-1 text-[9px] font-bold rounded border border-zinc-600 text-zinc-300 cursor-pointer"
          >
            Infill
          </button>
          <button
            type="button"
            onClick={handleRetarget}
            className="flex-1 py-1 text-[9px] font-bold rounded border border-zinc-600 text-zinc-300 cursor-pointer"
          >
            Retarget ×1.25
          </button>
        </div>
      </section>

      {/* Collab */}
      <section className="border border-emerald-500/25 rounded-md p-2 bg-emerald-950/10">
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-200 mb-2">
          <Users className="w-3 h-3" />
          Collaboration
        </div>
        <p className="text-[8px] text-zinc-500 mb-2 leading-relaxed">
          Local — tabs in this browser (no WebSocket). WebRTC — other devices
          (requires signaling; see VITE_COLLAB_SIGNALING).
        </p>
        {!collabConnected ? (
          <div className="space-y-1.5">
            <input
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              className="w-full text-[10px] bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onCollabJoin(roomInput, 'local')}
                className="flex-1 px-2 py-1 text-[9px] font-bold rounded bg-emerald-600 text-white cursor-pointer"
              >
                Local
              </button>
              <button
                type="button"
                onClick={() => onCollabJoin(roomInput, 'webrtc')}
                className="flex-1 px-2 py-1 text-[9px] font-bold rounded border border-emerald-500/50 text-emerald-200 cursor-pointer"
              >
                WebRTC
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-emerald-300 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                {collabRoom} · {collabPeers}
              </span>
              <button
                type="button"
                onClick={onCollabLeave}
                className="text-[9px] text-red-400 cursor-pointer"
              >
                Leave
              </button>
            </div>
            {collabStatus && (
              <p className="text-[8px] text-zinc-500">{collabStatus}</p>
            )}
          </div>
        )}
      </section>

      {status && (
        <p className="text-[9px] text-zinc-400 font-mono border-t border-zinc-800 pt-2">{status}</p>
      )}
    </div>
  );
}
