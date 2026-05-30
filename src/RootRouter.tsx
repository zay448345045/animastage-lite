import { useEffect, useState } from 'react';
import App from './App.tsx';
import LandingPage from './pages/LandingPage.tsx';

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

export default function RootRouter() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

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

  if (isAppPath(path)) {
    return <App />;
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
