/**
 * Pure, frame-rate-independent authored camera push-in — the `reveal` FSM
 * phase. The page opens on a wide establishing shot and the camera travels in
 * to the desk:
 *
 *   - a quintic ease, so the first and last stretches of the move cover very
 *     little distance ("mass" — the camera has to get going, and to stop).
 *   - split curves: position leads; the look-at lags `LOOKAT_LAG_MS` behind on
 *     a gentler cubic, so the frame is still resolving as the camera arrives.
 *   - the position overshoots the desk pose by a hair, then settles back over
 *     the last `SETTLE_MS`.
 *   - a shallow lateral arc, so the path reads as a crane move, not a zoom.
 *
 * Framework-free (no three.js) so it's unit-testable in isolation, same
 * convention as `camera/poses.ts`. `CameraRig` is the only caller: it supplies
 * `localMs` from its own per-frame clock and writes the results onto the live
 * `Vector3`s.
 */
import {
  easeInOutCubic,
  easeInOutQuint,
  easeOutCubic,
  clamp01,
  lerp,
} from '../utils/easing';
import { type Vec3 } from '../room/layout';

export const PUSH_IN_DURATION_MS = 3400;
/** Position overshoots, then settles back over this tail window. */
export const SETTLE_MS = 700;
/** How far position overshoots the final pose, as a fraction of the travel. */
export const OVERSHOOT_FRACTION = 0.012;
/** Look-at starts this long after position does. */
export const LOOKAT_LAG_MS = 220;
/** Peak sideways deviation of the path, world units (at the move's midpoint). */
export const ARC_AMPLITUDE = 0.22;
/** How long the returning-visitor cut holds black before the push-in. */
export const RETURNING_BLACK_MS = 250;

const MAIN_DURATION_MS = PUSH_IN_DURATION_MS - SETTLE_MS;

function lerp3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** `end` extrapolated `OVERSHOOT_FRACTION` past itself, away from `start`. */
function overshootTarget(start: Vec3, end: Vec3): Vec3 {
  return lerp3(start, end, 1 + OVERSHOOT_FRACTION);
}

/** 0 at both ends of the move, 1 at its midpoint. */
function arcWeight(localMs: number): number {
  const t = clamp01(localMs / PUSH_IN_DURATION_MS);
  return Math.sin(Math.PI * easeInOutCubic(t));
}

/**
 * Camera position at `localMs`: quintic ease from `start` toward a slightly
 * overshot pose, easing back to the exact `end` over the final `SETTLE_MS`,
 * with a lateral (−X) arc that vanishes at both ends.
 */
export function pushInPositionAt(localMs: number, start: Vec3, end: Vec3): Vec3 {
  if (localMs >= PUSH_IN_DURATION_MS) return end;
  const overshoot = overshootTarget(start, end);
  let base: Vec3;
  if (localMs <= MAIN_DURATION_MS) {
    const t = easeInOutQuint(clamp01(localMs / MAIN_DURATION_MS));
    base = lerp3(start, overshoot, t);
  } else {
    const t = easeOutCubic(clamp01((localMs - MAIN_DURATION_MS) / SETTLE_MS));
    base = lerp3(overshoot, end, t);
  }
  return [base[0] - ARC_AMPLITUDE * arcWeight(localMs), base[1], base[2]];
}

/**
 * Look-at target at `localMs`: starts `LOOKAT_LAG_MS` after position, on a
 * gentler cubic curve, reaching the exact `end` (no overshoot) exactly when
 * the push-in completes.
 */
export function pushInLookAtAt(localMs: number, start: Vec3, end: Vec3): Vec3 {
  const span = PUSH_IN_DURATION_MS - LOOKAT_LAG_MS;
  const t = easeInOutCubic(clamp01((localMs - LOOKAT_LAG_MS) / span));
  return lerp3(start, end, t);
}

export function isPushInComplete(localMs: number): boolean {
  return localMs >= PUSH_IN_DURATION_MS;
}
