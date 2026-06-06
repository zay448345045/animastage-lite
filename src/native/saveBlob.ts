import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const EXPORT_DIR = 'mmd-exports';

export interface SaveBlobResult {
  ok: boolean;
  /** Browser anchor download */
  method?: 'download' | 'native';
  /** Relative path under app Documents */
  path?: string;
  /** Android/iOS share sheet was opened */
  shared?: boolean;
  message: string;
}

function browserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('Failed to read video data'));
        return;
      }
      const comma = dataUrl.indexOf(',');
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Persist export on device. Browser: Downloads via &lt;a download&gt;.
 * Native WebView: write to app Documents, then open system Share (Save to Files / Gallery).
 */
export async function saveBlob(blob: Blob, filename: string): Promise<SaveBlobResult> {
  if (!Capacitor.isNativePlatform()) {
    browserDownload(blob, filename);
    return { ok: true, method: 'download', message: 'Saved to your browser Downloads folder' };
  }

  const safeName = filename.replace(/[^\w.\-]+/g, '_');
  const path = `${EXPORT_DIR}/${safeName}`;

  try {
    await Filesystem.mkdir({
      path: EXPORT_DIR,
      directory: Directory.Documents,
      recursive: true,
    }).catch(() => {
      /* already exists */
    });

    const data = await blobToBase64(blob);
    await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Documents,
    });

    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Documents,
    });

    let shared = false;
    try {
      await Share.share({
        title: 'AnimaStage video',
        text: safeName,
        files: [uri],
        dialogTitle: 'Save video',
      });
      shared = true;
    } catch (e) {
      const msg = (e as Error).message ?? '';
      if (!/cancel|abort|dismiss/i.test(msg)) {
        console.warn('[saveBlob] Share sheet failed', e);
      }
    }

    const hint = shared
      ? 'Video saved — pick “Save to Files” or a gallery app in the share menu'
      : `Video saved in app files: Documents/${path}. Open Files → AnimaStage Lite`;

    return {
      ok: true,
      method: 'native',
      path,
      shared,
      message: hint,
    };
  } catch (e) {
    const msg = (e as Error).message || 'Could not save video on device';
    console.error('[saveBlob]', e);
    return { ok: false, message: msg };
  }
}

export function videoSaveLocationHint(): string {
  if (Capacitor.isNativePlatform()) {
    return 'After export, use the share menu to save the video (Files, Gallery, Drive…)';
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/Android/i.test(ua)) {
    return 'Saved to Downloads (mmd-render-*.mp4 or mmd-record-*.webm)';
  }
  return 'Saved to your browser Downloads folder';
}
