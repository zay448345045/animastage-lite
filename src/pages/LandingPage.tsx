import { useEffect } from 'react';
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

const SITE_URL = 'https://animastage-lite.app';

const FEATURES = [
  {
    title: 'Instant browser preview',
    desc: 'Drop your MikuMikuDance model and see it live in seconds — no install, no Windows-only lock-in.',
  },
  {
    title: 'Play any VMD motion',
    desc: 'Load dances and emotes without opening desktop MMD. Scrub the timeline in real time.',
  },
  {
    title: 'Realistic cloth physics',
    desc: 'Skirt, hair, and accessories move with Bullet WASM while you preview.',
  },
  {
    title: 'Cinematic looks, fast GPU',
    desc: 'Bloom, depth of field, and weather-style presets without a gaming PC.',
  },
  {
    title: 'Shorts-ready 9:16',
    desc: 'One click to frame for TikTok, Reels, and YouTube Shorts at 1080×1920.',
  },
  {
    title: 'Clean MP4 export',
    desc: 'Record share-ready video — no gizmos or grid in the final frame.',
  },
  {
    title: 'Private by default',
    desc: 'PMX and VMD processing runs client-side on your device.',
  },
  {
    title: 'Android app',
    desc: 'Same MMD studio on your phone — sideload the APK and create on the go.',
  },
] as const;

const USE_CASES = [
  { label: 'VTuber motion checks', desc: 'Preview dances before stream — in a tab.' },
  { label: 'Dance cover Shorts', desc: 'Batch vertical clips without desktop MMD.' },
  { label: 'Indie dev prototyping', desc: 'Test PMX/VMD in WebGL before shipping.' },
  { label: 'Chromebook & Mac', desc: 'MMD online where desktop MMD does not run.' },
] as const;

const FAQ = [
  {
    q: 'What is MMD online?',
    a: 'MMD online means running MikuMikuDance-style workflows in a web browser — loading PMX models and VMD motions without installing desktop MMD. AnimaStage Lite is a full browser studio with physics, timeline, and video export.',
  },
  {
    q: 'Can I run MikuMikuDance in the browser?',
    a: 'You cannot run the official MMD executable in a browser, but AnimaStage Lite supports the same file formats (PMX/PMD, VMD) and lets you preview, edit, and export video online using WebGL2.',
  },
  {
    q: 'Does AnimaStage Lite work without install?',
    a: 'Yes. Open the studio in Chrome or Edge — no download required. An optional Android APK is available if you prefer a native app on your phone.',
  },
  {
    q: 'Is AnimaStage Lite free?',
    a: 'The Lite studio is free to use in the browser and open source on GitHub. Optional AI features may require your own API key. AnimaStage Pro is a separate advanced product.',
  },
  {
    q: 'What file formats are supported?',
    a: 'PMX and PMD models, VMD motion (including camera tracks), textures, and HDR environments. Export includes MP4 (WebCodecs on Chrome/Edge) and VMD from the timeline editor.',
  },
  {
    q: 'Can I export vertical video for TikTok and YouTube Shorts?',
    a: 'Yes. Switch to 9:16 portrait mode and export at 1080×1920. The studio optimizes performance for stable vertical recording.',
  },
  {
    q: 'Are my models uploaded to a server?',
    a: 'Core editing runs client-side in your browser. Files are not uploaded for basic load-and-play unless you enable optional cloud or collab features.',
  },
  {
    q: 'MMD online vs desktop MMD — which should I use?',
    a: 'Use AnimaStage Lite for quick previews, Shorts, and any device with a modern browser. Use desktop MikuMikuDance for legacy plugins and long-form traditional MMD production.',
  },
] as const;

export default function LandingPage({ onStart, onStartDemo }: LandingPageProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    document.title = 'MMD Online — Run PMX & VMD in Browser | AnimaStage Lite';

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };

    const appSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'AnimaStage Lite',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web Browser, Android',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Browser-based MMD online studio. Load PMX and VMD, preview with physics, export 9:16 Shorts.',
      url: SITE_URL,
      downloadUrl: `${SITE_URL}/app-debug.apk`,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'landing-jsonld';
    script.textContent = JSON.stringify([faqSchema, appSchema]);
    document.head.appendChild(script);

    return () => {
      document.getElementById('landing-jsonld')?.remove();
    };
  }, []);

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
            <button type="button" onClick={() => scrollTo('compare')} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Compare
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
                  Run MMD online in your browser
                  <span className="block text-zinc-400 font-bold text-3xl sm:text-4xl mt-1">
                    No install required
                  </span>
                </h1>

                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  <strong className="text-zinc-200 font-semibold">AnimaStage Lite</strong> is a{' '}
                  <strong className="text-zinc-300">MikuMikuDance browser</strong> studio — drag{' '}
                  <strong className="text-zinc-300">PMX</strong> and <strong className="text-zinc-300">VMD</strong>,
                  preview with cloth physics, export <strong className="text-zinc-200 font-semibold">1080×1920 Shorts</strong>.
                  Built for creators, VTubers, and indie devs. Also on Android.
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
              How AnimaStage Lite works
            </h2>
            <p className="text-zinc-500 text-center mb-12 max-w-lg mx-auto">
              Three steps from landing to your first clip — fast 3D animation online workflow.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  icon: Upload,
                  title: 'Drop your PMX model and VMD motion',
                  desc: 'Drag files onto the viewport or open the demo rig — PMX viewer online, no desktop MMD.',
                },
                {
                  step: '2',
                  icon: Play,
                  title: 'Preview with physics and lighting in real time',
                  desc: 'Scrub the timeline, tune FX, switch to 9:16 for vertical anime animation.',
                },
                {
                  step: '3',
                  icon: Video,
                  title: 'Edit on the timeline and export vertical video',
                  desc: 'Record MP4 with a clean frame — WebCodecs HQ or Live capture.',
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

        {/* SEO body copy */}
        <section id="about" className="py-16 border-t border-zinc-800/60 bg-zinc-950/30 scroll-mt-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-6 text-center">
              MikuMikuDance online — without installing anything
            </h2>
            <div className="text-sm sm:text-base text-zinc-400 leading-relaxed space-y-4">
              <p>
                AnimaStage Lite brings <strong className="text-zinc-300">MMD online</strong> to Chrome, Edge,
                Firefox, and Android. Load <strong className="text-zinc-300">PMX/PMD</strong> characters, apply{' '}
                <strong className="text-zinc-300">VMD</strong> dances, scrub a timeline, tune morphs and bones, and
                export <strong className="text-zinc-300">MP4</strong> — including{' '}
                <strong className="text-zinc-300">9:16 vertical</strong> for Shorts and Reels.
              </p>
              <p>
                Unlike desktop MMD, there is no DirectX setup and no OS barrier. The app runs client-side in WebGL — your
                models stay on your machine. Ideal for <strong className="text-zinc-300">VTubers</strong> checking motion,
                dance cover creators batching vertical clips, and developers prototyping character animation in the browser.
              </p>
              <p>
                The workflow is deliberately fast: drag files → play → adjust camera → export. Cloth physics, bloom, DOF,
                and weather presets add polish without a gaming GPU. Power users get VMD export, animation layers, and an
                installable <strong className="text-zinc-300">Android APK</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 border-t border-zinc-800/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-center text-white mb-3">
              Built for creators, VTubers, and indie devs
            </h2>
            <p className="text-zinc-500 text-center mb-10 max-w-xl mx-auto text-sm">
              WebGL animation tools for anyone who needs MMD in the browser — not a static model viewer.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {USE_CASES.map((u) => (
                <div key={u.label} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                  <h3 className="font-semibold text-zinc-100 text-sm mb-1.5">{u.label}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{u.desc}</p>
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
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-center text-white mb-3">
              Everything you need for browser MMD — in one tab
            </h2>
            <p className="text-zinc-500 text-center mb-12 max-w-xl mx-auto text-sm">
              Run 3D models in the browser with a full WebMMD studio — not just a PMX viewer online.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  Export vertical anime video for Shorts &amp; Reels
                </h2>
                <h3 className="text-sm font-semibold text-cyan-400/90 mb-2">1080×1920 · 9:16 Lite mode</h3>
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

        {/* MMD online vs desktop */}
        <section id="compare" className="py-16 border-t border-zinc-800/60 scroll-mt-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="font-display font-bold text-2xl text-center text-white mb-2">
              MMD online vs desktop MikuMikuDance
            </h2>
            <p className="text-zinc-500 text-center text-sm mb-8 max-w-lg mx-auto">
              Use Lite as a companion — preview and Shorts in the browser, finish in desktop MMD or Pro when needed.
            </p>
            <h3 className="sr-only">Lite vs Pro product comparison</h3>
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
                    <td className="p-3 text-zinc-500">Best for</td>
                    <td className="p-3">MMD online · fast preview &amp; Shorts</td>
                    <td className="p-3">Cinematic multi-character production</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-zinc-500">Platform</td>
                    <td className="p-3">Browser + Android APK</td>
                    <td className="p-3">Desktop WebGL pipeline</td>
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
                  AnimaStage Lite on Android
                </h2>
                <h3 className="text-sm font-semibold text-zinc-300 mb-4">Same studio — installable APK</h3>
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
            <h2 className="font-display font-bold text-2xl text-center text-white mb-2">
              Frequently asked questions
            </h2>
            <p className="text-zinc-600 text-center text-xs mb-8">MMD online · PMX · VMD · browser · Android</p>
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
              Start creating in 60 seconds
            </h2>
            <p className="text-zinc-500 mb-8">
              Free WebMMD studio · Open source · No account · MMD online in one tab
            </p>
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
