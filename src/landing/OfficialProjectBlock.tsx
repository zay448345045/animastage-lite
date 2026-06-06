import { ExternalLink, Github, Globe, Shield } from 'lucide-react';
import { LITE_AUTHOR, OFFICIAL_PROJECT, PRO_AUTHOR } from './officialProject';

export default function OfficialProjectBlock() {
  return (
    <section
      id="official"
      aria-labelledby="official-heading"
      className="py-12 md:py-14 border-t border-white/5 bg-gradient-to-b from-violet-950/20 to-transparent scroll-mt-16"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="glass-panel rounded-2xl border border-violet-500/25 p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" aria-hidden />
            <div>
              <h2 id="official-heading" className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">
                Official AnimaStage Project
              </h2>
              <p className="text-violet-200/90 text-sm sm:text-base font-medium leading-relaxed">
                {OFFICIAL_PROJECT.statement}
              </p>
            </div>
          </div>

          <dl className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="rounded-xl bg-zinc-950/50 border border-white/5 p-4">
              <dt className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" aria-hidden />
                Official website
              </dt>
              <dd>
                <a
                  href={OFFICIAL_PROJECT.siteUrl}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold break-all"
                >
                  {OFFICIAL_PROJECT.siteUrl}
                </a>
              </dd>
            </div>
            <div className="rounded-xl bg-zinc-950/50 border border-white/5 p-4">
              <dt className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" aria-hidden />
                AnimaStage Lite (GitHub)
              </dt>
              <dd>
                <a
                  href={OFFICIAL_PROJECT.liteRepo}
                  target="_blank"
                  rel="noopener noreferrer author"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold break-all"
                >
                  github.com/FBNonaMe/animastage-lite
                </a>
              </dd>
            </div>
            <div className="rounded-xl bg-zinc-950/50 border border-white/5 p-4 sm:col-span-2">
              <dt className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" aria-hidden />
                AnimaStage Pro (GitHub)
              </dt>
              <dd className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-1">
                <a
                  href={OFFICIAL_PROJECT.proRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-300 hover:text-violet-200 font-semibold break-all"
                >
                  github.com/gtausa197-svg/AnimaStage-Pro
                </a>
                <a
                  href={OFFICIAL_PROJECT.proSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-300 text-xs inline-flex items-center gap-1"
                >
                  animastagepro.dev
                  <ExternalLink className="w-3 h-3" aria-hidden />
                </a>
              </dd>
            </div>
          </dl>

          <p className="text-xs text-zinc-500 leading-relaxed">
            Third-party mirrors may exist. For releases, documentation, and support, use only the official URLs above.
            <span className="block mt-2">
              <strong className="text-zinc-400">Lite</strong> —{' '}
              <a href={LITE_AUTHOR.url} className="text-cyan-400/90 hover:text-cyan-300 font-medium">
                {LITE_AUTHOR.name}
              </a>
              {' · '}
              <strong className="text-zinc-400">Pro</strong> —{' '}
              <a href={PRO_AUTHOR.url} className="text-violet-300/90 hover:text-violet-200 font-medium">
                {PRO_AUTHOR.name}
              </a>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
