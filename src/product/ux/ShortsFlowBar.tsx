import { Camera, Download, Lock, Share2, Smartphone, Unlock } from 'lucide-react';
import type { ShortsPhase } from '../shorts/ShortsGenerator';

interface ShortsFlowBarProps {
  phase: ShortsPhase;
  durationSec: number;
  manualCameraLock: boolean;
  onShare: () => void;
  onExport: () => void;
  onAutoFrame: () => void;
  onToggleManualCamera: () => void;
}

/** Generate → Preview → Export — product UI only. */
export default function ShortsFlowBar({
  phase,
  durationSec,
  manualCameraLock,
  onShare,
  onExport,
  onAutoFrame,
  onToggleManualCamera,
}: ShortsFlowBarProps) {
  if (phase === 'idle') return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none max-w-[95vw]">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#121418]/95 border border-pink-500/25 shadow-lg backdrop-blur-md">
        <span className="text-[10px] font-bold uppercase text-pink-300/90 tracking-wide">
          {phase === 'generating' && 'Generating short…'}
          {phase === 'preview' && `Preview · 9:16 · ${durationSec}s`}
          {phase === 'export' && 'Ready to export'}
        </span>
        {phase === 'preview' && (
          <>
            <button
              type="button"
              onClick={onAutoFrame}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer"
              title="Reframe camera on all visible characters"
            >
              <Camera className="w-3.5 h-3.5" />
              Auto frame
            </button>
            <button
              type="button"
              onClick={onToggleManualCamera}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                manualCameraLock
                  ? 'bg-amber-600/90 hover:bg-amber-500 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
              title={
                manualCameraLock
                  ? 'Unlock — camera follows models again'
                  : 'Lock — position camera manually with mouse'
              }
            >
              {manualCameraLock ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
              {manualCameraLock ? 'Manual' : 'Free cam'}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </>
        )}
        {phase === 'generating' && <Smartphone className="w-4 h-4 text-pink-400 animate-pulse" />}
      </div>
    </div>
  );
}
