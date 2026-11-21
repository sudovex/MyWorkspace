'use client';

/**
 * Shared pointer plumbing for a clickable room object.
 *
 * Returns pointer handlers to spread onto a mesh/group, plus a `hoveredRef`
 * the object reads inside its own `useFrame` to drive its bespoke physical
 * response (the helmet turns, the book slides out, the screen brightens…).
 * The hook owns everything that is the same for every object: gating on the
 * room being interactive, the reference-counted cursor claim, publishing the
 * hover label to the store, and dispatching the click.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { useExperienceStore } from '@/stores/experienceStore';
import { type HotspotId } from '@/types/experience';
import { claimPointerCursor, releasePointerCursor } from './cursor';
import { HOTSPOTS, activateHotspot } from './hotspots';

export function useHotspot(id: HotspotId) {
  const invalidate = useThree((s) => s.invalidate);
  const enabled = useExperienceStore(
    (s) => s.phase === 'room_idle' && s.activePanel === null && !s.guideOpen,
  );
  const hoveredRef = useRef(false);
  const claimedRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const release = useCallback(() => {
    if (claimedRef.current) {
      releasePointerCursor();
      claimedRef.current = false;
    }
    if (hoveredRef.current) {
      hoveredRef.current = false;
      const store = useExperienceStore.getState();
      if (store.hovered?.id === id) store.setHovered(null);
    }
  }, [id]);

  useEffect(() => {
    if (!enabled) release();
  }, [enabled, release]);

  useEffect(() => release, [release]);

  const handlers = useMemo(
    () => ({
      onPointerOver: (event: ThreeEvent<PointerEvent>) => {
        if (!enabledRef.current) return;
        event.stopPropagation();
        hoveredRef.current = true;
        if (!claimedRef.current) {
          claimPointerCursor();
          claimedRef.current = true;
        }
        const { label, hint } = HOTSPOTS[id];
        useExperienceStore.getState().setHovered({ id, label, hint });
        invalidate();
      },
      onPointerOut: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        release();
        invalidate();
      },
      onClick: (event: ThreeEvent<MouseEvent>) => {
        if (!enabledRef.current) return;
        event.stopPropagation();
        release();
        activateHotspot(id);
        invalidate();
      },
    }),
    [id, invalidate, release],
  );

  return { hoveredRef, handlers, enabled };
}
