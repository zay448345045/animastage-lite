/**
 * 2.39:1 cinematic letterbox (mmd_rtx) — CSS overlay, zero GPU cost.
 */
export default function LetterboxOverlay({
  enabled,
  aspect = 2.39,
}: {
  enabled: boolean;
  aspect?: number;
}) {
  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 z-[15] pointer-events-none flex flex-col"
      aria-hidden
    >
      <div className="flex-1 min-h-0 bg-black" />
      <div className="w-full shrink-0" style={{ aspectRatio: aspect }} />
      <div className="flex-1 min-h-0 bg-black" />
    </div>
  );
}
