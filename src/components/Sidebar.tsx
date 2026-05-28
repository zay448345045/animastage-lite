import React, { useState } from 'react';
import { 
  Layers, 
  Settings, 
  Smile, 
  Bone, 
  ShieldAlert, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  Camera as CameraIcon, 
  Sun,
  User,
  Sliders,
  Sparkles,
  CheckCircle2,
  Film,
} from 'lucide-react';
import { AppState, MMDModel, MmdLiteConfig, PhysicsMode } from '../types';
import { isAmmoPhysicsBroken } from '../utils/mmdCharacterPhysics';
import FileUploader from './FileUploader';
import type { ProcessedMMDFiles } from '../utils/mmdFiles';
import BoneHierarchyPanel from './editor/BoneHierarchyPanel';
import MaterialsPanel from './editor/MaterialsPanel';
import AdvancedStudioPanel from './editor/AdvancedStudioPanel';
import type { AnimationLayerDef, TimelineKeyframe } from '../types';

interface SidebarProps {
  appState: AppState;
  onSelectModel: (id: string | null) => void;
  onSelectBone: (id: string | null) => void;
  onToggleVisibility: (id: string, type: 'model' | 'other') => void;
  onDeleteModel: (id: string) => void;
  onModifyMorphs: (modelId: string, morphName: 'eyes' | 'mouth' | 'brow', value: number) => void;
  onModifyBone: (modelId: string, boneId: string, axes: 'rotationX' | 'rotationY' | 'rotationZ', value: number) => void;
  onModifyModelPosition: (modelId: string, axis: 'positionX' | 'positionY' | 'positionZ', value: number) => void;
  onRegisterKeyframe: (modelId: string) => void;
  onLoadModel: (preset: 'miku' | 'kizuna' | 'custom') => void;
  onLoadCustomModel: (data: ProcessedMMDFiles) => void;
  setPhysicsMode: (mode: PhysicsMode) => void;
  onSetVmdPlaybackEnabled: (modelId: string, enabled: boolean) => void;
  onPatchMmdLite: (patch: Partial<MmdLiteConfig>) => void;
  highlightMaterial?: string | null;
  onSelectMaterial?: (name: string | null) => void;
  onSelectPmxBone?: (boneName: string) => void;
  collabConnected?: boolean;
  collabRoom?: string;
  collabPeers?: number;
  onCollabJoin?: (room: string, mode: import('../collab/collabSync').CollabMode) => void;
  collabStatus?: string;
  onCollabLeave?: () => void;
  onApplyKeyframes?: (keyframes: TimelineKeyframe[], mode: 'merge' | 'replace') => void;
  onUpdateAnimLayers?: (layers: AnimationLayerDef[]) => void;
  onToggleGroupSolo?: (groupId: string) => void;
  onToggleGroupMute?: (groupId: string) => void;
  maxFrames?: number;
}

export default function Sidebar({
  appState,
  onSelectModel,
  onSelectBone,
  onToggleVisibility,
  onDeleteModel,
  onModifyMorphs,
  onModifyBone,
  onModifyModelPosition,
  onRegisterKeyframe,
  onLoadModel,
  onLoadCustomModel,
  setPhysicsMode,
  onSetVmdPlaybackEnabled,
  onPatchMmdLite,
  highlightMaterial = null,
  onSelectMaterial,
  onSelectPmxBone,
  collabConnected = false,
  collabRoom = '',
  collabPeers = 0,
  collabStatus = '',
  onCollabJoin,
  onCollabLeave,
  onApplyKeyframes,
  onUpdateAnimLayers,
  onToggleGroupSolo,
  onToggleGroupMute,
  maxFrames = 120,
}: SidebarProps) {
  const lite = appState.mmdLite;
  const ammoBroken = isAmmoPhysicsBroken();
  const [activeTab, setActiveTab] = useState<
    'hierarchy' | 'manipulation' | 'physics' | 'editor' | 'pro'
  >('manipulation');

  const selectedModel = appState.models.find(m => m.id === appState.selectedObjectId);
  const selectedBone = selectedModel?.bones.find(b => b.id === appState.selectedBoneId);
  const vmdActive =
    selectedModel?.hasVmdAnimation && selectedModel.vmdPlaybackEnabled !== false;

  return (
    <aside className="w-80 bg-[#16181d] border-r border-[#22252c] flex flex-col h-full overflow-hidden select-none font-sans" id="mmd-sidebar">
      {/* OS Tab Selectors */}
      <div className="flex bg-[#121418] p-1.5 gap-1 border-b border-[#22252c]">
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'hierarchy' 
              ? 'bg-[#222630] text-[#39c5bb] border border-teal-500/10' 
              : 'text-zinc-400 bg-transparent hover:bg-[#1a1d24] hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Scene
        </button>
        <button
          onClick={() => setActiveTab('manipulation')}
          className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'manipulation' 
              ? 'bg-[#222630] text-[#39c5bb] border border-teal-500/10' 
              : 'text-zinc-400 bg-transparent hover:bg-[#1a1d24] hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Control
        </button>
        <button
          onClick={() => setActiveTab('physics')}
          className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'physics' 
              ? 'bg-[#222630] text-[#39c5bb] border border-teal-500/10' 
              : 'text-zinc-400 bg-transparent hover:bg-[#1a1d24] hover:text-zinc-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Phys
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'editor'
              ? 'bg-[#222630] text-violet-300 border border-violet-500/20'
              : 'text-zinc-400 bg-transparent hover:bg-[#1a1d24] hover:text-zinc-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => setActiveTab('pro')}
          className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'pro'
              ? 'bg-[#222630] text-amber-300 border border-amber-500/20'
              : 'text-zinc-400 bg-transparent hover:bg-[#1a1d24] hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Pro
        </button>
      </div>

      {/* Main Sidebar Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* TAB 1: HIERARCHY / OBJECTS TREE (Modern Graph Explorer List) */}
        {activeTab === 'hierarchy' && (
          <div className="space-y-4">
            <div>
              <div className="bg-[#121418] text-zinc-300 font-bold text-[10px] uppercase px-3 py-1.5 flex items-center justify-between border-t border-l border-r border-[#22252c]">
                <span>Loaded Scene Objects ({appState.objects.length + appState.models.length})</span>
                <span className="text-[#39c5bb] font-mono">[WebGL Scene]</span>
              </div>
              
              <div className="bg-[#121418] border border-[#22252c] p-2 min-h-[220px] rounded-b-md overflow-y-auto">
                {/* Cameras and Lights */}
                {appState.objects.filter(obj => obj.type !== 'model').map((obj) => {
                  const isSelected = appState.selectedObjectId === obj.id;
                  return (
                    <div 
                      key={obj.id}
                      className={`flex items-center justify-between px-2 py-1.5 text-xs select-none cursor-pointer rounded mb-0.5 transition-all ${
                        isSelected 
                          ? 'bg-teal-950/40 text-[#39c5bb] border-l-2 border-[#39c5bb] font-bold' 
                          : 'text-zinc-300 hover:bg-[#1e222d] hover:text-white'
                      }`}
                      onClick={() => onSelectModel(obj.id)}
                    >
                      <div className="flex items-center space-x-2 flex-1 truncate">
                        {obj.type === 'camera' ? (
                          <CameraIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#39c5bb]' : 'text-blue-400'}`} />
                        ) : (
                          <Sun className={`w-3.5 h-3.5 ${isSelected ? 'text-[#39c5bb]' : 'text-amber-500'}`} />
                        )}
                        <span className="truncate text-[11.5px]">{obj.name}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(obj.id, 'other'); }}
                        className="p-1 text-zinc-400 hover:text-[#39c5bb]"
                      >
                        {obj.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 opacity-50 text-zinc-600" />
                        )}
                      </button>
                    </div>
                  );
                })}

                {/* Separator if models exist */}
                {appState.models.length > 0 && <div className="h-px bg-[#22252c] my-2" />}

                {/* MMD Models */}
                {appState.models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-[#1a1d24] border border-[#22252c] rounded">
                    <p className="text-[11px] text-zinc-400 font-bold mb-2">No MMD Models Loaded</p>
                    <button
                      onClick={() => onLoadModel('miku')}
                      className="cursor-pointer text-[10px] font-mono font-bold text-zinc-100 bg-teal-950/50 border border-teal-500/30 hover:bg-[#39c5bb] hover:text-black rounded px-3 py-1.5 transition-all shadow-sm"
                    >
                      + Quick Load Miku
                    </button>
                  </div>
                ) : (
                  appState.models.map((model) => {
                    const isSelected = appState.selectedObjectId === model.id;
                    return (
                      <div 
                        key={model.id}
                        className={`flex items-center justify-between px-2 py-1.5 text-xs select-none cursor-pointer rounded mb-0.5 transition-all ${
                          isSelected 
                            ? 'bg-teal-950/40 text-[#39c5bb] border-l-2 border-[#39c5bb] font-bold' 
                            : 'text-zinc-300 hover:bg-[#1e222d] hover:text-white'
                        }`}
                        onClick={() => onSelectModel(model.id)}
                      >
                        <div className="flex items-center space-x-2 flex-1 truncate">
                          <User className={`w-3.5 h-3.5 ${isSelected ? 'text-[#39c5bb]' : 'text-[#ff3385]'}`} />
                          <span className="truncate text-[11.5px]">{model.name}</span>
                          <span className="text-[8px] bg-teal-500/10 text-[#39c5bb] px-1.5 py-0.2 rounded font-mono font-bold select-none border border-teal-500/20 scale-90">PMX</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(model.id, 'model'); }}
                            className="p-1 text-zinc-400 hover:text-[#39c5bb]"
                          >
                            {model.visible ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 opacity-50 text-zinc-650" />
                            )}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteModel(model.id); }}
                            className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Premium Tip Container with Neon Pink border */}
            <div className="bg-[#1a1d24] border border-[#ff3385]/20 p-3.5 text-[11px] text-zinc-300 leading-relaxed font-semibold rounded-md shadow-lg">
              <strong className="text-[#ff3385] flex items-center gap-1 mb-1.5 uppercase font-extrabold tracking-wide">💡 3D Workspace Rules:</strong>
              • Mouse Left Drag: Orbit perspective.<br />
              • Mouse Right Drag: Pan Stage grid.<br />
              • Scroll / Pinch: Zoom camera focal.<br />
              • Highlight joints in Blue inside Viewport to posing.
            </div>
          </div>
        )}

        {/* TAB 2: MANIPULATION PANEL (Modern Control Centers) */}
        {activeTab === 'manipulation' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            
            {/* 2A: Model Manipulation Box (Neon Pink) */}
            <div className="border-[#ff3385]/20 border bg-[#121418] p-3 rounded-md shadow-md">
              <div className="h-7 bg-[#1c1e24] -mx-3 -mt-3 mb-2 px-2 flex items-center justify-between text-zinc-200 text-[10px] font-bold uppercase select-none rounded-t-md border-b border-[#2c3240]">
                <span className="flex items-center text-[#ff3385]"><User className="w-3.5 h-3.5 mr-1" /> Model Manipulation</span>
                <span className="text-zinc-500 text-[8px]">Active Track</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-[#ff3385] font-bold uppercase tracking-wider">Active PMX Character</label>
                  <select 
                    value={appState.selectedObjectId || ''}
                    onChange={(e) => onSelectModel(e.target.value || null)}
                    className="w-full bg-[#1e212a] border border-zinc-800 rounded text-xs font-bold p-1.5 px-2 outline-none text-zinc-150 focus:border-[#ff3385]/40 transition-all shadow-inner"
                  >
                    <option value="">-- No model selected --</option>
                    {appState.models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => onLoadModel('miku')}
                    className="cursor-pointer bg-[#1e212a] border border-zinc-805 hover:border-teal-500/30 hover:bg-[#1a2d2d] py-1.5 px-2 text-xs font-bold text-[#39c5bb] flex items-center justify-center gap-1 rounded shadow-sm transition-all"
                  >
                    <Plus className="w-3 h-3 text-[#39c5bb] font-extrabold" />
                    Load Miku
                  </button>
                  <button
                    onClick={() => onLoadModel('kizuna')}
                    className="cursor-pointer bg-[#1e212a] border border-zinc-805 hover:border-[#ff3385]/30 hover:bg-[#2d1b22] py-1.5 px-2 text-xs font-bold text-[#ff3385] flex items-center justify-center gap-1 rounded shadow-sm transition-all"
                  >
                    <Plus className="w-3 h-3 text-[#ff3385] font-extrabold" />
                    Load Kizuna
                  </button>
                </div>

                <div className="border-[#ff3385]/20 border-t border-dashed pt-2.5 mt-1 space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wide">Or Import Folder / Zip Directly</span>
                  <p className="text-[9px] text-zinc-500 leading-snug">
                    One folder: .pmx model + textures + .vmd motion. Animation starts automatically.
                  </p>
                  <FileUploader onModelLoaded={onLoadCustomModel} />
                </div>

                {selectedModel?.hasVmdAnimation && (
                  <div className="border border-[#39c5bb]/25 bg-[#0f1f1e] rounded-md p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase text-[#39c5bb] flex items-center gap-1">
                        <Film className="w-3.5 h-3.5" />
                        Imported VMD Motion
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onSetVmdPlaybackEnabled(selectedModel.id, !vmdActive)
                        }
                        className={`cursor-pointer text-[10px] font-bold px-2.5 py-1 rounded border transition-all ${
                          vmdActive
                            ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {vmdActive ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-snug font-semibold">
                      {vmdActive
                        ? 'Loaded .vmd drives the pose. Timeline templates only add camera / FX — body keys are ignored.'
                        : 'VMD paused. Timeline templates and keyframes control the model.'}
                    </p>
                    {selectedModel.keyframes.length > 0 && vmdActive && (
                      <p className="text-[9px] text-amber-400/90 font-bold">
                        Body template keys exist but VMD has priority. Turn OFF to preview templates.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <button
                    disabled={!selectedModel}
                    onClick={() => selectedModel && onRegisterKeyframe(selectedModel.id)}
                    className={`w-full cursor-pointer py-2 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${
                      selectedModel 
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:brightness-110 text-white shadow-md' 
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    REGISTER FRAME KEY ({appState.currentFrame})
                  </button>
                </div>
              </div>
            </div>

            {/* 2A: Root / Center position (Mother Bone) */}
            <div className="border-[#9d27ff]/25 border bg-[#121418] p-3 rounded-md shadow-md">
              <div className="h-7 bg-[#1c1e24] -mx-3 -mt-3 mb-2 px-2 flex items-center justify-between text-zinc-200 text-[10px] font-bold uppercase select-none rounded-t-md border-b border-[#2c3240]">
                <span className="flex items-center text-[#e879ff]">Root Marker (Center)</span>
                <span className="text-zinc-500 text-[8px]">Global XYZ</span>
              </div>

              {selectedModel ? (
                <div className="space-y-2.5">
                  <p className="text-[10px] text-zinc-400 font-semibold">
                    Click the purple ring under the model or deselect a bone to move the entire character.
                  </p>
                  {(['positionX', 'positionY', 'positionZ'] as const).map((axis) => {
                    const label = axis === 'positionX' ? 'X' : axis === 'positionY' ? 'Y' : 'Z';
                    return (
                      <div key={axis} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                          <span>Position {label}</span>
                          <span className="font-mono text-[#e879ff] bg-[#1e212a] border border-zinc-800 px-1.5 font-bold text-[9px] rounded-sm">
                            {selectedModel[axis].toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={axis === 'positionY' ? -5 : -20}
                          max={axis === 'positionY' ? 20 : 20}
                          step={0.05}
                          value={selectedModel[axis]}
                          onChange={(e) =>
                            onModifyModelPosition(selectedModel.id, axis, parseFloat(e.target.value))
                          }
                          className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer border border-[#2c3240]"
                        />
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      onModifyModelPosition(selectedModel.id, 'positionX', 0);
                      onModifyModelPosition(selectedModel.id, 'positionY', 0);
                      onModifyModelPosition(selectedModel.id, 'positionZ', 0);
                      onSelectBone(null);
                    }}
                    className="w-full cursor-pointer bg-[#1e212a] border border-zinc-800 hover:bg-[#202532] hover:text-[#e879ff] py-1.5 text-[10px] font-extrabold text-zinc-300 rounded transition-all text-center uppercase shadow-sm"
                  >
                    Reset Root to Origin
                  </button>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 italic font-semibold text-center py-3">
                  Load a model to edit root position.
                </div>
              )}
            </div>

            {/* 2B: Facial Morphing Sliders (Neon Cyan) */}
            <div className="border-[#39c5bb]/20 border bg-[#121418] p-3 rounded-md shadow-md">
              <div className="h-7 bg-[#1c1e24] -mx-3 -mt-3 mb-2 px-2 flex items-center justify-between text-zinc-200 text-[10px] font-bold uppercase select-none rounded-t-md border-b border-[#2c3240]">
                <span className="flex items-center text-[#39c5bb]"><Smile className="w-3.5 h-3.5 mr-1" /> Facial Manipulation</span>
                <span className="text-zinc-500 text-[8px]">(Morphs)</span>
              </div>

              <div className="space-y-3.5">
                {selectedModel ? (
                  <>
                    {/* Eyes Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-300">Eyes (Blink / Close)</span>
                        <span className="font-mono text-[#39c5bb] font-bold bg-[#1e212a] border border-[#2c3240] px-1.5 rounded-sm text-[9px]">
                          {(selectedModel.morphs.eyes * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedModel.morphs.eyes}
                        onChange={(e) => onModifyMorphs(selectedModel.id, 'eyes', parseFloat(e.target.value))}
                        className="w-full accent-[#39c5bb] bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer border border-[#2c3240]"
                      />
                    </div>

                    {/* Mouth Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-300">Mouth (Smile / Open)</span>
                        <span className="font-mono text-[#39c5bb] font-bold bg-[#1e212a] border border-[#2c3240] px-1.5 rounded-sm text-[9px]">
                          {(selectedModel.morphs.mouth * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedModel.morphs.mouth}
                        onChange={(e) => onModifyMorphs(selectedModel.id, 'mouth', parseFloat(e.target.value))}
                        className="w-full accent-[#39c5bb] bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer border border-[#2c3240]"
                      />
                    </div>

                    {/* Brow Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-300">Brow (Anger / Sad)</span>
                        <span className="font-mono text-[#39c5bb] font-bold bg-[#1e212a] border border-[#2c3240] px-1.5 rounded-sm text-[9px]">
                          {(selectedModel.morphs.brow * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedModel.morphs.brow}
                        onChange={(e) => onModifyMorphs(selectedModel.id, 'brow', parseFloat(e.target.value))}
                        className="w-full accent-[#39c5bb] bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer border border-[#2c3240]"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-zinc-400 italic font-semibold text-center py-4">
                    Please stage / recruit a model to apply facial expressions.
                  </div>
                )}
              </div>
            </div>

            {/* 2C: Bone Rotations and Skeleton Selection (Neon Teal) */}
            <div className="border-[#39c5bb]/20 border bg-[#121418] p-3 rounded-md shadow-md">
              <div className="h-7 bg-[#1c1e24] -mx-3 -mt-3 mb-2 px-2 flex items-center justify-between text-zinc-200 text-[10px] font-bold uppercase select-none rounded-t-md border-b border-[#2c3240]">
                <span className="flex items-center text-[#39c5bb]"><Bone className="w-3.5 h-3.5 mr-1" /> Bone Manipulation</span>
                <span className="text-zinc-500 text-[8px]">Coordinates</span>
              </div>

              <div className="space-y-3">
                {selectedModel ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Active Bone Node</label>
                      <select 
                        value={appState.selectedBoneId || ''}
                        onChange={(e) => onSelectBone(e.target.value || null)}
                        className="w-full bg-[#1e212a] border border-zinc-800 rounded text-xs font-bold p-1.5 px-2 outline-none text-zinc-150 focus:border-teal-500/50 transition-all shadow-inner"
                      >
                        <option value="">-- No Rig Selected --</option>
                        {selectedModel.bones.map(bone => (
                          <option key={bone.id} value={bone.id}>🌱 {bone.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedBone ? (
                      <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                        {/* Rot X */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                            <span>Rot X (Pitch angle)</span>
                            <span className="font-mono text-[#39c5bb] bg-[#1e212a] border border-zinc-800 px-1.5 font-bold text-[9px] rounded-sm">{selectedBone.rotationX}°</span>
                          </div>
                          <input 
                            type="range"
                            min="-180"
                            max="180"
                            value={selectedBone.rotationX}
                            onChange={(e) => onModifyBone(selectedModel.id, selectedBone.id, 'rotationX', parseInt(e.target.value))}
                            className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer border border-[#2c3240]"
                          />
                        </div>

                        {/* Rot Y */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                            <span>Rot Y (Yaw angle)</span>
                            <span className="font-mono text-[#39c5bb] bg-[#1e212a] border border-zinc-800 px-1.5 font-bold text-[9px] rounded-sm">{selectedBone.rotationY}°</span>
                          </div>
                          <input 
                            type="range"
                            min="-180"
                            max="180"
                            value={selectedBone.rotationY}
                            onChange={(e) => onModifyBone(selectedModel.id, selectedBone.id, 'rotationY', parseInt(e.target.value))}
                            className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer border border-[#2c3240]"
                          />
                        </div>

                        {/* Rot Z */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-zinc-300">
                            <span>Rot Z (Roll angle)</span>
                            <span className="font-mono text-[#39c5bb] bg-[#1e212a] border border-zinc-800 px-1.5 font-bold text-[9px] rounded-sm">{selectedBone.rotationZ}°</span>
                          </div>
                          <input 
                            type="range"
                            min="-180"
                            max="180"
                            value={selectedBone.rotationZ}
                            onChange={(e) => onModifyBone(selectedModel.id, selectedBone.id, 'rotationZ', parseInt(e.target.value))}
                            className="w-full accent-teal-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer border border-[#2c3240]"
                          />
                        </div>

                        <button 
                          onClick={() => {
                            onModifyBone(selectedModel.id, selectedBone.id, 'rotationX', 0);
                            onModifyBone(selectedModel.id, selectedBone.id, 'rotationY', 0);
                            onModifyBone(selectedModel.id, selectedBone.id, 'rotationZ', 0);
                          }}
                          className="w-full cursor-pointer bg-[#1e212a] border border-zinc-800 hover:bg-[#202532] hover:text-[#39c5bb] py-1.5 text-[10px] font-extrabold text-zinc-300 rounded transition-all text-center uppercase shadow-sm"
                        >
                          Reset Bone Node to 0°
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-400 italic font-medium text-center py-2.5 bg-zinc-900 border border-zinc-800 rounded-md">
                        💡 Click bone joints inside viewport or select above to begin posing.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-zinc-400 italic font-semibold text-center py-4">
                    Select a PMX character above to activate joints.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: PHYSICAL OPERATIONS (Retro Purple) */}
        {activeTab === 'physics' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            <div className="border-purple-500/25 border bg-[#121418] p-3 rounded-md shadow-md">
              <div className="h-7 bg-[#1c1e24] -mx-3 -mt-3 mb-2 px-2 flex items-center justify-between text-zinc-200 text-[10px] font-bold uppercase select-none rounded-t-md border-b border-[#2c3240]">
                <span className="flex items-center text-purple-400"><ShieldAlert className="w-3.5 h-3.5 mr-1" /> Physics Settings</span>
                <span className="text-zinc-500 text-[8px]">Bullet Solver</span>
              </div>
              
              <div className="space-y-4">
                <p className="text-[11px] font-semibold text-purple-305 leading-normal">
                  Toggle dynamic MMD hair flow, clothing solver physics boundaries, and rigging body constraints rules below:
                </p>

                <div className="space-y-2">
                  {/* Anytime */}
                  <div 
                    onClick={() => setPhysicsMode('anytime')}
                    className={`p-2.5 border rounded-md cursor-pointer select-none transition-all ${
                      appState.physicsMode === 'anytime'
                        ? 'bg-[#1b4332]/30 border-[#4ea86d]/65 text-emerald-400 font-bold shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                      <span>Anytime (Continuous)</span>
                      {appState.physicsMode === 'anytime' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 font-extrabold" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold">
                      Continuous gravity, body weight collision run continuously even on static screen.
                    </p>
                  </div>

                  {/* Playtime */}
                  <div 
                    onClick={() => setPhysicsMode('playtime')}
                    className={`p-2.5 border rounded-md cursor-pointer select-none transition-all ${
                      appState.physicsMode === 'playtime'
                        ? 'bg-[#3d191c]/30 border-[#df1846]/65 text-[#df1846] font-bold shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                      <span>Only on Playback</span>
                      {appState.physicsMode === 'playtime' && <CheckCircle2 className="w-3.5 h-3.5 text-[#df1846] font-extrabold" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold">
                      Run physics solver during playback only. Great for accurate, slow frame skeleton design.
                    </p>
                  </div>

                  {/* Off */}
                  <div 
                    onClick={() => setPhysicsMode('off')}
                    className={`p-2.5 border rounded-md cursor-pointer select-none transition-all ${
                      appState.physicsMode === 'off'
                        ? 'bg-zinc-950 border-purple-500/40 text-purple-400 font-bold shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                      <span>Off (Static Joint Pose)</span>
                      {appState.physicsMode === 'off' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold">
                      Rig is strictly frozen. Poses are completely absolute with no physics displacement.
                    </p>
                  </div>
                </div>

                {ammoBroken && (
                  <p className="text-[10px] font-bold text-amber-400/90 bg-amber-950/30 border border-amber-600/30 rounded-md px-2 py-1.5">
                    Bullet disabled (OOM). Refresh the page to retry.
                  </p>
                )}

                <div className="bg-zinc-950/40 border border-[#2c3240] rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 border-b border-zinc-800 pb-1.5">
                    <span>MMD Physics Lite</span>
                    <Settings className="w-3.5 h-3.5 text-purple-400" />
                  </div>

                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lite.stablePhys}
                      onChange={(e) => onPatchMmdLite({ stablePhys: e.target.checked })}
                      className="accent-purple-500"
                    />
                    Stable 65 Hz / 3 substeps (recommended)
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                      <span>Gravity ×</span>
                      <span className="font-mono text-emerald-400">{lite.physicsGravity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={2}
                      step={0.05}
                      value={lite.physicsGravity}
                      onChange={(e) => onPatchMmdLite({ physicsGravity: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                      <span>Hair swing</span>
                      <span className="font-mono text-purple-400">{lite.physicsSwing.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.55}
                      step={0.01}
                      value={lite.physicsSwing}
                      onChange={(e) => onPatchMmdLite({ physicsSwing: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                      <span>Wind</span>
                      <span className="font-mono text-cyan-400">{lite.physicsWind.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={0.5}
                      value={lite.physicsWind}
                      onChange={(e) => onPatchMmdLite({ physicsWind: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                  </label>

                  <label className="block space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                      <span>Model opacity</span>
                      <span className="font-mono text-zinc-300">{lite.modelOpacity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.01}
                      value={lite.modelOpacity}
                      onChange={(e) => onPatchMmdLite({ modelOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-zinc-400"
                    />
                  </label>

                  <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lite.freezeTwistBones}
                      onChange={(e) => onPatchMmdLite({ freezeTwistBones: e.target.checked })}
                      className="accent-purple-500"
                    />
                    Freeze twist bones (捩)
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pro' && onApplyKeyframes && onUpdateAnimLayers && (
          <AdvancedStudioPanel
            selectedModel={selectedModel}
            maxFrames={maxFrames}
            collabConnected={collabConnected}
            collabRoom={collabRoom}
            collabPeers={collabPeers}
            collabStatus={collabStatus}
            onCollabJoin={(r, m) => onCollabJoin?.(r, m)}
            onCollabLeave={() => onCollabLeave?.()}
            onApplyKeyframes={onApplyKeyframes}
            onUpdateLayers={onUpdateAnimLayers}
            onToggleGroupSolo={(id) => onToggleGroupSolo?.(id)}
            onToggleGroupMute={(id) => onToggleGroupMute?.(id)}
          />
        )}

        {activeTab === 'editor' && selectedModel && (
          <div className="space-y-3">
            <div className="bg-[#121418] border border-violet-500/20 rounded-md p-2">
              <div className="text-[10px] font-bold text-violet-300 mb-2">Bones (PMX)</div>
              <BoneHierarchyPanel
                bones={selectedModel.pmxBones ?? []}
                selectedBoneName={appState.selectedBoneId}
                boneGroups={selectedModel.boneGroups ?? []}
                mutedGroups={new Set()}
                onSelectBone={(name) => onSelectPmxBone?.(name)}
                onToggleGroupMute={() => {}}
              />
            </div>
            <div className="bg-[#121418] border border-violet-500/20 rounded-md p-2">
              <div className="text-[10px] font-bold text-violet-300 mb-2">Materials</div>
              <MaterialsPanel
                materials={selectedModel.pmxMaterials ?? []}
                selectedMaterial={highlightMaterial ?? null}
                onSelectMaterial={(n) => onSelectMaterial?.(n)}
              />
            </div>
            {selectedModel.pmxMorphs && selectedModel.pmxMorphs.length > 0 && (
              <div className="bg-[#121418] border border-zinc-800 rounded-md p-2 max-h-32 overflow-y-auto">
                <div className="text-[10px] font-bold text-zinc-400 mb-1">
                  Morphs ({selectedModel.pmxMorphs.length})
                </div>
                {selectedModel.pmxMorphs.slice(0, 40).map((m) => (
                  <div key={m.name} className="text-[9px] text-zinc-500 truncate py-0.5">
                    {m.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Loaded Model Status Card inside Sidebar Footer */}
      {selectedModel && (
        <div className="p-3 border-t border-zinc-800 bg-[#121418] flex items-center justify-between text-xs rounded-b-md shadow-inner">
          <div className="font-sans">
            <div className="text-zinc-150 font-bold truncate w-40">{selectedModel.name}</div>
            <div className="text-[10px] text-zinc-400 font-bold font-mono">
              {selectedModel.keyframes.length} keyframes recorded
            </div>
          </div>
          <button 
            onClick={() => onRegisterKeyframe(selectedModel.id)}
            className="cursor-pointer text-[9px] font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:brightness-110 px-3 py-1.5 transition-all shadow-md rounded-md"
          >
            KEYFRAME+
          </button>
        </div>
      )}
    </aside>
  );
}
