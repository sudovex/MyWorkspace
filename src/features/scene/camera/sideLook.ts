/**
 * When the head turns — pure rule for the "look left" move.
 *
 * At the desk the visitor can push the cursor against the left edge of the
 * screen to turn toward the left wall, and move it back into the right part
 * of the screen to face the desk again. Two different thresholds (hysteresis)
 * on purpose: once turned, everything that slid into view — the window, the
 * prints, the helmet — can be pointed at without the camera swinging away.
 *
 * It only reacts to the cursor *moving* in the direction of the turn, so a
 * view chosen from the keyboard or the HUD is not undone by a cursor that
 * merely happens to be resting on the other side.
 *
 * `pointerX` is normalised device x: -1 at the left edge, 1 at the right.
 */
import { type RoomView } from '@/types/experience';

/** Turn left once the cursor is in the outer ~9% of the screen… */
export const LOOK_LEFT_AT = -0.82;
/** …and face the desk again once it is right of this (≈ the right third). */
export const LOOK_BACK_AT = 0.3;
/** Seconds the head takes to turn. */
export const LOOK_SECONDS = 1.15;

export function nextRoomView(
  view: RoomView,
  pointerX: number,
  previousPointerX: number,
): RoomView {
  const dx = pointerX - previousPointerX;
  if (view === 'desk' && dx < 0 && pointerX <= LOOK_LEFT_AT) return 'left';
  if (view === 'left' && dx > 0 && pointerX >= LOOK_BACK_AT) return 'desk';
  return view;
}

/** Move `value` toward `target` by at most `step` (both 0..1). */
export function approach(value: number, target: number, step: number): number {
  if (value < target) return Math.min(target, value + step);
  if (value > target) return Math.max(target, value - step);
  return value;
}
