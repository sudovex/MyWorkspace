'use client';

/**
 * Drives the camera through the experience.
 *
 * One model for every move: the rig keeps a *base* pose (position + look-at)
 * and, whenever the place the camera should rest changes, tweens the base
 * there. What differs per moment is only the authoring:
 *  - `reveal`: the intro push-in — an authored, elapsed-time-driven timeline
 *    (`introTimeline.ts`: quintic weight, lagged look-at, a hair of overshoot,
 *    a shallow arc). Completes by transitioning to `room_idle`.
 *  - `zooming`: an eased dolly into the monitor (fitted to the viewport's
 *    aspect). Completes by transitioning to `os_active` and reporting the
 *    screen's on-page rectangle so the DOM terminal can sit exactly over it.
 *  - `room_idle`: eased moves between the desk pose and the "lean" poses used
 *    while a panel is open, plus two additive layers on top of the base — a
 *    slow sine "breathing" drift (`idleBreathing.ts`) and a damped mouse
 *    parallax (`mouseParallax.ts`). This is the one phase that deliberately
 *    keeps requesting frames — except behind an open panel, where the room
 *    eases to a stop and the render loop goes to sleep.
 *  - the "look left" turn (`sideLook.ts`): pushing the cursor against the
 *    left edge blends the whole rig toward the left-wall pose, and moving it
 *    back into the right of the screen blends it home. It is a blend on top
 *    of the base pose, not a new base, so it composes with everything else;
 *    leaving the desk bakes whatever is left of it into the base first, so
 *    no move ever starts with a jump.
 *
 * Performance: `frameloop="demand"` — frames are requested via `invalidate()`
 * only while something is animating. `os_active` renders nothing at all.
 *
 * Reduced motion: `prefersInstant` snaps to every resting pose with no
 * interpolation and disables breathing/parallax.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import { useExperienceStore } from '@/stores/experienceStore';
import { type ExperiencePhase } from '@/types/experience';
import { CAMERA_POSES, leftPoseFor, restingPose, type CameraPose } from './poses';
import { isPushInComplete, pushInLookAtAt, pushInPositionAt } from './introTimeline';
import { idleYOffsetAt, idleLookAtDriftAt } from './idleBreathing';
import { parallaxTargetAt } from './mouseParallax';
import { LOOK_SECONDS, approach, nextRoomView } from './sideLook';
import { easeInOutCubic } from '../utils/easing';
import { SCREEN } from '../room/layout';

/** Deliberately slow — this is what makes parallax read as lag, not tracking. */
const PARALLAX_DAMP_LAMBDA = 1.6;
/** How strongly the camera body follows the pointer (metres per unit parallax). */
const PARALLAX_BODY_GAIN = 1.35;
/** Below this, the room's residual motion is treated as stopped. */
const MOTION_REST_EPSILON = 0.004;

const ZOOM_IN_MS = 1700;
const ZOOM_OUT_MS = 1500;
const FOCUS_MS = 1150;

interface Tween {
  fromPosition: Vector3;
  fromTarget: Vector3;
  toPosition: Vector3;
  toTarget: Vector3;
  startedAt: number;
  durationMs: number;
}

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);

  const phase = useExperienceStore((s) => s.phase);
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);
  const panelOrigin = useExperienceStore((s) => s.panelOrigin);
  const panelOpen = useExperienceStore((s) => s.activePanel !== null);
  const roomView = useExperienceStore((s) => s.roomView);
  const guideOpen = useExperienceStore((s) => s.guideOpen);

  const basePosition = useRef(new Vector3(...CAMERA_POSES.roomWide.position));
  const baseTarget = useRef(new Vector3(...CAMERA_POSES.roomWide.target));
  const tween = useRef<Tween | null>(null);
  const previousPhase = useRef<ExperiencePhase>(phase);
  const introStart = useRef<number | null>(null);
  const idleStart = useRef(0);
  const parallax = useRef({ x: 0, y: 0 });
  const motionScale = useRef(1);
  const scratch = useRef(new Vector3());
  /** 0 = facing the desk, 1 = turned to the left wall (linear; eased on use). */
  const look = useRef(0);
  const lastPointerX = useRef(0);
  const leftPosition = useRef(new Vector3());
  const leftTarget = useRef(new Vector3());
  const lookedPosition = useRef(new Vector3());
  const lookedTarget = useRef(new Vector3());

  /** Blend `position` / `target` toward the left-wall pose by the eased turn. */
  const applyLook = (position: Vector3, target: Vector3) => {
    const k = easeInOutCubic(look.current);
    if (k <= 0) return;
    const pose = leftPoseFor(aspect);
    position.lerp(leftPosition.current.set(...pose.position), k);
    target.lerp(leftTarget.current.set(...pose.target), k);
  };

  /** Project the monitor glass into CSS pixels and publish it. */
  const reportScreenRect = () => {
    camera.position.copy(basePosition.current);
    camera.lookAt(baseTarget.current);
    camera.updateMatrixWorld();
    const [cx, cy, cz] = SCREEN.center;
    const bounds = gl.domElement.getBoundingClientRect();
    const project = (x: number, y: number) => {
      const v = scratch.current.set(x, y, cz).project(camera);
      return {
        x: bounds.left + ((v.x + 1) / 2) * bounds.width,
        y: bounds.top + ((1 - v.y) / 2) * bounds.height,
      };
    };
    const topLeft = project(cx - SCREEN.width / 2, cy + SCREEN.height / 2);
    const bottomRight = project(cx + SCREEN.width / 2, cy - SCREEN.height / 2);
    useExperienceStore.getState().setMonitorRect({
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    });
  };

  const snapTo = (pose: CameraPose) => {
    tween.current = null;
    basePosition.current.set(...pose.position);
    baseTarget.current.set(...pose.target);
    camera.position.copy(basePosition.current);
    camera.lookAt(baseTarget.current);
  };

  const tweenTo = (pose: CameraPose, durationMs: number) => {
    tween.current = {
      fromPosition: basePosition.current.clone(),
      fromTarget: baseTarget.current.clone(),
      toPosition: new Vector3(...pose.position),
      toTarget: new Vector3(...pose.target),
      startedAt: performance.now(),
      durationMs,
    };
  };

  // Decide how to get to the new resting pose whenever anything that defines
  // it changes: the phase, the open panel's origin, or the viewport's aspect.
  useEffect(() => {
    const from = previousPhase.current;
    previousPhase.current = phase;
    // Leaving the desk mid-turn: fold the turn into the base pose so the next
    // move starts exactly where the camera is.
    if (phase !== 'room_idle' && look.current > 0) {
      applyLook(basePosition.current, baseTarget.current);
      look.current = 0;
    }
    const goal = restingPose({
      phase,
      aspect,
      panelOrigin: panelOpen ? panelOrigin : null,
    });

    if (phase === 'reveal') {
      tween.current = null;
      if (prefersInstant) {
        snapTo(goal);
      } else {
        snapTo(CAMERA_POSES.roomWide);
        introStart.current = performance.now();
      }
      invalidate();
      return;
    }
    introStart.current = null;

    if (phase === 'room_idle') {
      if (from !== 'room_idle') idleStart.current = performance.now();
      const arrivedByCut =
        from !== 'reveal' && from !== 'os_active' && from !== 'zooming';
      if (prefersInstant || (from !== 'room_idle' && arrivedByCut)) {
        snapTo(goal);
      } else if (from === 'reveal') {
        // The push-in's last frame already landed here; only re-aim if the
        // viewport changed underneath it.
        snapTo(goal);
      } else {
        tweenTo(goal, from === 'room_idle' ? FOCUS_MS : ZOOM_OUT_MS);
      }
      invalidate();
      return;
    }

    if (phase === 'zooming') {
      if (prefersInstant) {
        snapTo(goal);
        reportScreenRect();
        useExperienceStore.getState().transition('os_active');
      } else {
        tweenTo(goal, ZOOM_IN_MS);
      }
      invalidate();
      return;
    }

    // `os_active` (incl. a resize while inside the OS) and every pre-reveal
    // phase: no travel, just be there.
    snapTo(goal);
    if (phase === 'os_active') reportScreenRect();
    invalidate();
    // `snapTo` / `tweenTo` / `reportScreenRect` only touch refs and stable
    // three objects; listing them would re-run this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, panelOrigin, panelOpen, aspect, prefersInstant, camera, invalidate]);

  // A view chosen from the HUD or the keyboard has to wake the render loop.
  useEffect(() => {
    invalidate();
  }, [roomView, invalidate]);

  useFrame((state, delta) => {
    const now = performance.now();

    // --- authored intro push-in -------------------------------------------
    if (phase === 'reveal' && introStart.current !== null) {
      const localMs = now - introStart.current;
      const end = restingPose({ phase: 'reveal', aspect, panelOrigin: null });
      if (isPushInComplete(localMs)) {
        snapTo(end);
        introStart.current = null;
        const store = useExperienceStore.getState();
        if (store.phase === 'reveal') store.transition('room_idle');
        return;
      }
      basePosition.current.set(
        ...pushInPositionAt(localMs, CAMERA_POSES.roomWide.position, end.position),
      );
      baseTarget.current.set(
        ...pushInLookAtAt(localMs, CAMERA_POSES.roomWide.target, end.target),
      );
      camera.position.copy(basePosition.current);
      camera.lookAt(baseTarget.current);
      invalidate();
      return;
    }

    // --- eased travel between resting poses -------------------------------
    const active = tween.current;
    if (active) {
      const t = Math.min(1, (now - active.startedAt) / active.durationMs);
      const eased = easeInOutCubic(t);
      basePosition.current.lerpVectors(active.fromPosition, active.toPosition, eased);
      baseTarget.current.lerpVectors(active.fromTarget, active.toTarget, eased);
      if (t >= 1) {
        tween.current = null;
        if (phase === 'zooming') {
          reportScreenRect();
          const store = useExperienceStore.getState();
          if (store.phase === 'zooming') store.transition('os_active');
          return;
        }
      }
    }

    // --- additive life: breathing + parallax (room_idle only) -------------
    if (phase === 'room_idle' && !prefersInstant) {
      // While a panel covers the room, the room's motion eases to a stop…
      // …and under the first-visit guide, whose arrows point at fixed spots
      // on the page, so the room must not drift out from under them.
      const still = panelOpen || guideOpen;
      motionScale.current = MathUtils.damp(
        motionScale.current,
        still ? 0 : 1,
        still ? 5 : 3,
        delta,
      );
      const scale = motionScale.current;

      // The head turn: decided by the cursor, eased here.
      if (!still) {
        const next = nextRoomView(roomView, state.pointer.x, lastPointerX.current);
        if (next !== roomView) useExperienceStore.getState().setRoomView(next);
      }
      lastPointerX.current = state.pointer.x;
      look.current = approach(
        look.current,
        roomView === 'left' && !panelOpen ? 1 : 0,
        delta / LOOK_SECONDS,
      );

      const [targetX, targetY] = parallaxTargetAt(state.pointer.x, state.pointer.y);
      parallax.current.x = MathUtils.damp(
        parallax.current.x,
        targetX,
        PARALLAX_DAMP_LAMBDA,
        delta,
      );
      parallax.current.y = MathUtils.damp(
        parallax.current.y,
        targetY,
        PARALLAX_DAMP_LAMBDA,
        delta,
      );
      const elapsedMs = now - idleStart.current;
      const px = parallax.current.x * scale;
      const py = parallax.current.y * scale;

      lookedPosition.current.copy(basePosition.current);
      lookedTarget.current.copy(baseTarget.current);
      applyLook(lookedPosition.current, lookedTarget.current);

      camera.position.set(
        lookedPosition.current.x + px * PARALLAX_BODY_GAIN,
        lookedPosition.current.y +
          idleYOffsetAt(elapsedMs) * scale +
          py * PARALLAX_BODY_GAIN,
        lookedPosition.current.z,
      );
      scratch.current.set(
        lookedTarget.current.x + idleLookAtDriftAt(elapsedMs) * scale - px * 0.6,
        lookedTarget.current.y - py * 0.6,
        lookedTarget.current.z,
      );
      camera.lookAt(scratch.current);
      // …and once it has, the scene stops rendering altogether: the panel is
      // opaque enough that nothing behind it is worth a frame, and a still
      // canvas makes the panel's backdrop blur free. Closing the panel
      // invalidates (see the effect above) and the loop resumes.
      const asleep =
        panelOpen &&
        tween.current === null &&
        scale < MOTION_REST_EPSILON &&
        look.current === 0;
      if (!asleep) invalidate();
      return;
    }

    // Reduced motion: the turn still exists (HUD / arrow keys), as a cut.
    if (phase === 'room_idle') {
      look.current = roomView === 'left' && !panelOpen ? 1 : 0;
      lookedPosition.current.copy(basePosition.current);
      lookedTarget.current.copy(baseTarget.current);
      applyLook(lookedPosition.current, lookedTarget.current);
      camera.position.copy(lookedPosition.current);
      camera.lookAt(lookedTarget.current);
      if (tween.current) invalidate();
      return;
    }

    camera.position.copy(basePosition.current);
    camera.lookAt(baseTarget.current);
    if (tween.current) invalidate();
  });

  return null;
}
