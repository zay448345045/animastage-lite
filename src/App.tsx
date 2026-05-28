import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
import TopMenu from './components/TopMenu';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import { BoneTransformUpdate, type MMDModelApi } from './components/MMDModelWrapper';
import {
  AppState,
  MMDModel,
  BoneState,
  MorphState,
  CameraSnapshot,
  ViewportFormat,
  SceneBackgroundSettings,
  PhysicsMode,
  DEFAULT_MMD_LITE_CONFIG,
  MmdLiteConfig,
} from './types';
import { revokeFileMapUrls } from './utils/mmdFiles';
import { playheadRef, MMD_FPS, setPlayheadFrame } from './utils/playhead';
import { createEmptyKeyframes } from './components/TimelineLogic';
import { createEmptyCameraKeyframes } from './components/CameraLogic';
import { CINEMATIC_VERTICAL_FX, DEFAULT_VISUAL_FX } from './templates/animationTemplates';
import { DEFAULT_CAMERA_STUDIO } from './camera/cameraStudioDefaults';
import { portraitRecommendedQuality } from './utils/characterQuality';
import { DEFAULT_RTX_SETTINGS } from './utils/rtxSettings';
import type { CharacterQuality, RtxSettings } from './types';
import { useTimeline } from './hooks/useTimeline';
import { useVideoRecorder } from './hooks/useVideoRecorder';
import RecordingHud from './components/RecordingHud';
import EditorTimelineShell from './components/editor/EditorTimelineShell';
import { useClipEditor } from './hooks/useClipEditor';
import { useEditorDocument } from './hooks/useEditorDocument';
import { useEditorKeyboard } from './hooks/useEditorKeyboard';
import type { AnimationLayerDef, TimelineKeyframe, TimelineTrackId } from './types';
import { mergeTimelineKeyframes } from './components/TimelineLogic';
import { useCollab } from './hooks/useCollab';
import type { CollabClipPayload } from './collab/collabSync';

// Standard Bones preset
const DEFAULT_BONES: BoneState[] = [
  { id: 'head', name: 'Head Rig', rotationX: 0, rotationY: 0, rotationZ: 0 },
  { id: 'neck', name: 'Neck Rig', rotationX: 0, rotationY: 0, rotationZ: 0 },
  { id: 'spine', name: 'Upper Body', rotationX: 0, rotationY: 0, rotationZ: 0 },
  { id: 'waist', name: 'Hips / Waist', rotationX: 0, rotationY: 0, rotationZ: 0 },
  { id: 'arm_L', name: 'Left Shoulder', rotationX: 0, rotationY: 0, rotationZ: 0 },
  { id: 'arm_R', name: 'Right Shoulder', rotationX: 0, rotationY: 0, rotationZ: 0 },
];

// Standard Morphs preset
const DEFAULT_MORPHS: MorphState = {
  eyes: 0,
  mouth: 0.1,
  brow: 0,
};

export default function App() {
  // App primary state
  const [appState, setAppState] = useState<AppState>({
    objects: [
      { id: 'camera_main', name: 'Main Camera [Orbit]', type: 'camera', visible: true },
      { id: 'light_directional', name: 'Directional Light [Sun]', type: 'light', visible: true },
    ],
    models: [],
    selectedObjectId: null,
    selectedBoneId: null,
    currentFrame: 0,
    maxFrames: 120,
    isPlaying: false,
    physicsMode: 'anytime',
    mmdLite: { ...DEFAULT_MMD_LITE_CONFIG },
    playSpeed: 30, // 30 Frames Per Second
    timelineActiveTrack: null,
    cameraMode: 'free',
    cameraKeyframes: createEmptyCameraKeyframes(),
    cameraVmdBlobUrl: null,
    cameraVmdFileName: null,
    hasCameraVmd: false,
    visualFx: { ...DEFAULT_VISUAL_FX },
    sceneBackground: { imageUrl: null, opacity: 1 },
    characterQuality: 'hd',
    rtxModeEnabled: false,
    rtxSettings: { ...DEFAULT_RTX_SETTINGS },
    renderTier: 'lite',
    cameraStudio: { ...DEFAULT_CAMERA_STUDIO },
    sceneHdr: { blobUrl: null, fileName: null, intensity: 1, showBackground: false },
  });

  const captureCameraRef = useRef<(() => CameraSnapshot | null) | null>(null);
  const flyToCameraRef = useRef<((snapshot: CameraSnapshot) => void) | null>(null);
  const modelApiRef = useRef<MMDModelApi | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const invalidateSceneRef = useRef<(() => void) | null>(null);
  const [highlightMaterial, setHighlightMaterial] = useState<string | null>(null);
  const clipEditor = useClipEditor();

  // UI responsive styling state
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showTimelinePanel, setShowTimelinePanel] = useState(true);

  // Viewport setup states (passed to TopMenu & Viewport)
  const [showGrid, setShowGrid] = useState(true);
  const [showBones, setShowBones] = useState(true);
  const [showCameraHelper, setShowCameraHelper] = useState(false);
  const [showPhysicsBodies, setShowPhysicsBodies] = useState(false);
  const [viewportFormat, setViewportFormat] = useState<ViewportFormat>('16:9');
  const pre916VisualFxRef = useRef(appState.visualFx);
  const pre916QualityRef = useRef<CharacterQuality>(appState.characterQuality);
  const pre916RtxRef = useRef({
    enabled: appState.rtxModeEnabled,
    settings: appState.rtxSettings,
  });

  const handleViewportFormatChange = (format: ViewportFormat) => {
    if (format === viewportFormat) return;
    if (format === '9:16') {
      pre916VisualFxRef.current = appState.visualFx;
      pre916QualityRef.current = appState.characterQuality;
      pre916RtxRef.current = {
        enabled: appState.rtxModeEnabled,
        settings: appState.rtxSettings,
      };
      setAppState((s) => ({
        ...s,
        visualFx: {
          ...s.visualFx,
          ...CINEMATIC_VERTICAL_FX,
          bloomEnabled: false,
          dofEnabled: false,
        },
        characterQuality: portraitRecommendedQuality(s.characterQuality),
        rtxModeEnabled: false,
      }));
    } else {
      setAppState((s) => ({
        ...s,
        visualFx: { ...pre916VisualFxRef.current },
        characterQuality: pre916QualityRef.current,
        rtxModeEnabled: pre916RtxRef.current.enabled,
        rtxSettings: pre916RtxRef.current.settings,
      }));
    }
    setViewportFormat(format);
  };

  const handleSceneHdr = (patch: Partial<import('./types').SceneHdrSettings>) => {
    setAppState((s) => {
      const prev = s.sceneHdr.blobUrl;
      if (patch.blobUrl === null && prev?.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return {
        ...s,
        sceneHdr: { ...s.sceneHdr, ...patch },
      };
    });
  };

  const handleHdrFileDrop = useCallback((blobUrl: string, fileName: string) => {
    setAppState((s) => {
      if (s.sceneHdr.blobUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(s.sceneHdr.blobUrl);
      }
      return {
        ...s,
        sceneHdr: {
          blobUrl,
          fileName,
          intensity: s.sceneHdr.intensity,
          showBackground: s.sceneHdr.showBackground,
        },
      };
    });
  }, []);

  const handlePatchMmdLite = (patch: Partial<MmdLiteConfig>) => {
    setAppState((s) => ({
      ...s,
      mmdLite: { ...s.mmdLite, ...patch },
    }));
  };

  const handlePatchRtxSettings = (patch: Partial<RtxSettings>) => {
    setAppState((s) => ({
      ...s,
      rtxSettings: { ...s.rtxSettings, ...patch },
    }));
  };

  const {
    setCurrentFrame: handleSetCurrentFrame,
    setMaxFrames: handleSetMaxFrames,
    setIsPlaying: handleSetIsPlaying,
    handleRegisterKeyframe,
    handleDeleteKeyframe,
    handleAddSampleKeyframes,
    handleApplyTemplate,
    handleClearAllKeyframes,
    setTimelineActiveTrack,
    setCameraMode,
    setVisualFx,
  } = useTimeline({ appState, setAppState, captureCameraRef });

  const editor = useEditorDocument(appState, setAppState, clipEditor, {
    setCurrentFrame: handleSetCurrentFrame,
    setIsPlaying: handleSetIsPlaying,
    setTimelineActiveTrack,
    handleDeleteKeyframe,
  });

  useEffect(() => {
    const dirty = appState.models.some((m) => m.clipDirty);
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [appState.models]);

  useEditorKeyboard({
    enabled: true,
    maxFrames: appState.maxFrames,
    onPlayPause: () => handleSetIsPlaying(!appState.isPlaying),
    onStepFrame: editor.stepFrame,
    onJumpStart: () => handleSetCurrentFrame(0),
    onJumpEnd: () => handleSetCurrentFrame(appState.maxFrames),
    onUndo: editor.handleUndo,
    onRedo: editor.handleRedo,
    onCopy: editor.handleCopy,
    onPaste: editor.handlePaste,
    onMirrorPaste: editor.handleMirrorPaste,
    onDeleteKey: editor.handleDeleteAtPlayhead,
  });

  const videoRecorder = useVideoRecorder({
    getCanvas: () => glCanvasRef.current,
    invalidateScene: () => invalidateSceneRef.current?.(),
    maxFrames: appState.maxFrames,
    viewportFormat,
    setCurrentFrame: handleSetCurrentFrame,
    setIsPlaying: handleSetIsPlaying,
  });

  const handleRenderMp4 = useCallback(() => {
    if (videoRecorder.busy && videoRecorder.mode === 'offline') {
      videoRecorder.cancel();
    } else {
      void videoRecorder.startOffline();
    }
  }, [videoRecorder]);

  const handleLiveRecord = useCallback(() => {
    if (videoRecorder.mode === 'live') {
      videoRecorder.stopLive();
    } else {
      videoRecorder.startLive();
    }
  }, [videoRecorder]);

  const handleRemoteCollabClip = useCallback(
    (payload: CollabClipPayload) => {
      setAppState((prev) => ({
        ...prev,
        maxFrames: Math.max(prev.maxFrames, payload.maxFrames),
        currentFrame: payload.currentFrame,
        isPlaying: payload.isPlaying,
        models: prev.models.map((m) =>
          m.id === payload.modelId
            ? { ...m, keyframes: payload.keyframes, clipDirty: true, vmdPlaybackEnabled: false }
            : m
        ),
      }));
      setPlayheadFrame(payload.currentFrame);
    },
    []
  );

  const handleRemoteCollabTransport = useCallback(
    (frame: number, playing: boolean) => {
      setPlayheadFrame(frame);
      setAppState((prev) => ({ ...prev, currentFrame: frame, isPlaying: playing }));
    },
    []
  );

  const collab = useCollab(handleRemoteCollabClip, handleRemoteCollabTransport);
  const collabBroadcastClip = collab.broadcastClip;
  const collabBroadcastTransport = collab.broadcastTransport;

  const selectedModelId = appState.selectedObjectId;
  const selectedModelKeyframes =
    appState.models.find((m) => m.id === selectedModelId)?.keyframes ?? null;

  useEffect(() => {
    if (!collab.connected || !selectedModelId || !selectedModelKeyframes) return;

    const timer = window.setTimeout(() => {
      const model = appState.models.find((m) => m.id === selectedModelId);
      if (!model) return;
      collabBroadcastClip({
        modelId: model.id,
        keyframes: model.keyframes,
        maxFrames: appState.maxFrames,
        currentFrame: Math.floor(playheadRef.current),
        isPlaying: appState.isPlaying,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    collab.connected,
    selectedModelId,
    selectedModelKeyframes,
    appState.maxFrames,
    collabBroadcastClip,
    appState.models,
  ]);

  useEffect(() => {
    if (!collab.connected || !appState.isPlaying) return;
    const timer = window.setInterval(() => {
      collabBroadcastTransport(Math.floor(playheadRef.current), true);
    }, 500);
    return () => clearInterval(timer);
  }, [collab.connected, appState.isPlaying, collabBroadcastTransport]);

  const handleApplyKeyframes = useCallback(
    (incoming: TimelineKeyframe[], mode: 'merge' | 'replace') => {
      const id = appState.selectedObjectId;
      if (!id) return;
      setAppState((prev) => ({
        ...prev,
        models: prev.models.map((m) => {
          if (m.id !== id) return m;
          const keyframes =
            mode === 'merge' ? mergeTimelineKeyframes(m.keyframes, incoming) : incoming;
          return {
            ...m,
            keyframes,
            clipDirty: true,
            vmdPlaybackEnabled: false,
          };
        }),
      }));
    },
    [appState.selectedObjectId, setAppState]
  );

  const handleUpdateAnimLayers = useCallback(
    (layers: AnimationLayerDef[]) => {
      const id = appState.selectedObjectId;
      if (!id) return;
      setAppState((prev) => ({
        ...prev,
        models: prev.models.map((m) =>
          m.id === id ? { ...m, animLayers: layers, clipDirty: true } : m
        ),
      }));
    },
    [appState.selectedObjectId, setAppState]
  );

  const handleToggleGroupSolo = useCallback(
    (groupId: string) => {
      const id = appState.selectedObjectId;
      if (!id) return;
      setAppState((prev) => ({
        ...prev,
        models: prev.models.map((m) => {
          if (m.id !== id || !m.boneGroups) return m;
          return {
            ...m,
            boneGroups: m.boneGroups.map((g) => ({
              ...g,
              solo: g.id === groupId ? !g.solo : false,
            })),
          };
        }),
      }));
    },
    [appState.selectedObjectId, setAppState]
  );

  const handleToggleGroupMute = useCallback(
    (groupId: string) => {
      const id = appState.selectedObjectId;
      if (!id) return;
      setAppState((prev) => ({
        ...prev,
        models: prev.models.map((m) => {
          if (m.id !== id || !m.boneGroups) return m;
          return {
            ...m,
            boneGroups: m.boneGroups.map((g) =>
              g.id === groupId ? { ...g, muted: !g.muted } : g
            ),
          };
        }),
      }));
    },
    [appState.selectedObjectId, setAppState]
  );

  // Load standard models
  const handleLoadModel = (preset: 'miku' | 'kizuna' | 'custom') => {
    let name = 'Hatsune Miku (Append)';
    if (preset === 'kizuna') name = 'Kizuna AI (Official)';
    if (preset === 'custom') name = 'Custom Model Rig (.pmx)';

    const newId = `model_${Date.now()}`;
    const newModel: MMDModel = {
      id: newId,
      name,
      type: preset === 'custom' ? 'custom' : preset,
      visible: true,
      morphs: { ...DEFAULT_MORPHS },
      bones: JSON.parse(JSON.stringify(DEFAULT_BONES)),
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      keyframes: createEmptyKeyframes(),
    };

    setAppState(prev => ({
      ...prev,
      models: [...prev.models, newModel],
      selectedObjectId: newId,
      selectedBoneId: 'head',
      objects: [...prev.objects, { id: newId, name, type: 'model', visible: true }]
    }));
  };

  // Handle dynamically uploaded custom user models (via FileUploader)
  const handleLoadCustomModel = (data: {
    name: string;
    blobUrl: string;
    modelFileName?: string;
    manager: any;
    fileMap: Record<string, string>;
    vmdBlobUrls?: string[];
    vmdFileNames?: string[];
    cameraVmdBlobUrl?: string | null;
    cameraVmdFileName?: string | null;
    hasCameraVmd?: boolean;
  }) => {
    const newId = `model_${Date.now()}`;
    const hasVmd = (data.vmdBlobUrls?.length ?? 0) > 0;
    const hasCameraVmd = data.hasCameraVmd ?? false;
    const newModel: MMDModel = {
      id: newId,
      name: data.name,
      type: 'custom',
      visible: true,
      morphs: { ...DEFAULT_MORPHS },
      bones: JSON.parse(JSON.stringify(DEFAULT_BONES)),
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      keyframes: createEmptyKeyframes(),
      blobUrl: data.blobUrl,
      modelFileName: data.modelFileName,
      customManager: data.manager,
      fileMap: data.fileMap,
      vmdBlobUrls: data.vmdBlobUrls,
      vmdFileNames: data.vmdFileNames,
      hasVmdAnimation: hasVmd,
      vmdPlaybackEnabled: hasVmd ? true : undefined,
      activeVmdIndex: 0,
    };

    setPlayheadFrame(0);

    setAppState(prev => ({
      ...prev,
      models: [...prev.models, newModel],
      selectedObjectId: newId,
      selectedBoneId: 'head',
      isPlaying: false,
      currentFrame: 0,
      cameraVmdBlobUrl: hasCameraVmd ? data.cameraVmdBlobUrl ?? null : prev.cameraVmdBlobUrl,
      cameraVmdFileName: hasCameraVmd ? data.cameraVmdFileName ?? null : prev.cameraVmdFileName,
      hasCameraVmd: hasCameraVmd || prev.hasCameraVmd,
      cameraMode: prev.cameraMode,
      objects: [...prev.objects, { id: newId, name: data.name, type: 'model', visible: true }]
    }));
  };

  const handleModelAnimationLoaded = (modelId: string, frameCount: number) => {
    setPlayheadFrame(0);
    setAppState((prev) => {
      const model = prev.models.find((m) => m.id === modelId);
      if (!model?.hasVmdAnimation || model.vmdPlaybackEnabled === false) return prev;

      const maxFrames = Math.max(10, frameCount);
      const isSelected = prev.selectedObjectId === modelId;

      if (!isSelected) {
        return { ...prev, maxFrames: Math.max(prev.maxFrames, maxFrames) };
      }

      return {
        ...prev,
        maxFrames,
        currentFrame: 0,
        isPlaying: true,
      };
    });
  };

  const handleSetVmdPlaybackEnabled = (modelId: string, enabled: boolean) => {
    setPlayheadFrame(0);
    setAppState((prev) => {
      const model = prev.models.find((m) => m.id === modelId);
      if (!model?.hasVmdAnimation) return prev;

      const models = prev.models.map((m) =>
        m.id === modelId ? { ...m, vmdPlaybackEnabled: enabled, ...(enabled ? { activeTemplateId: null } : {}) } : m
      );

      if (prev.selectedObjectId !== modelId) {
        return { ...prev, models };
      }

      const hasTimeline = model.keyframes.length > 0;
      return {
        ...prev,
        models,
        currentFrame: 0,
        isPlaying: enabled ? true : hasTimeline ? prev.isPlaying : false,
      };
    });
  };

  // Clear scene back to empty voids
  const handleClearScene = () => {
    setAppState(prev => {
      prev.models.forEach(m => {
        if (m.fileMap) revokeFileMapUrls(m.fileMap);
      });
      return {
        ...prev,
        models: [],
        selectedObjectId: null,
        selectedBoneId: null,
        objects: prev.objects.filter(obj => obj.type !== 'model')
      };
    });
  };

  // Toggle visible rules
  const handleToggleVisibility = (id: string, type: 'model' | 'other') => {
    if (type === 'model') {
      setAppState(prev => ({
        ...prev,
        models: prev.models.map(m => m.id === id ? { ...m, visible: !m.visible } : m)
      }));
    } else {
      setAppState(prev => ({
        ...prev,
        objects: prev.objects.map(o => o.id === id ? { ...o, visible: !o.visible } : o)
      }));
    }
  };

  // Delete model
  const handleDeleteModel = (id: string) => {
    setAppState(prev => {
      const modelToRemove = prev.models.find(m => m.id === id);
      if (modelToRemove?.fileMap) {
        revokeFileMapUrls(modelToRemove.fileMap);
      }
      const remainingModels = prev.models.filter(m => m.id !== id);
      return {
        ...prev,
        models: remainingModels,
        selectedObjectId: prev.selectedObjectId === id ? (remainingModels[0]?.id || null) : prev.selectedObjectId,
        objects: prev.objects.filter(obj => obj.id !== id)
      };
    });
  };

  // Modify active facial morph sliders
  const handleModifyMorphs = (modelId: string, morphName: 'eyes' | 'mouth' | 'brow', value: number) => {
    setAppState(prev => ({
      ...prev,
      models: prev.models.map(m => {
        if (m.id === modelId) {
          return {
            ...m,
            morphs: {
              ...m.morphs,
              [morphName]: value
            }
          };
        }
        return m;
      })
    }));
  };

  // Modify active skeletal bone rotations
  const handleModifyBone = (
    modelId: string, 
    boneId: string, 
    axes: 'rotationX' | 'rotationY' | 'rotationZ', 
    value: number
  ) => {
    setAppState(prev => ({
      ...prev,
      models: prev.models.map(m => {
        if (m.id === modelId) {
          return {
            ...m,
            bones: m.bones.map(b => b.id === boneId ? { ...b, [axes]: value } : b)
          };
        }
        return m;
      })
    }));
  };

  const handleBoneTransform = (
    modelId: string,
    boneId: string,
    update: BoneTransformUpdate
  ) => {
    setAppState(prev => ({
      ...prev,
      models: prev.models.map(m => {
        if (m.id !== modelId) return m;

        const existingBone = m.bones.find((b) => b.id === boneId);
        if (existingBone) {
          return {
            ...m,
            bones: m.bones.map((b) =>
              b.id === boneId
                ? {
                    ...b,
                    rotationX: update.rotationX ?? b.rotationX,
                    rotationY: update.rotationY ?? b.rotationY,
                    rotationZ: update.rotationZ ?? b.rotationZ,
                  }
                : b
            ),
          };
        }

        return {
          ...m,
          bones: [
            ...m.bones,
            {
              id: boneId,
              name: boneId,
              rotationX: update.rotationX ?? 0,
              rotationY: update.rotationY ?? 0,
              rotationZ: update.rotationZ ?? 0,
            },
          ],
        };
      }),
      selectedBoneId: boneId,
    }));
  };

  const handleModelMove = (modelId: string, x: number, y: number, z: number) => {
    setAppState((prev) => ({
      ...prev,
      models: prev.models.map((m) =>
        m.id === modelId ? { ...m, positionX: x, positionY: y, positionZ: z } : m
      ),
    }));
  };

  const handleModifyModelPosition = (
    modelId: string,
    axis: 'positionX' | 'positionY' | 'positionZ',
    value: number
  ) => {
    setAppState((prev) => ({
      ...prev,
      models: prev.models.map((m) =>
        m.id === modelId ? { ...m, [axis]: value } : m
      ),
    }));
  };

  const handlePatchSceneBackground = (patch: Partial<SceneBackgroundSettings>) => {
    setAppState((prev) => {
      const prevUrl = prev.sceneBackground.imageUrl;
      if (
        patch.imageUrl &&
        prevUrl &&
        prevUrl !== patch.imageUrl &&
        prevUrl.startsWith('blob:')
      ) {
        URL.revokeObjectURL(prevUrl);
      }
      return {
        ...prev,
        sceneBackground: { ...prev.sceneBackground, ...patch },
      };
    });
  };

  const handleClearSceneBackground = () => {
    setAppState((prev) => {
      const url = prev.sceneBackground.imageUrl;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
      return {
        ...prev,
        sceneBackground: { imageUrl: null, opacity: 1 },
      };
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121418] font-sans cursor-default overflow-hidden text-zinc-100" id="mmd-workspace-main">
      {/* 1. Header Navigation Workspace Bar */}
      <TopMenu 
        physicsMode={appState.physicsMode}
        setPhysicsMode={(mode) => setAppState(prev => ({ ...prev, physicsMode: mode }))}
        onLoadModel={handleLoadModel}
        onClearScene={handleClearScene}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        showBones={showBones}
        setShowBones={setShowBones}
        showCameraHelper={showCameraHelper}
        setShowCameraHelper={setShowCameraHelper}
        showPhysicsBodies={showPhysicsBodies}
        setShowPhysicsBodies={setShowPhysicsBodies}
        onAddSampleKeyframes={handleAddSampleKeyframes}
        onApplyTemplate={handleApplyTemplate}
        visualFx={appState.visualFx}
        onSetVisualFx={setVisualFx}
        rtxModeEnabled={appState.rtxModeEnabled}
        onSetRtxModeEnabled={(rtxModeEnabled) =>
          setAppState((s) => ({ ...s, rtxModeEnabled }))
        }
        characterQuality={appState.characterQuality}
        onCharacterQualityChange={(characterQuality) =>
          setAppState((s) => ({ ...s, characterQuality }))
        }
        rtxSettings={appState.rtxSettings}
        onPatchRtxSettings={handlePatchRtxSettings}
        mmdLite={appState.mmdLite}
        onPatchMmdLite={handlePatchMmdLite}
        captureCamera={() => captureCameraRef.current?.() ?? null}
        onFlyToBookmark={(snapshot) => {
          setCameraMode('free');
          flyToCameraRef.current?.(snapshot);
        }}
        onRestartPhysics={() => modelApiRef.current?.restartPhysics()}
        videoRecordBusy={videoRecorder.busy}
        videoRecordMode={videoRecorder.mode}
        onRenderMp4={handleRenderMp4}
        onLiveRecord={handleLiveRecord}
        onExportVmd={editor.handleExportVmd}
        onNewClip={editor.handleNewClip}
        onUndo={editor.handleUndo}
        onRedo={editor.handleRedo}
        onSimplifyTrack={editor.handleSimplifyTrack}
        onClearTrack={editor.handleClearTrack}
        onTimeStretch125={() => editor.handleTimeStretch(1.25)}
        onTimeStretch080={() => editor.handleTimeStretch(0.8)}
        viewportFormat={viewportFormat}
        selectedModelHasVmd={Boolean(
          appState.models.find((m) => m.id === appState.selectedObjectId)?.hasVmdAnimation
        )}
        vmdPlaybackEnabled={
          appState.models.find((m) => m.id === appState.selectedObjectId)?.vmdPlaybackEnabled !== false
        }
        onToggleVmdPlayback={() => {
          const id = appState.selectedObjectId;
          if (!id) return;
          const model = appState.models.find((m) => m.id === id);
          if (!model?.hasVmdAnimation) return;
          const currentlyOn = model.vmdPlaybackEnabled !== false;
          handleSetVmdPlaybackEnabled(id, !currentlyOn);
        }}
      />

      {/* 2. Middle section (Sidebar + Viewport) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Toggle left collapse handle */}
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#1a1d24] border border-[#2c3240] p-1.5 text-zinc-400 hover:text-[#39c5bb] hover:border-[#39c5bb]/40 z-30 transition-all shadow-md cursor-pointer"
          title={showLeftSidebar ? "Collapse panel" : "Expand panel"}
        >
          {showLeftSidebar ? <ChevronLeft className="w-4 h-4 font-bold" /> : <ChevronRight className="w-4 h-4 font-bold" />}
        </button>

        {/* Dynamic Sidebar column */}
        {showLeftSidebar && (
          <Sidebar 
            appState={appState}
            onSelectModel={(id) => setAppState(prev => ({ ...prev, selectedObjectId: id }))}
            onSelectBone={(id) => setAppState(prev => ({ ...prev, selectedBoneId: id }))}
            onToggleVisibility={handleToggleVisibility}
            onDeleteModel={handleDeleteModel}
            onModifyMorphs={handleModifyMorphs}
            onModifyBone={handleModifyBone}
            onModifyModelPosition={handleModifyModelPosition}
            onRegisterKeyframe={handleRegisterKeyframe}
            onLoadModel={handleLoadModel}
            onLoadCustomModel={handleLoadCustomModel}
            setPhysicsMode={(mode) => setAppState(prev => ({ ...prev, physicsMode: mode }))}
            onSetVmdPlaybackEnabled={handleSetVmdPlaybackEnabled}
            onPatchMmdLite={handlePatchMmdLite}
            highlightMaterial={highlightMaterial}
            onSelectMaterial={setHighlightMaterial}
            onSelectPmxBone={editor.handleSelectPmxBone}
            collabConnected={collab.connected}
            collabRoom={collab.roomId}
            collabPeers={collab.peers}
            collabStatus={collab.status}
            onCollabJoin={collab.join}
            onCollabLeave={collab.leave}
            onApplyKeyframes={handleApplyKeyframes}
            onUpdateAnimLayers={handleUpdateAnimLayers}
            onToggleGroupSolo={handleToggleGroupSolo}
            onToggleGroupMute={handleToggleGroupMute}
            maxFrames={appState.maxFrames}
          />
        )}

        {/* Main 3D staging platform column */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          <Viewport 
            appState={appState}
            mmdLite={appState.mmdLite}
            viewportFormat={viewportFormat}
            onViewportFormatChange={handleViewportFormatChange}
            onSetIsPlaying={handleSetIsPlaying}
            onSetCurrentFrame={handleSetCurrentFrame}
            onApplyAnimationTemplate={handleApplyTemplate}
            sceneBackground={appState.sceneBackground}
            onPatchSceneBackground={handlePatchSceneBackground}
            onClearSceneBackground={handleClearSceneBackground}
            showGrid={showGrid}
            showBones={showBones}
            showCameraHelper={showCameraHelper}
            showPhysicsBodies={showPhysicsBodies}
            onSelectBone={(id) => setAppState(prev => ({ ...prev, selectedBoneId: id }))}
            onBoneTransform={handleBoneTransform}
            onModelMove={handleModelMove}
            onLoadCustomModel={handleLoadCustomModel}
            onModelAnimationLoaded={handleModelAnimationLoaded}
            captureCameraRef={captureCameraRef}
            flyToCameraRef={flyToCameraRef}
            modelApiRef={modelApiRef}
            sceneHdr={appState.sceneHdr}
            onHdrFileDrop={handleHdrFileDrop}
            onSetCameraMode={setCameraMode}
            isRecordingVideo={videoRecorder.isRecording}
            onRecordingTick={videoRecorder.tickLiveRecord}
            onGlCanvasReady={(canvas) => {
              glCanvasRef.current = canvas;
            }}
            onInvalidateReady={(fn) => {
              invalidateSceneRef.current = fn;
            }}
            highlightMaterialName={highlightMaterial}
            onPmxMetadataLoaded={editor.handlePmxMetadata}
          />

          <RecordingHud
            visible={videoRecorder.isRecording}
            progress={videoRecorder.progress}
            mode={videoRecorder.mode}
            onCancel={videoRecorder.cancel}
          />

          {/* Collapsible helper for horizontal timeline */}
          {showTimelinePanel && (
            <EditorTimelineShell
              appState={appState}
              setCurrentFrame={handleSetCurrentFrame}
              setMaxFrames={handleSetMaxFrames}
              setIsPlaying={handleSetIsPlaying}
              onRegisterKeyframe={handleRegisterKeyframe}
              onDeleteKeyframe={handleDeleteKeyframe}
              onSelectTrack={setTimelineActiveTrack}
              onApplyTemplate={handleApplyTemplate}
              onClearAllKeyframes={handleClearAllKeyframes}
              onMoveKeyframe={editor.handleMoveKeyframe}
              onPatchKeyframe={editor.handlePatchKeyframe}
              activeTrack={
                appState.timelineActiveTrack &&
                appState.timelineActiveTrack !== 'camera'
                  ? (appState.timelineActiveTrack as TimelineTrackId)
                  : null
              }
            />
          )}

          {/* Toggle timeline collapse handle */}
          <button
            onClick={() => setShowTimelinePanel(!showTimelinePanel)}
            className="absolute bottom-4 right-4 bg-[#1a1d24] border border-[#2c3240] py-1.5 px-3 text-xs font-bold text-zinc-300 hover:text-[#39c5bb] hover:border-[#39c5bb]/40 active:bg-[#121418] z-20 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            {showTimelinePanel ? 'Hide Timeline panel' : 'Show Timeline panel'}
          </button>

        </div>

      </div>

    </div>
  );
}
