import type { PoseSnapshotV1 } from './poseTypes';

const STORAGE_KEY = 'animastage-lite-custom-poses';

export function loadCustomPoses(): PoseSnapshotV1[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is PoseSnapshotV1 =>
        typeof p === 'object' &&
        p !== null &&
        (p as PoseSnapshotV1).version === 1 &&
        typeof (p as PoseSnapshotV1).id === 'string'
    );
  } catch {
    return [];
  }
}

export function saveCustomPoses(poses: PoseSnapshotV1[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(poses));
}

export function addCustomPose(pose: PoseSnapshotV1): PoseSnapshotV1[] {
  const list = loadCustomPoses().filter((p) => p.id !== pose.id);
  list.push(pose);
  saveCustomPoses(list);
  return list;
}

export function removeCustomPose(id: string): PoseSnapshotV1[] {
  const list = loadCustomPoses().filter((p) => p.id !== id);
  saveCustomPoses(list);
  return list;
}

export function downloadPoseJson(pose: PoseSnapshotV1): void {
  const blob = new Blob([JSON.stringify(pose, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pose.name.replace(/\s+/g, '_')}.pose.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parsePoseJsonFile(text: string): PoseSnapshotV1 {
  const parsed = JSON.parse(text) as PoseSnapshotV1;
  if (parsed.version !== 1 || !parsed.bones || !parsed.morphs) {
    throw new Error('Invalid pose file (expected version 1)');
  }
  return {
    ...parsed,
    version: 1,
    id: parsed.id || `pose_${Date.now()}`,
    thumbnail: parsed.thumbnail || '📁',
  };
}
