import { lazy, Suspense, useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage.tsx';
import { isNativeApp } from './utils/platform';

const App = lazy(() => import('./App.tsx'));
const ViewerPage = lazy(() => import('./pages/ViewerPage.tsx'));

function normalizePath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (base && pathname.startsWith(base)) {
    return pathname.slice(base.length) || '/';
  }
  return pathname || '/';
}

function isAppPath(path: string): boolean {
  return path === '/app' || path.startsWith('/app/');
}

function isViewerPath(path: string): boolean {
  return path === '/viewer' || path.startsWith('/viewer/');
}

function StudioBootScreen() {
  return (
    <div className="min-h-screen bg-[#0a0b0e] text-zinc-300 flex flex-col items-center justify-center gap-3 font-sans">
      <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
      <p className="text-sm font-semibold">Loading AnimaStage…</p>
    </div>
  );
}

function resolveInitialPath(): string {
  const normalized = normalizePath(window.location.pathname);
  if (isNativeApp() && normalized === '/') return '/app';
  return normalized;
}

export default function RootRouter() {
  const [path, setPath] = useState(resolveInitialPath);

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (next: string) => {
    const q = next.indexOf('?');
    const pathname = q >= 0 ? next.slice(0, q) : next;
    const search = q >= 0 ? next.slice(q) : '';
    const target = pathname.startsWith('/') ? pathname : `/${pathname}`;
    window.history.pushState({}, '', `${target}${search}`);
    setPath(normalizePath(target));
  };

  if (isViewerPath(path)) {
    return (
      <Suspense fallback={<StudioBootScreen />}>
        <ViewerPage />
      </Suspense>
    );
  }

  if (isAppPath(path)) {
    return (
      <Suspense fallback={<StudioBootScreen />}>
        <App mode="editor" />
      </Suspense>
    );
  }

  return (
    <LandingPage
      onStart={() => navigateTo('/app')}
      onStartDemo={() => navigateTo('/app?demo=party-dance')}
      onStartDemoGallery={() => navigateTo('/app?demo=gallery')}
      onStartDemoId={(id) => navigateTo(`/app?demo=${encodeURIComponent(id)}`)}
    />
  );
}
