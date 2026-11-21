'use client';

/**
 * Tells the DOM where the room's clickable objects are on the page.
 *
 * The first-visit guide (in `features/interface`) draws arrows to them, but
 * the interface knows nothing about three.js — so while the guide is open,
 * this projects each object's guide target through the camera and publishes
 * the result to the store, the same way the camera rig publishes the monitor
 * screen's rectangle. It only writes when a point has actually moved, so once
 * the camera has come to rest it costs a few vector projections a frame and
 * no React work at all. Renders nothing.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useExperienceStore } from '@/stores/experienceStore';
import { type GuidePoints, type HotspotId, type ScreenPoint } from '@/types/experience';
import { GUIDE_HOTSPOTS, guideTarget } from './hotspots';

/** Publish again only if some point moved at least this far, CSS px. */
const MOVED_PX = 0.75;

export function GuideProjector() {
  const open = useExperienceStore((s) => s.guideOpen);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const scratch = useRef(new Vector3());
  const published = useRef<GuidePoints | null>(null);

  useEffect(() => {
    published.current = null;
    if (open) invalidate();
  }, [open, size, invalidate]);

  useFrame(() => {
    if (!open) return;
    camera.updateMatrixWorld();
    const bounds = gl.domElement.getBoundingClientRect();
    const next: Partial<Record<HotspotId, ScreenPoint>> = {};
    let moved = published.current === null;
    for (const id of GUIDE_HOTSPOTS) {
      const v = scratch.current.set(...guideTarget(id)).project(camera);
      // behind the camera or outside the view: no arrow for this one
      if (v.z > 1 || Math.abs(v.x) > 1 || Math.abs(v.y) > 1) continue;
      const point = {
        x: bounds.left + ((v.x + 1) / 2) * bounds.width,
        y: bounds.top + ((1 - v.y) / 2) * bounds.height,
      };
      next[id] = point;
      const before = published.current?.[id];
      if (
        !before ||
        Math.abs(before.x - point.x) > MOVED_PX ||
        Math.abs(before.y - point.y) > MOVED_PX
      ) {
        moved = true;
      }
    }
    if (moved) {
      published.current = next;
      useExperienceStore.getState().setGuidePoints(next);
    }
  });

  return null;
}
