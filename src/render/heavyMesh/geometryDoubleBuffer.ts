/**
 * Double-buffer for morph target influences — reduces GPU upload stalls on heavy models.
 */
export class MorphInfluenceDoubleBuffer {
  private read: Float32Array;
  private write: Float32Array;

  constructor(size: number) {
    this.read = new Float32Array(size);
    this.write = new Float32Array(size);
  }

  resize(size: number): void {
    if (this.read.length === size) return;
    this.read = new Float32Array(size);
    this.write = new Float32Array(size);
  }

  /** Copy source influences into write buffer. */
  copyFrom(source: number[] | Float32Array): void {
    const len = Math.min(source.length, this.write.length);
    for (let i = 0; i < len; i++) {
      this.write[i] = source[i] ?? 0;
    }
  }

  /** Swap buffers after CPU-side morph work is done. */
  flip(): Float32Array {
    const tmp = this.read;
    this.read = this.write;
    this.write = tmp;
    return this.read;
  }

  get readBuffer(): Float32Array {
    return this.read;
  }
}

export function syncMorphDoubleBuffer(
  sourceInfluences: number[] | undefined,
  buffer: MorphInfluenceDoubleBuffer | null,
  targets: Array<{ morphTargetInfluences?: number[] }>
): void {
  if (!sourceInfluences || !buffer) return;
  buffer.resize(sourceInfluences.length);
  buffer.copyFrom(sourceInfluences);
  const synced = buffer.flip();
  for (const t of targets) {
    if (!t.morphTargetInfluences) continue;
    for (let i = 0; i < synced.length; i++) {
      t.morphTargetInfluences[i] = synced[i]!;
    }
  }
}
