import type { CameraSnapshot } from '../types';

const STORAGE_KEY = 'webmmd_camera_bookmarks_v1';
const MAX_SLOTS = 12;

export interface CameraBookmark {
  id: string;
  name: string;
  snapshot: CameraSnapshot;
  createdAt: number;
}

export function loadCameraBookmarks(): CameraBookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CameraBookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCameraBookmarks(bookmarks: CameraBookmark[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.slice(0, MAX_SLOTS)));
}

export function addCameraBookmark(
  name: string,
  snapshot: CameraSnapshot,
  bookmarks: CameraBookmark[]
): CameraBookmark[] {
  const entry: CameraBookmark = {
    id: `cam_${Date.now()}`,
    name: name.trim() || `Cam ${bookmarks.length + 1}`,
    snapshot,
    createdAt: Date.now(),
  };
  return [...bookmarks, entry].slice(-MAX_SLOTS);
}

export function removeCameraBookmark(
  id: string,
  bookmarks: CameraBookmark[]
): CameraBookmark[] {
  return bookmarks.filter((b) => b.id !== id);
}

export function exportBookmarksJson(bookmarks: CameraBookmark[]): string {
  return JSON.stringify(bookmarks, null, 2);
}

export function importBookmarksJson(json: string): CameraBookmark[] {
  const parsed = JSON.parse(json) as CameraBookmark[];
  if (!Array.isArray(parsed)) throw new Error('Invalid bookmark file');
  return parsed.slice(0, MAX_SLOTS);
}
