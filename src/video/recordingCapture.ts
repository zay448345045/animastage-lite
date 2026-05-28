/** Global capture mode — hide gizmos/grid chrome during video export (mmd_rtx CAPTURE). */
export const recordingCaptureState = {
  active: false,
  hideDebug: true,
};

export function beginRecordingCapture(): void {
  recordingCaptureState.active = true;
}

export function endRecordingCapture(): void {
  recordingCaptureState.active = false;
}

export function isRecordingCapture(): boolean {
  return recordingCaptureState.active;
}
