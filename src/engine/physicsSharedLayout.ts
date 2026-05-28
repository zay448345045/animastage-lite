/** Magic `MMDP` in header[0] */
export const PHYS_SAB_MAGIC = 0x4d4d4450;
export const PHYS_SAB_VERSION = 1;
export const PHYS_RING_SLOTS = 2;
export const PHYS_STRIDE = 7;
export const PHYS_HEADER_INT32_COUNT = 16;
export const PHYS_HEADER_BYTE_LENGTH = PHYS_HEADER_INT32_COUNT * 4;

export enum PhysHeaderIndex {
  Magic = 0,
  Version = 1,
  DynamicCount = 2,
  KinematicCount = 3,
  RingSlots = 4,
  /** Worker increments after writing a completed dynamics slot. */
  WriteSeq = 5,
  /** Main thread last consumed WriteSeq. */
  ReadSeq = 6,
  /** 0 idle, 1 = STEP pending, 2 = RESET pending */
  Command = 7,
  StepCount = 8,
  /** Worker: 0 idle, 1 busy */
  WorkerBusy = 9,
}

export enum PhysCommand {
  Idle = 0,
  Step = 1,
  Reset = 2,
}

export interface PhysicsSabViews {
  header: Int32Array;
  kinematic: Float32Array;
  ringSlots: Float32Array[];
}

export function isSharedPhysicsAvailable(): boolean {
  return (
    typeof SharedArrayBuffer !== 'undefined' &&
    typeof crossOriginIsolated !== 'undefined' &&
    crossOriginIsolated === true
  );
}

export function computePhysicsSabByteLength(
  dynamicCount: number,
  kinematicCount: number,
  ringSlots = PHYS_RING_SLOTS
): number {
  const kinBytes = kinematicCount * PHYS_STRIDE * 4;
  const ringBytes = ringSlots * dynamicCount * PHYS_STRIDE * 4;
  return PHYS_HEADER_BYTE_LENGTH + kinBytes + ringBytes;
}

export function attachPhysicsSabViews(
  sab: SharedArrayBuffer,
  dynamicCount: number,
  kinematicCount: number,
  ringSlots = PHYS_RING_SLOTS
): PhysicsSabViews {
  const header = new Int32Array(sab, 0, PHYS_HEADER_INT32_COUNT);
  const kinFloatCount = kinematicCount * PHYS_STRIDE;
  const slotFloatCount = dynamicCount * PHYS_STRIDE;

  const kinematic = new Float32Array(sab, PHYS_HEADER_BYTE_LENGTH, kinFloatCount);

  const ringStartByte = PHYS_HEADER_BYTE_LENGTH + kinFloatCount * 4;
  const ringSlotsViews: Float32Array[] = [];
  for (let i = 0; i < ringSlots; i++) {
    const byteOffset = ringStartByte + i * slotFloatCount * 4;
    ringSlotsViews.push(new Float32Array(sab, byteOffset, slotFloatCount));
  }

  return { header, kinematic, ringSlots };
}

export function initPhysicsSabHeader(
  header: Int32Array,
  dynamicCount: number,
  kinematicCount: number
): void {
  header[PhysHeaderIndex.Magic] = PHYS_SAB_MAGIC;
  header[PhysHeaderIndex.Version] = PHYS_SAB_VERSION;
  header[PhysHeaderIndex.DynamicCount] = dynamicCount;
  header[PhysHeaderIndex.KinematicCount] = kinematicCount;
  header[PhysHeaderIndex.RingSlots] = PHYS_RING_SLOTS;
  Atomics.store(header, PhysHeaderIndex.WriteSeq, 0);
  Atomics.store(header, PhysHeaderIndex.ReadSeq, 0);
  Atomics.store(header, PhysHeaderIndex.Command, PhysCommand.Idle);
  Atomics.store(header, PhysHeaderIndex.StepCount, 0);
  Atomics.store(header, PhysHeaderIndex.WorkerBusy, 0);
}

/** Slot index for the dynamics buffer associated with sequence number `seq` (1-based). */
export function ringSlotForSeq(seq: number, ringSlots = PHYS_RING_SLOTS): number {
  return (seq - 1) % ringSlots;
}
