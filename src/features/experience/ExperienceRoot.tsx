'use client';

/**
 * Top-level client entry — the composition root for the three runtimes.
 *
 * Responsibilities (single): choose the correct rendering path for the device
 * and mount it. It contains no scene, interface or OS logic of its own, and it
 * is the only place the three are allowed to appear side by side — they never
 * import each other and talk only through `experienceStore`.
 *
 *  - Every device gets `AmbientSound` (rain + slow music, generated in the
 *    browser). Like the other runtimes it only follows the store.
 *  - Capable device → the R3F `Scene` (dynamically imported, `ssr: false`, so
 *    WebGL never touches the server) + `BootOverlay` (the intro) + the
 *    interface layer (HUD, résumé / gallery / contact panels) + the monitor's
 *    OS (the terminal).
 *  - Low tier → no WebGL at all. `black → os_active` is the FSM's low-power
 *    path: the terminal opens full-screen over a static landing page, and the
 *    same panels work from it.
 *  - Reduced motion → `black → room_idle`: the room appears already lit, at
 *    the desk, with no camera travel anywhere in the experience.
 */
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useExperienceStore } from '@/stores/experienceStore';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { StaticFallback } from '@/features/scene/StaticFallback';
import { DebugPanel } from '@/features/scene/DebugPanel';
import { BootOverlay } from '@/features/scene/boot/BootOverlay';
import { InterfaceRoot } from '@/features/interface/InterfaceRoot';
import { MonitorOS } from '@/features/os/MonitorOS';
import { AmbientSound } from '@/features/audio/AmbientSound';

const Scene = dynamic(() => import('@/features/scene/Scene'), { ssr: false });

/** `?debug` shows the FSM walker in development. */
function debugRequested(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug')
  );
}

export function ExperienceRoot() {
  const tier = useDeviceTier();
  const prefersReducedMotion = usePrefersReducedMotion();

  const setInstant = useExperienceStore((s) => s.setPrefersInstantEntry);
  const transition = useExperienceStore((s) => s.transition);
  const phase = useExperienceStore((s) => s.phase);

  useEffect(() => {
    setInstant(prefersReducedMotion);
  }, [prefersReducedMotion, setInstant]);

  // The two accessibility / capability exits out of `black`. Otherwise
  // `BootOverlay` owns the black→post→… progression itself.
  useEffect(() => {
    if (!tier || phase !== 'black') return;
    if (tier === 'low') transition('os_active');
    else if (prefersReducedMotion) transition('room_idle');
  }, [tier, prefersReducedMotion, phase, transition]);

  if (!tier) return null;

  const capable = tier !== 'low';

  return (
    <>
      {capable ? <Scene tier={tier} /> : <StaticFallback />}
      {capable && <BootOverlay />}
      <InterfaceRoot hasRoom={capable} />
      <MonitorOS hasRoom={capable} />
      <AmbientSound />
      {debugRequested() && <DebugPanel tier={tier} />}
    </>
  );
}
