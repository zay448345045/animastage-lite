import { useThree, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { CharacterQuality, ViewportFormat } from '../../types';
import { resolveEffectiveCanvasDpr } from '../../perf/controller/effectiveDpr';
import { getPortraitStressDprCap } from '../../perf/scenePerfPolicy';

const DPR_CHANGE_COOLDOWN_MS = 2500;

interface AdaptiveDprSyncProps {
  characterQuality: CharacterQuality;
  viewportFormat: ViewportFormat;
  portraitLite?: boolean;
  rtxEnabled?: boolean;
  templateMotion?: boolean;
}

/** Applies adaptive pixel ratio without touching animation / physics. */
export function AdaptiveDprSync({
  characterQuality,
  viewportFormat,
  portraitLite = false,
  rtxEnabled = false,
  templateMotion = false,
}: AdaptiveDprSyncProps) {
  const { gl } = useThree();
  const lastApplied = useRef(-1);
  const lastChangeMs = useRef(0);

  useFrame(() => {
    const dprSpec = resolveEffectiveCanvasDpr(characterQuality, viewportFormat);
    let target =
      typeof dprSpec === 'number'
        ? dprSpec
        : Math.min(window.devicePixelRatio || 1, dprSpec[1]);

    // Governor + degrade already applied in resolveEffectiveCanvasDpr — do not multiply twice.
    const stressCap = getPortraitStressDprCap(
      viewportFormat,
      rtxEnabled,
      templateMotion
    );
    const capped = Math.min(target, portraitLite ? stressCap : 2);
    const rounded = Math.round(capped * 1000) / 1000;
    if (Math.abs(rounded - lastApplied.current) < 0.02) return;

    const now = performance.now();
    if (now - lastChangeMs.current < DPR_CHANGE_COOLDOWN_MS && lastApplied.current > 0) {
      return;
    }

    gl.setPixelRatio(rounded);
    lastApplied.current = rounded;
    lastChangeMs.current = now;
  });

  return null;
}

export default AdaptiveDprSync;
