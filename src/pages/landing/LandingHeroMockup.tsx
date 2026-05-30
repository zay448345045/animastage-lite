/** SaaS-style product frame with light motion (no video assets). */
export default function LandingHeroMockup() {
  return (
    <div className="relative w-full max-w-[640px] mx-auto lg:mx-0">
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-fuchsia-500/10 blur-3xl rounded-full pointer-events-none landing-glow-pulse" />

      <div className="relative rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-zinc-950/80">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[10px] font-mono text-zinc-500">AnimaStage Lite — live preview</span>
        </div>

        <div className="flex min-h-[280px] sm:min-h-[320px]">
          <div className="hidden sm:flex w-[118px] shrink-0 flex-col gap-2 p-2 border-r border-white/5 bg-zinc-950/50">
            <div className="rounded-lg border border-violet-500/20 bg-violet-950/30 p-2">
              <p className="text-[8px] font-bold text-violet-300 uppercase mb-1">Pose</p>
              <div className="grid grid-cols-2 gap-0.5">
                {['🧍', '💃', '✋', '👋'].map((e, i) => (
                  <div
                    key={e}
                    className="aspect-square rounded bg-zinc-800/80 text-[10px] flex items-center justify-center landing-pose-pop"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    {e}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-2 flex-1">
              <p className="text-[8px] font-bold text-amber-300 uppercase mb-1">Analyzer</p>
              <div className="space-y-1">
                <div className="h-1 rounded-full bg-emerald-500/60 w-full landing-bar-grow" />
                <div className="h-1 rounded-full bg-amber-500/50 w-3/4 landing-bar-grow" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>

          <div className="flex-1 relative bg-[#0d0e11] overflow-hidden">
            <img
              src="./demos/thumbs/party-dance.svg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-90 landing-ken-burns"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e11] via-transparent to-transparent" />
            <div className="absolute inset-0 landing-shimmer pointer-events-none opacity-30" />
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
              <span className="text-[9px] font-mono text-cyan-400/90 bg-black/50 px-2 py-0.5 rounded border border-cyan-500/20">
                Viewport · WebGL2
              </span>
              <span className="text-[9px] font-semibold text-emerald-300 bg-black/50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 landing-pulse-dot" />
                Playing
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 bg-[#121418] p-2 space-y-1.5">
          <div className="flex gap-1 text-[8px] font-bold uppercase text-zinc-500 px-1">
            <span className="text-cyan-400">Timeline</span>
            <span>·</span>
            <span className="text-violet-400">Curves</span>
          </div>
          <div className="h-10 rounded-lg bg-zinc-900/80 border border-white/5 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full text-cyan-500/80 landing-curve-draw" preserveAspectRatio="none" viewBox="0 0 320 40">
              <path
                d="M0 32 Q40 8 80 24 T160 16 T240 28 T320 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                pathLength={1}
              />
            </svg>
            {[20, 35, 55, 72].map((x, i) => (
              <div
                key={x}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 border border-zinc-900 landing-key-pop"
                style={{ left: `${x}%`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
