import { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import App from '../App';
import { loadSceneFromViewerSearch } from '../product/viewer';
import type { AnimaStageScene } from '../product/scene/types';

type BootState = 'loading' | 'ready' | 'error';

export default function ViewerPage() {
  const [boot, setBoot] = useState<BootState>('loading');
  const [project, setProject] = useState<AnimaStageScene | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'AnimaStage Viewer — Watch MMD Scene';
    void (async () => {
      try {
        const loaded = await loadSceneFromViewerSearch(window.location.search);
        setProject(loaded);
        setBoot('ready');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load scene');
        setBoot('error');
      }
    })();
  }, []);

  if (boot === 'loading') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-[#0a0b0e] text-zinc-300">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm">Loading scene…</p>
      </div>
    );
  }

  if (boot === 'error' || !project) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-[#0a0b0e] text-zinc-300 px-6 text-center">
        <p className="text-lg font-semibold text-zinc-100">Scene unavailable</p>
        <p className="text-sm text-zinc-500 max-w-md">{error ?? 'Unknown error'}</p>
        <a
          href="./app"
          className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300"
        >
          <ExternalLink className="w-4 h-4" />
          Open editor
        </a>
      </div>
    );
  }

  return <App mode="viewer" initialProject={project} />;
}
