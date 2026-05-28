import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Key,
  Trash2,
  ListFilter,
  Layers,
} from 'lucide-react';
import { AppState, TimelineTrackId, TimelineActiveTrack, TemplateApplyMode } from '../types';
import {
  TIMELINE_TRACK_IDS,
  TIMELINE_TRACK_LABELS,
  countTimelineKeyframes,
  getKeyframesForTrack,
} from './TimelineLogic';
import { countCameraKeyframes } from './CameraLogic';
import TemplatePicker from './TemplatePicker';
import { DANCE_PICKER_CATEGORIES, CHARACTER_PICKER_CATEGORIES } from '../templates/animationTemplates';
import { playheadRef, MMD_FPS } from '../utils/playhead';

const FRAME_WIDTH = 24;
const VIRTUAL_BUFFER = 40;

function useVisibleFrameRange(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  maxFrames: number
) {
  const [range, setRange] = useState({ start: 0, end: Math.min(maxFrames, 120) });

  const updateRange = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const start = Math.max(0, Math.floor(el.scrollLeft / FRAME_WIDTH) - VIRTUAL_BUFFER);
    const end = Math.min(
      maxFrames,
      Math.ceil((el.scrollLeft + el.clientWidth) / FRAME_WIDTH) + VIRTUAL_BUFFER
    );
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [scrollRef, maxFrames]);

  useEffect(() => {
    updateRange();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateRange, { passive: true });
    const ro = new ResizeObserver(updateRange);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateRange);
      ro.disconnect();
    };
  }, [updateRange]);

  return range;
}

function TimelinePlayhead({
  isPlaying,
  pausedFrame,
}: {
  isPlaying: boolean;
  pausedFrame: number;
}) {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;

    if (!isPlaying) {
      line.style.transform = `translateX(${pausedFrame * FRAME_WIDTH + 11}px)`;
      return;
    }

    let raf = 0;
    const tick = () => {
      if (lineRef.current) {
        lineRef.current.style.transform = `translateX(${playheadRef.current * FRAME_WIDTH + 11}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, pausedFrame]);

  return (
    <div
      ref={lineRef}
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none will-change-transform"
      style={{ left: 0, transform: `translateX(${pausedFrame * FRAME_WIDTH + 11}px)` }}
    >
      <div className="w-2.5 h-2.5 bg-red-500 rotate-45 border border-zinc-950 shadow -mt-1" />
    </div>
  );
}

function LiveFrameCounter({
  isPlaying,
  pausedFrame,
  maxFrames,
  onSetFrame,
}: {
  isPlaying: boolean;
  pausedFrame: number;
  maxFrames: number;
  onSetFrame: (frame: number) => void;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const span = spanRef.current;
    if (!span) return;

    let raf = 0;
    const tick = () => {
      if (spanRef.current) {
        spanRef.current.textContent = String(Math.floor(playheadRef.current));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  if (!isPlaying) {
    return (
      <input
        type="number"
        min={0}
        max={maxFrames}
        value={pausedFrame}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!Number.isNaN(val)) {
            onSetFrame(Math.min(maxFrames, Math.max(0, val)));
          }
        }}
        className="w-10 bg-zinc-900/60 text-xs font-mono font-bold text-[#39c5bb] text-center border border-zinc-800 rounded outline-none py-0.5"
      />
    );
  }

  return (
    <span
      ref={spanRef}
      className="w-10 inline-block text-center text-xs font-mono font-bold text-[#39c5bb]"
    >
      {pausedFrame}
    </span>
  );
}

interface TimelineProps {
  appState: AppState;
  setCurrentFrame: (frame: number) => void;
  setMaxFrames: (frames: number) => void;
  setIsPlaying: (playing: boolean) => void;
  onRegisterKeyframe: (modelId: string) => void;
  onDeleteKeyframe: (modelId: string, trackName: string, frame: number) => void;
  onSelectTrack: (track: TimelineActiveTrack) => void;
  onApplyTemplate: (templateId: string, mode?: TemplateApplyMode) => void;
  onClearAllKeyframes: () => void;
}

const TRACK_DEFINITIONS = [
  { id: 'camera' as const, label: 'Camera Track', group: 'CAM' },
  ...TIMELINE_TRACK_IDS.map((id) => ({
    id,
    label: TIMELINE_TRACK_LABELS[id],
    group: id.startsWith('morph_') ? 'MORPH' : 'BONE',
  })),
];

export default function Timeline({
  appState,
  setCurrentFrame,
  setMaxFrames,
  setIsPlaying,
  onRegisterKeyframe,
  onDeleteKeyframe,
  onSelectTrack,
  onApplyTemplate,
  onClearAllKeyframes,
}: TimelineProps) {
  const { currentFrame, maxFrames, isPlaying, models, selectedObjectId, timelineActiveTrack, cameraKeyframes } =
    appState;
  const activeModel = models.find((m) => m.id === selectedObjectId);
  const [applyMode, setApplyMode] = useState<TemplateApplyMode>('merge');

  const applyWithMode = (templateId: string) => onApplyTemplate(templateId, applyMode);
  const modelKeyCount = activeModel ? countTimelineKeyframes(activeModel.keyframes) : 0;
  const cameraKeyCount = countCameraKeyframes(cameraKeyframes);
  const vmdActive =
    Boolean(activeModel?.hasVmdAnimation) && activeModel?.vmdPlaybackEnabled !== false;

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const totalKeys = modelKeyCount + cameraKeyCount;
  const totalWidth = (maxFrames + 1) * FRAME_WIDTH;
  const { start: visStart, end: visEnd } = useVisibleFrameRange(timelineScrollRef, maxFrames);

  const visibleFrames = useMemo(() => {
    const frames: number[] = [];
    for (let i = visStart; i <= visEnd; i++) frames.push(i);
    return frames;
  }, [visStart, visEnd]);

  useEffect(() => {
    if (isPlaying) return;
    const container = timelineScrollRef.current;
    if (!container) return;
    const targetScroll = currentFrame * FRAME_WIDTH - container.clientWidth / 2 + 100;
    container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'auto' });
  }, [currentFrame, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const tick = () => {
      const container = timelineScrollRef.current;
      if (container) {
        const targetScroll = playheadRef.current * FRAME_WIDTH - container.clientWidth / 2 + 100;
        container.scrollLeft = Math.max(0, targetScroll);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  return (
    <div
      className="bg-[#16181d] border-t border-zinc-800 select-none flex flex-col h-72 w-full text-zinc-100 font-sans shadow-lg"
      id="mmd-timeline"
    >
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-3 bg-[#16181d]">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setCurrentFrame(0)}
            className="cursor-pointer text-xs font-bold text-zinc-300 bg-[#1e212a] border border-zinc-800 hover:bg-zinc-800 hover:text-white p-1.5 px-2.5 flex items-center justify-center rounded transition-all"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
            className="cursor-pointer text-xs font-bold text-zinc-300 bg-[#1e212a] border border-zinc-800 hover:bg-zinc-800 hover:text-white p-1.5 px-2.5 flex items-center justify-center rounded transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`cursor-pointer text-xs font-bold border rounded p-1.5 px-3.5 flex items-center gap-1.5 shadow-sm ${
              isPlaying
                ? 'bg-red-950/40 border-red-500/50 text-red-400'
                : 'bg-emerald-950/40 border-emerald-500/40 text-[#4ade80]'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentFrame(0);
            }}
            className="cursor-pointer text-xs font-bold text-zinc-300 bg-[#1e212a] border border-zinc-800 hover:bg-red-950/20 hover:text-red-400 p-1.5 px-3 flex items-center gap-1 rounded transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-zinc-400" />
            STOP
          </button>
          <button
            onClick={() => setCurrentFrame(Math.min(maxFrames, currentFrame + 1))}
            className="cursor-pointer text-xs font-bold text-zinc-300 bg-[#1e212a] border border-zinc-800 hover:bg-zinc-800 hover:text-white p-1.5 px-2.5 flex items-center justify-center rounded transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentFrame(maxFrames)}
            className="cursor-pointer text-xs font-bold text-zinc-300 bg-[#1e212a] border border-zinc-800 hover:bg-zinc-800 hover:text-white p-1.5 px-2.5 flex items-center justify-center rounded transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setApplyMode((m) => (m === 'merge' ? 'replace' : 'merge'))}
            className={`cursor-pointer text-[10px] font-bold border rounded px-2 py-1.5 flex items-center gap-1 transition-all ${
              applyMode === 'merge'
                ? 'text-teal-200 bg-teal-950/40 border-teal-500/40'
                : 'text-amber-200 bg-amber-950/30 border-amber-500/40'
            }`}
            title={
              applyMode === 'merge'
                ? 'Add layer: stack body + camera without erasing'
                : 'Replace: overwrite keys from the picked template'
            }
          >
            <Layers className="w-3 h-3" />
            {applyMode === 'merge' ? '+ Layer' : 'Replace'}
          </button>

          <TemplatePicker
            onApplyTemplate={applyWithMode}
            hasModel={Boolean(activeModel)}
            hasVmdActive={vmdActive}
            compact
            variant="dance"
            categories={DANCE_PICKER_CATEGORIES}
            label="Studio"
            applyMode={applyMode}
          />
          <TemplatePicker
            onApplyTemplate={applyWithMode}
            hasModel={Boolean(activeModel)}
            hasVmdActive={vmdActive}
            compact
            variant="dance"
            categories={['dance']}
            label="+ Body"
            applyMode={applyMode}
          />
          <TemplatePicker
            onApplyTemplate={applyWithMode}
            hasModel={Boolean(activeModel)}
            hasVmdActive={vmdActive}
            compact
            variant="dance"
            categories={['camera']}
            label="+ Camera"
            applyMode={applyMode}
          />
          <TemplatePicker
            onApplyTemplate={applyWithMode}
            hasModel={Boolean(activeModel)}
            hasVmdActive={vmdActive}
            compact
            variant="dance"
            categories={['combo', 'emote']}
            label="+ Combo"
            applyMode={applyMode}
          />
          <TemplatePicker
            onApplyTemplate={applyWithMode}
            hasModel={Boolean(activeModel)}
            hasVmdActive={vmdActive}
            compact
            categories={CHARACTER_PICKER_CATEGORIES}
            applyMode={applyMode}
          />

          {(modelKeyCount > 0 || cameraKeyCount > 0) && (
            <span className="text-[9px] font-mono text-zinc-500 hidden sm:inline">
              {modelKeyCount > 0 && `${modelKeyCount} body`}
              {modelKeyCount > 0 && cameraKeyCount > 0 && ' · '}
              {cameraKeyCount > 0 && `${cameraKeyCount} cam`}
            </span>
          )}

          <button
            type="button"
            onClick={onClearAllKeyframes}
            className="cursor-pointer text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-700 hover:border-red-500/50 hover:text-red-400 px-2 py-1.5 rounded transition-all"
            title="Remove all camera and model keyframes, disable bloom"
          >
            Clear keys
          </button>

          <div className="flex items-center space-x-1.5 bg-[#111317] border border-zinc-800 rounded px-2.5 py-1 font-mono text-xs">
            <span className="text-[10px] text-zinc-450 font-bold">FRAME:</span>
            <LiveFrameCounter
              isPlaying={isPlaying}
              pausedFrame={currentFrame}
              maxFrames={maxFrames}
              onSetFrame={setCurrentFrame}
            />
            <span className="text-zinc-600">/</span>
            <input
              type="number"
              min={10}
              value={maxFrames}
              onChange={(e) => setMaxFrames(Math.max(10, parseInt(e.target.value, 10) || 120))}
              className="w-10 bg-zinc-900/60 text-xs font-mono text-zinc-450 font-bold text-center border border-zinc-800 rounded outline-none py-0.5"
            />
          </div>

          {(activeModel || timelineActiveTrack === 'camera') && (
            <button
              onClick={() => onRegisterKeyframe(activeModel?.id ?? '')}
              className="cursor-pointer text-xs font-bold text-teal-300 bg-[#39c5bb]/15 border border-[#39c5bb]/40 hover:bg-[#39c5bb]/20 p-1.5 px-3.5 flex items-center gap-1.5 rounded transition-all"
              title={
                timelineActiveTrack === 'camera'
                  ? 'Register camera keyframe at current frame'
                  : 'Register keyframes for all model tracks at current frame'
              }
            >
              <Key className="w-3.5 h-3.5 text-[#39c5bb]" />
              {timelineActiveTrack === 'camera' ? 'REGISTER CAMERA KEY' : 'ADD KEYFRAME Node'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-[#22252c] bg-[#121418] flex flex-col shrink-0">
          <div className="h-8 border-b border-zinc-800 px-3 flex items-center justify-between text-[10px] font-bold text-[#39c5bb] uppercase bg-[#1c1e24]">
            <span>Bone/Morph Track</span>
            <ListFilter className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-850">
            {TRACK_DEFINITIONS.map((track) => {
              const isActive = timelineActiveTrack === track.id;
              return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id as TimelineActiveTrack)}
                className={`h-8 px-3 text-xs flex items-center justify-between hover:bg-zinc-800/50 border-b border-zinc-850 cursor-pointer ${
                  isActive ? 'bg-[#39c5bb]/10 border-l-2 border-l-[#39c5bb]' : ''
                }`}
              >
                <span className={`truncate font-semibold pr-2 ${isActive ? 'text-[#39c5bb]' : 'text-zinc-300'}`}>
                  {track.label}
                </span>
                <span className="text-[8px] text-[#39c5bb]/80 bg-zinc-900 border border-zinc-800 px-1 py-0.5 font-mono uppercase rounded-sm shrink-0">
                  {track.group}
                </span>
              </div>
            );})}
          </div>
        </div>

        <div
          ref={timelineScrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0e0f12] relative"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="min-w-max h-full flex flex-col" style={{ width: totalWidth }}>
            <div className="h-8 border-b border-zinc-850 bg-[#16181d] flex relative">
              <div
                className="absolute top-0 bottom-0 flex"
                style={{ left: visStart * FRAME_WIDTH }}
              >
                {visibleFrames.map((frame) => {
                  const isTenTick = frame % 10 === 0;
                  const isCurrent = !isPlaying && frame === currentFrame;
                  return (
                    <div
                      key={frame}
                      onClick={() => setCurrentFrame(frame)}
                      className="shrink-0 h-full flex flex-col justify-end items-center relative cursor-pointer border-r border-zinc-900/30 hover:bg-zinc-800/30"
                      style={{ width: FRAME_WIDTH }}
                    >
                      <div className={`w-px bg-zinc-700 ${isTenTick ? 'h-3.5 bg-zinc-500' : 'h-1.5'}`} />
                      {isTenTick && (
                        <span className="text-[9px] font-mono font-bold text-zinc-400 absolute bottom-3">
                          {frame}
                        </span>
                      )}
                      {isCurrent && (
                        <div className="absolute inset-0 bg-teal-500/10 pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
              <TimelinePlayhead isPlaying={isPlaying} pausedFrame={currentFrame} />
            </div>

            <div className="flex-1 overflow-y-auto">
              {TRACK_DEFINITIONS.map((track) => {
                const isCameraTrack = track.id === 'camera';
                const trackKeys = isCameraTrack
                  ? cameraKeyframes.map((kf) => ({
                      id: kf.id,
                      frame: kf.frame,
                      value: kf.fov,
                    }))
                  : activeModel
                    ? getKeyframesForTrack(activeModel.keyframes, track.id as TimelineTrackId)
                    : [];

                return (
                  <div key={track.id} className="h-8 flex relative border-b border-zinc-900/40">
                    <div
                      className="absolute top-0 bottom-0 flex"
                      style={{ left: visStart * FRAME_WIDTH }}
                    >
                      {visibleFrames.map((frame) => (
                        <div
                          key={frame}
                          className={`shrink-0 h-full border-r border-zinc-900/35 ${
                            !isPlaying && frame === currentFrame ? 'bg-red-500/5' : ''
                          } ${timelineActiveTrack === track.id ? 'bg-teal-500/5' : ''}`}
                          style={{ width: FRAME_WIDTH }}
                          onClick={() => setCurrentFrame(frame)}
                          onDoubleClick={() => {
                            onSelectTrack(track.id as TimelineActiveTrack);
                            if (isCameraTrack || activeModel) {
                              onRegisterKeyframe(activeModel?.id ?? '');
                            }
                          }}
                        />
                      ))}
                    </div>

                    {trackKeys.map((keyframe) => {
                      const isCurrentKF = keyframe.frame === currentFrame;
                      return (
                        <div
                          key={keyframe.id}
                          className="absolute top-1/2 -translate-y-1/2 z-10 cursor-pointer group/kf"
                          style={{ left: `${keyframe.frame * FRAME_WIDTH + 6}px` }}
                          title={`Frame ${keyframe.frame}: ${keyframe.value.toFixed(2)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentFrame(keyframe.frame);
                          }}
                        >
                          <div
                            className={`w-2.5 h-2.5 rotate-45 border transition-all ${
                              isCameraTrack
                                ? isCurrentKF
                                  ? 'bg-[#e879ff] border-white scale-125 shadow-lg shadow-[#e879ff]/30'
                                  : 'bg-violet-500 hover:bg-[#e879ff] border-violet-600 shadow-md'
                                : isCurrentKF
                                  ? 'bg-[#ff3385] border-white scale-125 shadow-lg shadow-[#ff3385]/30'
                                  : 'bg-teal-500 hover:bg-[#39c5bb] border-teal-600 shadow-md'
                            }`}
                          />
                          <div className="hidden group-hover/kf:flex absolute bg-zinc-950 border border-zinc-800 text-[9px] w-36 -top-11 left-1/2 -translate-x-1/2 pointer-events-auto items-center justify-between gap-1.5 z-50 rounded shadow-2xl px-1.5 py-1">
                            <span className="font-mono text-zinc-300">
                              Fr {keyframe.frame} ({keyframe.value.toFixed(1)})
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCameraTrack) {
                                  onDeleteKeyframe(activeModel?.id ?? '', 'camera', keyframe.frame);
                                } else if (activeModel) {
                                  onDeleteKeyframe(activeModel.id, track.id, keyframe.frame);
                                }
                              }}
                              className="text-[#ff3385] hover:text-white font-extrabold"
                            >
                              DEL
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="h-8 border-t border-zinc-800 bg-[#121418] px-4 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center space-x-4">
          <span>
            MMD timeline: <span className="text-[#39c5bb] font-bold">{MMD_FPS}</span> fps · Smooth
            playback: <span className="text-[#39c5bb] font-bold">display refresh</span>
          </span>
          <span>Sample Mode: Linear Interpolation</span>
        </div>
        <span>
          {activeModel || cameraKeyframes.length > 0 ? (
            <>
              <span className="text-[#39c5bb] font-bold">{totalKeys}</span> keyframes ·{' '}
              <span className="text-[#39c5bb] font-bold">{TRACK_DEFINITIONS.length}</span> tracks
              {timelineActiveTrack && (
                <>
                  {' '}
                  · active:{' '}
                  <span className="text-[#e879ff] font-bold">{timelineActiveTrack}</span>
                </>
              )}
            </>
          ) : (
            'Stage clear'
          )}
        </span>
      </div>
    </div>
  );
}
