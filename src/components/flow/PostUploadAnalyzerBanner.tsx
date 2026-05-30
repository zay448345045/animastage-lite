import { AlertTriangle, Sparkles, X } from 'lucide-react';
import type { ModelAnalysisReport } from '../../analyzer/types';

interface PostUploadAnalyzerBannerProps {
  report: ModelAnalysisReport;
  analyzing?: boolean;
  onFixAutomatically: () => void;
  onDismiss: () => void;
  onOpenDetails?: () => void;
}

export default function PostUploadAnalyzerBanner({
  report,
  analyzing = false,
  onFixAutomatically,
  onDismiss,
  onOpenDetails,
}: PostUploadAnalyzerBannerProps) {
  const topIssues = report.issues
    .filter((i) => i.severity !== 'info')
    .slice(0, 2);

  const hasWarnings = topIssues.length > 0 || report.stats.missingTextureCount > 0;

  return (
    <div className="absolute top-3 left-3 right-3 z-30 max-w-md mx-auto pointer-events-none">
      <div className="pointer-events-auto rounded-xl border border-amber-500/35 bg-[#14120e]/95 backdrop-blur-md shadow-lg px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-100">
                {analyzing ? 'Analyzing model…' : 'Model Analyzer'}
              </p>
              {!analyzing && (
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {report.stats.boneCount} bones · {report.stats.vertexCount.toLocaleString()}{' '}
                  verts
                  {report.stats.missingTextureCount > 0 &&
                    ` · ${report.stats.missingTextureCount} missing tex`}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {!analyzing && hasWarnings && (
          <ul className="mt-2 space-y-1">
            {topIssues.map((issue) => (
              <li
                key={issue.id}
                className="flex gap-1.5 text-[10px] text-zinc-400 leading-snug"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-300">{issue.title}</strong> — {issue.detail}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!analyzing && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {hasWarnings && (
              <button
                type="button"
                onClick={onFixAutomatically}
                className="text-[10px] font-bold uppercase tracking-wide bg-amber-600 hover:bg-amber-500 text-zinc-950 px-2.5 py-1.5 rounded cursor-pointer"
              >
                Fix automatically
              </button>
            )}
            {onOpenDetails && (
              <button
                type="button"
                onClick={onOpenDetails}
                className="text-[10px] font-bold text-zinc-400 hover:text-cyan-300 px-2 py-1.5 cursor-pointer"
              >
                Details in Edit tab
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
