/**
 * Pure mapping from normalized pointer position (NDC, [-1, 1] on both axes —
 * matches R3F's `state.pointer`) to a small look-at-target offset: the
 * "extremely subtle mouse parallax" for `room_idle`. Clamped well under 2°
 * of apparent camera rotation at the `roomReveal` viewing distance
 * (~2.39m — camera-to-target distance for that pose).
 *
 * This module only defines *where* the parallax target is. The lag/ease
 * ("should feel like head movement, not orbit controls") is applied by the
 * caller (`CameraRig`) via frame-rate-independent damping on top of this
 * target, not here — keeps the pure math and the per-frame smoothing
 * separate, same split as every other timeline in this codebase.
 */

/** ~1.4° at the roomReveal viewing distance. */
export const PARALLAX_MAX_X = 0.06;
/** ~0.84° — smaller than X; horizontal head-turn reads more naturally than vertical. */
export const PARALLAX_MAX_Y = 0.035;

function clamp11(v: number): number {
  return Math.min(1, Math.max(-1, v));
}

export function parallaxTargetAt(
  pointerX: number,
  pointerY: number,
): readonly [number, number] {
  return [clamp11(pointerX) * PARALLAX_MAX_X, clamp11(pointerY) * PARALLAX_MAX_Y];
}
