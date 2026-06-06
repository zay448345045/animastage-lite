import { type ReactNode } from 'react';
import { Play, ChevronRight, Upload, CloudOff, Zap, Sparkles } from 'lucide-react';
import SeoHead from '../components/SeoHead';
import DemoGalleryGrid from './landing/DemoGalleryGrid';
import LandingSeoChrome from '../landing/LandingSeoChrome';
import { BRAND_TAGLINE, SITE_URL } from '../landing/officialProject';
import { buildSoftwareApplicationSchema, buildWebPageSchema } from '../landing/landingSchema';

const PAGE_URL = `${SITE_URL}/mmd-online`;

const SEO = {
  title: 'MMD Online — MikuMikuDance in Your Browser | AnimaStage Lite',
  description:
    'MMD online — run MikuMikuDance in the browser with no install. Official PMX viewer, VMD player, timeline, MP4 export. Free WebMMD studio.',
  keywords:
    'MMD online, MikuMikuDance online, MMD without install, MMD web, online PMX viewer, VMD player online',
} as const;

interface Props {
  onStart: () => void;
  onStartDemo: () => void;
  onStartDemoId: (id: string) => void;
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-zinc-950 font-bold px-6 py-3.5 cursor-pointer"
    >
      {children}
    </button>
  );
}

export default function MmdOnlineLandingPage({ onStart, onStartDemo, onStartDemoId }: Props) {
  const jsonLd = [
    buildWebPageSchema(SEO.title, SEO.description, PAGE_URL),
    buildSoftwareApplicationSchema(PAGE_URL, SEO.description),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Can I run MMD online without installing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. AnimaStage Lite at animastage-lite.app runs MikuMikuDance workflows entirely in the browser — PMX, VMD, physics, and MP4 export.',
          },
        },
      ],
    },
  ];

  return (
    <LandingSeoChrome activePath="/mmd-online" compactNav>
      <SeoHead title={SEO.title} description={SEO.description} canonical={PAGE_URL} keywords={SEO.keywords} ogUrl={PAGE_URL} jsonLd={jsonLd} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-400/90 mb-3">{BRAND_TAGLINE}</p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-5">
          MMD Online — MikuMikuDance Without Install
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-8 max-w-2xl">
          <strong className="text-zinc-200">MMD online</strong> at the official {SITE_URL} site. Load PMX and VMD, preview
          with Bullet physics, edit curves and camera, export Shorts-ready MP4 — all in one tab. No desktop MikuMikuDance
          required.
        </p>
        <div className="flex flex-wrap gap-3 mb-12">
          <PrimaryBtn onClick={onStartDemo}>
            <Sparkles className="w-4 h-4" />
            Try demo
          </PrimaryBtn>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-zinc-200 font-semibold cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Start MMD online
          </button>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">What you get with MMD online</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Zap, title: 'Instant start', desc: 'Demo scenes load in ~2 seconds.' },
            { icon: CloudOff, title: 'No upload', desc: 'Files process locally in WebGL.' },
            { icon: Play, title: 'Full studio', desc: 'Timeline, poses, analyzer, export.' },
          ].map(({ icon: Icon, title, desc }) => (
            <article key={title} className="glass-panel rounded-xl p-4 border border-white/5">
              <Icon className="w-5 h-5 text-cyan-400 mb-2" aria-hidden />
              <h3 className="font-bold text-zinc-100 text-sm mb-1">{title}</h3>
              <p className="text-xs text-zinc-500">{desc}</p>
            </article>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">Related official pages</h2>
        <p className="text-sm text-zinc-500 mb-8">
          <a href="/mmd-browser" className="text-cyan-400 hover:text-cyan-300">
            MMD Browser
          </a>
          {' · '}
          <a href="/mmd-android" className="text-cyan-400 hover:text-cyan-300">
            MMD Android
          </a>
          {' · '}
          <a href="/" className="text-cyan-400 hover:text-cyan-300">
            Homepage
          </a>
        </p>

        <h2 className="text-2xl font-bold text-white mb-6">Try a demo now</h2>
        <DemoGalleryGrid onSelectDemo={onStartDemoId} />
        <div className="mt-8">
          <PrimaryBtn onClick={onStartDemo}>
            <Play className="w-4 h-4 fill-current" />
            Open featured demo
            <ChevronRight className="w-4 h-4" />
          </PrimaryBtn>
        </div>
      </main>
    </LandingSeoChrome>
  );
}
