import { useFrame } from '@react-three/fiber';
import { beginRenderFrame, endRenderFrame } from '../../utils/frameBudget';
import {
  beginFrameCpuGpuTiming,
  endCpuPhaseTiming,
} from '../../perf/frameCpuGpuTiming';

/** Bookends each render frame for budget + adaptive quality (does not touch animation/physics logic). */
export function PerfFrameBegin() {
  useFrame(() => {
    beginFrameCpuGpuTiming();
    beginRenderFrame();
  }, -999);
  return null;
}

export function PerfFrameEnd() {
  useFrame(() => {
    endCpuPhaseTiming();
    endRenderFrame();
  }, 999);
  return null;
}
