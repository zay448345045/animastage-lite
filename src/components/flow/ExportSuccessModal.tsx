import { useState } from 'react';
import { Check, Copy, Download, Share2, X } from 'lucide-react';
import { saveWatermarkPref, loadWatermarkPref } from '../../flow/storage';

const SITE_URL = 'https://animastage-lite.app';

interface ExportSuccessModalProps {
  open: boolean;
  fileName: string;
  blob: Blob | null;
  onClose: () => void;
  onSaveProject?: () => void;
}

export default function ExportSuccessModal({
  open,
  fileName,
  blob,
  onClose,
  onSaveProject,
}: ExportSuccessModalProps) {
  const [watermark, setWatermark] = useState(loadWatermarkPref);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleDownload = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `Made with AnimaStage Lite — MMD in the browser\n${SITE_URL}`;
    if (blob && navigator.share) {
      try {
        const file = new File([blob], fileName, { type: blob.type });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My MMD animation',
            text,
            files: [file],
          });
          return;
        }
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.share({ title: 'AnimaStage Lite', text, url: SITE_URL });
    } catch {
      void navigator.clipboard?.writeText(`${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard?.writeText(SITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleWatermark = () => {
    const next = !watermark;
    setWatermark(next);
    saveWatermarkPref(next);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Export complete"
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-[#16181d] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <Check className="w-5 h-5" />
            <span className="font-bold text-white text-sm">Video ready</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-zinc-500 font-mono truncate">{fileName}</p>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!blob}
              className="flex items-center justify-center gap-2 w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-zinc-950 font-bold text-sm py-2.5 rounded-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex items-center justify-center gap-2 w-full border border-zinc-600 hover:border-cyan-500/40 text-zinc-200 font-semibold text-sm py-2.5 rounded-lg cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Share your animation
            </button>
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="flex items-center justify-center gap-2 w-full text-zinc-400 hover:text-cyan-300 text-xs font-semibold py-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Link copied!' : 'Copy animastage-lite.app link'}
            </button>
          </div>

          <label className="flex items-center gap-2 text-[10px] text-zinc-500 cursor-pointer">
            <input
              type="checkbox"
              checked={watermark}
              onChange={toggleWatermark}
              className="rounded border-zinc-600"
            />
            Remember watermark preference (burn-in coming soon)
          </label>

          {onSaveProject && (
            <button
              type="button"
              onClick={onSaveProject}
              className="w-full text-[10px] font-bold text-violet-300 hover:text-violet-200 py-2 border border-violet-500/30 rounded-lg cursor-pointer"
            >
              Save project to continue later
            </button>
          )}

          <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
            Tip: share with &ldquo;Made with AnimaStage Lite&rdquo; so friends can try MMD online.
          </p>
        </div>
      </div>
    </div>
  );
}
