/** Shown while GPU is suspended during hardware reinit after context loss. */
export default function GraphicsRecoveryOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0c12] text-zinc-300 pointer-events-none">
      <div className="h-8 w-8 rounded-full border-2 border-cyan-500/40 border-t-cyan-400 animate-spin mb-3" />
      <p className="text-sm font-bold tracking-wide">Recovering GPU…</p>
      <p className="text-[10px] text-zinc-500 mt-1">Reinitializing WebGL — models reload sequentially (~1s)</p>
    </div>
  );
}
