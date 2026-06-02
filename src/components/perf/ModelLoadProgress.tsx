import { useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import {
  getModelLoadStatus,
  subscribeModelLoad,
  type ModelLoadStatus,
} from '../../perf/modelLoadProfile';
import { getAssetLoadingState, subscribeAssetLoading } from '../../perf/assetWarmupStore';

const getServerSnapshot = (): ModelLoadStatus => ({
  message: '',
  percent: null,
  elapsedSec: 0,
  visible: false,
  texturesLoaded: 0,
  texturesTotal: 0,
});

export default function ModelLoadProgress() {
  const status = useSyncExternalStore(
    subscribeModelLoad,
    getModelLoadStatus,
    getServerSnapshot
  );
  const assetLoading = useSyncExternalStore(
    subscribeAssetLoading,
    getAssetLoadingState,
    () => ({ isAssetLoading: false, message: '' })
  );

  const visible = status.visible || assetLoading.isAssetLoading;
  if (!visible) return null;

  const message = assetLoading.isAssetLoading
    ? assetLoading.message
    : status.message;

  const barWidth =
    assetLoading.isAssetLoading
      ? undefined
      : status.percent !== null
        ? Math.min(100, status.percent)
        : undefined;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 w-[min(100%,320px)] pointer-events-none">
      <div className="bg-gray-900/90 backdrop-blur-md rounded-xl px-5 py-3 shadow-lg border border-zinc-700/80">
        <div className="flex items-center gap-3 mb-2">
          <Loader2 className="w-5 h-5 text-[#39c5bb] animate-spin shrink-0" />
          <span className="text-sm font-medium text-white leading-snug">
            {status.message}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          {barWidth !== undefined ? (
            <div
              className="h-full bg-[#39c5bb] transition-[width] duration-150 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          ) : (
            <div className="h-full w-1/3 bg-[#39c5bb]/80 animate-pulse rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}
