import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Upload,
  ScanSearch,
  Spline,
  Play,
  Video,
  Share2,
} from 'lucide-react';

const STEPS: { label: string; sub: string; icon: LucideIcon }[] = [
  { label: 'Try Demo', sub: '2 sec', icon: LayoutGrid },
  { label: 'Upload', sub: 'PMX/VMD', icon: Upload },
  { label: 'Analyze', sub: 'Auto-check', icon: ScanSearch },
  { label: 'Edit', sub: 'Pose + Curves', icon: Spline },
  { label: 'Preview', sub: 'Viewport', icon: Play },
  { label: 'Export', sub: 'MP4', icon: Video },
  { label: 'Share', sub: 'Shorts', icon: Share2 },
];

export default function FlowDiagram() {
  return (
    <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex items-stretch min-w-[640px] sm:min-w-0 sm:flex-wrap sm:justify-center gap-2 sm:gap-3">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 sm:gap-3">
            <div className="glass-panel rounded-xl px-3 py-3 sm:px-4 sm:py-4 min-w-[88px] sm:min-w-[100px] text-center">
              <step.icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-xs font-semibold text-zinc-100">{step.label}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{step.sub}</p>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
