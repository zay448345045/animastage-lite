import { useState } from 'react';
import { Film, Grid3X3, LineChart } from 'lucide-react';
import type { AppState, TimelineTrackId, TimelineKeyframe } from '../../types';
import Timeline from '../Timeline';
import DopesheetPanel from './DopesheetPanel';
import CurveEditorPanel from './CurveEditorPanel';

type EditorTab = 'timeline' | 'dopesheet' | 'curves';

interface EditorTimelineShellProps {
  appState: AppState;
  setCurrentFrame: (frame: number) => void;
  setMaxFrames: (frames: number) => void;
  setIsPlaying: (playing: boolean) => void;
  onRegisterKeyframe: (modelId: string) => void;
  onDeleteKeyframe: (modelId: string, trackName: string, frame: number) => void;
  onSelectTrack: (track: TimelineTrackId | 'camera' | null) => void;
  onApplyTemplate: (templateId: string, mode?: import('../../types').TemplateApplyMode) => void;
  onClearAllKeyframes: () => void;
  onMoveKeyframe: (track: TimelineTrackId, from: number, to: number) => void;
  onPatchKeyframe: (
    track: TimelineTrackId,
    frame: number,
    patch: Partial<TimelineKeyframe>,
    commit?: boolean
  ) => void;
  activeTrack: TimelineTrackId | null;
  /** Pro Mobile bottom sheet — fill available height */
  embeddedInSheet?: boolean;
}

export default function EditorTimelineShell({
  embeddedInSheet = false,
  ...props
}: EditorTimelineShellProps) {
  const [tab, setTab] = useState<EditorTab>('timeline');
  const model = props.appState.models.find((m) => m.id === props.appState.selectedObjectId);
  const keyframes = model?.keyframes ?? [];

  const track =
    props.appState.timelineActiveTrack &&
    props.appState.timelineActiveTrack !== 'camera'
      ? (props.appState.timelineActiveTrack as TimelineTrackId)
      : props.activeTrack;

  return (
    <div
      className={
        embeddedInSheet
          ? 'editor-timeline-shell editor-timeline-shell--pro flex flex-col flex-1 min-h-0 bg-[#121418] overflow-hidden border-0'
          : 'editor-timeline-shell flex flex-col border-t border-zinc-800 bg-[#121418] shrink-0 min-h-0 max-h-[min(38vh,360px)] overflow-hidden'
      }
    >
      <div className="flex items-center gap-1 px-2 py-1 border-b border-zinc-800 bg-[#0e1014] shrink-0 overflow-x-auto">
        {(
          [
            ['timeline', 'Timeline', Film],
            ['dopesheet', 'Dopesheet', Grid3X3],
            ['curves', 'Curves', LineChart],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase rounded cursor-pointer ${
              tab === id
                ? 'bg-[#39c5bb]/20 text-[#39c5bb] border border-[#39c5bb]/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
        {!embeddedInSheet ? (
          <span className="ml-auto hidden md:inline text-[8px] text-zinc-600 font-mono shrink-0">
            Ctrl+Z undo · Ctrl+C/V copy · Del delete key
          </span>
        ) : null}
      </div>

      <div
        className={`flex-1 min-h-0 ${
          tab === 'timeline' ? 'flex flex-col overflow-x-hidden overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'
        }`}
      >
      {tab === 'timeline' && (
        <Timeline
          appState={props.appState}
          setCurrentFrame={props.setCurrentFrame}
          setMaxFrames={props.setMaxFrames}
          setIsPlaying={props.setIsPlaying}
          onRegisterKeyframe={props.onRegisterKeyframe}
          onDeleteKeyframe={props.onDeleteKeyframe}
          onSelectTrack={props.onSelectTrack}
          onApplyTemplate={props.onApplyTemplate}
          onClearAllKeyframes={props.onClearAllKeyframes}
        />
      )}
      {tab === 'dopesheet' && model && (
        <DopesheetPanel
          keyframes={keyframes}
          maxFrames={props.appState.maxFrames}
          currentFrame={props.appState.currentFrame}
          activeTrack={track}
          onSelectTrack={(t) => props.onSelectTrack(t)}
          onSelectKeyframe={(t, frame) => {
            props.onSelectTrack(t);
            props.setCurrentFrame(frame);
          }}
          onMoveKeyframe={props.onMoveKeyframe}
          onDeleteKeyframe={(t, frame) => props.onDeleteKeyframe(model.id, t, frame)}
        />
      )}
      {tab === 'curves' && model && (
        <CurveEditorPanel
          keyframes={keyframes}
          track={track}
          maxFrames={props.appState.maxFrames}
          currentFrame={props.appState.currentFrame}
          onScrubFrame={props.setCurrentFrame}
          onMoveKeyframe={props.onMoveKeyframe}
          onPatchKeyframe={(t, frame, patch, commit) =>
            props.onPatchKeyframe(t, frame, patch, commit)
          }
        />
      )}
      </div>
    </div>
  );
}
