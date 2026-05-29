import {
  Play,
  ChevronRight,
  Upload,
  Video,
  Smartphone,
  Github,
  Shield,
  Sparkles,
  ExternalLink,
  Download,
} from 'lucide-react';

const ANDROID_APK_URL = '/app-debug.apk';
const ANDROID_APK_FILENAME = 'AnimaStage-Lite-debug.apk';

interface LandingPageProps {
  onStart: () => void;
  onStartDemo: () => void;
}

const FEATURES = [
  {
    title: 'Drop PMX & VMD',
    desc: 'Drag MikuMikuDance models and motion files — no install.',
  },
  {
    title: 'Timeline & export',
    desc: 'Dopesheet, curves, and VMD export in the browser.',
  },
  {
    title: 'Cloth physics',
    desc: 'Bullet WASM for skirt, hair, and accessories.',
  },
  {
    title: 'RTX Lite FX',
    desc: 'Bloom, DOF, weather presets — tuned for speed.',
  },
  {
    title: '9:16 Shorts',
    desc: 'Stable portrait mode · 1080×1920 export.',
  },
  {
    title: 'MP4 recording',
    desc: 'WebCodecs HQ or Live capture — clean frame, no gizmos.',
  },
  {
    title: 'Android app',
    desc: 'Install the studio on your phone — same PMX, VMD, timeline & FX.',
  },
] as const;

const FAQ = [
  {
    q: 'Do I need MikuMikuDance installed?',
    a: 'No. Load PMX/PMD and VMD in the browser. Prepare assets in MMD or download ready-made models.',
  },
  {
    q: 'Which browser works best?',
    a: 'Chrome or Edge with WebGL2. MP4 HQ export needs WebCodecs (Chrome/Edge recommended).',
  },
  {
    q: 'Are my files uploaded to a server?',
    a: 'Core studio runs client-side. Your models stay on your device unless you enable optional cloud features.',
  },
  {
    q: 'What is the difference vs AnimaStage Pro?',
    a: 'Lite is fast preview and Shorts. Pro adds multi-character, cinematic camera, and full RTX pipeline.',
  },
  {
    q: 'Is there an Android app?',
    a: 'Yes. Download the debug APK below (sideload). Enable “Install unknown apps” for your browser or file manager. Google Play is not available yet.',
  },
] as const;

export default function LandingPage({ onStart, onStartDemo }: LandingPageProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#0a0a0c]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-md bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              AnimaStage <span className="text-cyan-400 font-semibold text-sm">Lite</span>
            </span>
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
            <button type="button" onClick={() => scrollTo('how')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              How it works
            </button>
            <button type="button" onClick={() => scrollTo('features')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Features
            </button>
            <button type="button" onClick={() => scrollTo('android')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Android
            </button>
            <button type="button" onClick={() => scrollTo('faq')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              FAQ
            </button>
            <a
              href="https://github.com/FBNonaMe/animastage-lite"
              className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </nav>

          <button
            type="button"
            onClick={onStart}
            className="shrink-0 inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Try Studio
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-zinc-800/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent)] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-16 md:pb-20">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <div className="text-center lg:text-left">
                <p className="inline-flex items-center gap-2 text-xs font-medium text-cyan-400/90 border border-cyan-500/25 bg-cyan-500/10 rounded-full px-3 py-1 mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Browser &amp; Android · WebGL2 · PMX &amp; VMD
                </p>

                <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.25rem] leading-[1.08] tracking-tight text-white mb-5">
                  Run MMD in your browser.
                  <span className="block text-zinc-400 font-bold text-3xl sm:text-4xl mt-1">No install.</span>
                </h1>

                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  Drag your MikuMikuDance model and motion. Preview with cloth physics and lighting.
                  Export <strong className="text-zinc-200 font-semibold">1080×1920 Shorts</strong> — in one tab.
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start mb-6">
                  <button
                    type="button"
                    onClick={onStart}
                    className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base px-6 py-3.5 rounded-xl transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Try Studio — free
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={onStartDemo}
                    className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-cyan-500/50 hover:bg-zinc-900 text-zinc-200 font-semibold text-base px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Open demo scene
                  </button>
                  <a
                    href={ANDROID_APK_URL}
                    download={ANDROID_APK_FILENAME}
                    className="inline-flex items-center justify-center gap-2 border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-200 font-semibold text-base px-6 py-3.5 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Android APK
                  </a>
                </div>

                <p className="text-xs text-zinc-500 flex flex-wrap gap-x-4 gap-y-1 justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-zinc-600" />
                    Files stay on your device
                  </span>
                  <span>Open source</span>
                  <span>Chrome &amp; Edge</span>
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={onStart}
                  className="block w-full rounded-xl border border-zinc-800 overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-cyan-500/20 hover:ring-cyan-500/40 transition-all cursor-pointer text-left"
                >
                  <img
                    src="/studio-screenshot.png"
                    alt="AnimaStage Lite studio — PMX model, timeline, and WebGL viewport"
                    className="w-full h-auto"
                    width={1200}
                    height={675}
                    loading="eager"
                  />
                </button>
                <p className="text-center text-[11px] text-zinc-600 mt-3 font-mono">
                  Real studio UI — click to open
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-b border-zinc-800/60 py-8 bg-zinc-950/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm text-zinc-500 mb-3">Early creators say</p>
            <p className="text-lg sm:text-xl text-zinc-300 font-medium max-w-2xl mx-auto">
              &ldquo;Amazing — finally MMD without installing anything.&rdquo;
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-5 text-xs text-zinc-500">
              <span>Shorts &amp; Reels</span>
              <span>·</span>
              <span>VTuber previews</span>
              <span>·</span>
              <span>MMD quick tests</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-16 md:py-20 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-center text-white mb-3">
              How it works
            </h2>
            <p className="text-zinc-500 text-center mb-12 max-w-lg mx-auto">
              Three steps from landing to your first clip.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  icon: Upload,
                  title: 'Drop PMX + VMD',
                  desc: 'Drag your model and motion onto the viewport — or open the demo rig.',
                },
                {
                  step: '2',
                  icon: Play,
                  title: 'Play & adjust',
                  desc: 'Scrub the timeline, tune FX and physics, switch to 9:16 for Shorts.',
                },
                {
                  step: '3',
                  icon: Video,
                  title: 'Export MP4',
                  desc: 'Record HQ or Live — clean frame, no editor gizmos in the video.',
                },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div
                  key={step}
                  className="relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
                >
                  <span className="text-[10px] font-mono text-cyan-500/80 mb-3 block">STEP {step}</span>
                  <Icon className="w-8 h-8 text-cyan-400 mb-4" strokeWidth={1.5} />
                  <h3 className="font-semibold text-zinc-100 mb-2">{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="py-16 border-y border-zinc-800/60 bg-zinc-950/30 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4">
                  See it in action
                </h2>
                <ul className="space-y-3 text-zinc-400 text-sm mb-8">
                  <li className="flex gap-2">
                    <span className="text-cyan-400">✓</span> WebGL2 stage with MMD-style controls
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">✓</span> Timeline, morphs, and bone tracks
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-400">✓</span> Portrait 9:16 mode for vertical video
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={onStartDemo}
                  className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-5 py-3 rounded-lg cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Open demo scene
                </button>
              </div>
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <img
                  src="/studio-screenshot.png"
                  alt="AnimaStage Lite demo"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-20 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-center text-white mb-12">
              Built for speed
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-5 hover:border-zinc-700 transition-colors"
                >
                  <h3 className="font-semibold text-zinc-100 text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9:16 */}
        <section className="py-16 border-t border-zinc-800/60 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(34,211,238,0.08),transparent)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 w-32 h-56 rounded-2xl border-2 border-dashed border-cyan-500/40 bg-zinc-900/50 flex flex-col items-center justify-center gap-2">
                <Smartphone className="w-8 h-8 text-cyan-400" />
                <span className="text-[10px] font-mono text-zinc-500">9:16</span>
                <span className="text-xs font-bold text-cyan-400">1080×1920</span>
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl text-white mb-3">
                  Shorts-ready 9:16 Lite
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  Portrait mode caps DPR and heavy FX so WebGL stays stable on everyday laptops.
                  Export native vertical Full HD for TikTok, Reels, and YouTube Shorts.
                </p>
                <button
                  type="button"
                  onClick={onStart}
                  className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  Try in studio <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Lite vs Pro */}
        <section className="py-16 border-t border-zinc-800/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="font-display font-bold text-2xl text-center text-white mb-8">
              Lite vs Pro
            </h2>
            <div className="rounded-xl border border-zinc-800 overflow-hidden text-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-900/80 text-zinc-400 text-left">
                    <th className="p-3 font-medium"> </th>
                    <th className="p-3 font-medium text-cyan-400">Lite (this app)</th>
                    <th className="p-3 font-medium text-zinc-300">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-400 divide-y divide-zinc-800">
                  <tr>
                    <td className="p-3 text-zinc-500">Focus</td>
                    <td className="p-3">Fast preview &amp; Shorts</td>
                    <td className="p-3">Cinematic production</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-zinc-500">Try</td>
                    <td className="p-3">
                      <a href="https://animastage-lite.app/app" className="text-cyan-400 hover:underline">
                        animastage-lite.app
                      </a>
                    </td>
                    <td className="p-3">
                      <a
                        href="https://animastagepro.dev/"
                        className="text-zinc-300 hover:underline inline-flex items-center gap-1"
                        target="_blank"
                        rel="noreferrer"
                      >
                        animastagepro.dev <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-600 text-center mt-4">
              Sidebar → Pro in Lite = advanced modules (mocap, AI), not the Pro product.
            </p>
          </div>
        </section>

        {/* Android */}
        <section id="android" className="py-16 md:py-20 scroll-mt-16 border-t border-zinc-800/60 bg-zinc-950/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 mb-2">
                  New — Android integration
                </p>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4">
                  AnimaStage Lite on your phone
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6">
                  The same studio as in the browser — installable Android app. PMX, VMD, timeline, FX,
                  and Shorts export without a desktop.
                </p>
                <ul className="text-sm text-zinc-500 space-y-2 mb-8">
                  <li className="flex items-start gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    Mobile UI: bottom bar, templates, touch timeline
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    Processing stays on your device
                  </li>
                  <li className="flex items-start gap-2">
                    <Upload className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    Sideload debug APK (Google Play coming later)
                  </li>
                </ul>
                <a
                  href={ANDROID_APK_URL}
                  download={ANDROID_APK_FILENAME}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
                >
                  <Download className="w-5 h-5" />
                  Download app-debug.apk
                </a>
                <p className="text-[11px] text-zinc-600 mt-3 font-mono">
                  ~19 MB · Android 6+ · allow install from unknown sources
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-400 space-y-4">
                <p className="font-semibold text-zinc-200">Install steps</p>
                <ol className="list-decimal list-inside space-y-2 text-zinc-500">
                  <li>Download <span className="font-mono text-zinc-400">app-debug.apk</span></li>
                  <li>Open the file → Install</li>
                  <li>If blocked, allow unknown apps for your browser or Files app</li>
                  <li>Launch <strong className="text-zinc-300">AnimaStage Lite</strong></li>
                </ol>
                <p className="text-xs text-zinc-600 border-t border-zinc-800 pt-4">
                  Prefer the browser?{' '}
                  <button type="button" onClick={onStart} className="text-cyan-400 hover:underline cursor-pointer">
                    Open web studio
                  </button>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 border-t border-zinc-800/60 scroll-mt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <h2 className="font-display font-bold text-2xl text-center text-white mb-8">FAQ</h2>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-lg border border-zinc-800 bg-zinc-900/30 open:border-cyan-500/30"
                >
                  <summary className="p-4 cursor-pointer font-medium text-zinc-200 text-sm list-none flex justify-between items-center">
                    {item.q}
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-open:rotate-90 transition-transform shrink-0" />
                  </summary>
                  <p className="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 border-t border-zinc-800/60">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="font-display font-bold text-3xl text-white mb-4">
              Open tab. Drop PMX. Hit play.
            </h2>
            <p className="text-zinc-500 mb-8">Free · Open source · No account required</p>
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-lg px-8 py-4 rounded-xl cursor-pointer transition-colors"
            >
              Try Studio — free
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-10 text-center text-xs text-zinc-600">
        <div className="max-w-6xl mx-auto px-4 space-y-3">
          <p>
            <a href="https://github.com/FBNonaMe/animastage-lite" className="text-zinc-400 hover:text-cyan-400">
              GitHub
            </a>
            {' · '}
            <a href="https://animastagepro.dev/" className="text-zinc-400 hover:text-cyan-400" target="_blank" rel="noreferrer">
              AnimaStage Pro
            </a>
            {' · '}
            <span className="font-mono">animastage-lite@1.0.0</span>
          </p>
          <p className="max-w-md mx-auto leading-relaxed">
            MMD models and VMD motions belong to their authors. Use only content you have rights to publish.
          </p>
        </div>
      </footer>
    </div>
  );
}
