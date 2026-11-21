/**
 * Shared easing primitives for the boot sequence and camera timelines.
 * Framework-free, pure — safe to unit test and to call from both DOM
 * (`boot/`) and WebGL (`camera/`, `room/objects/`) consumers.
 */

export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

export function easeOutCubic(t: number): number {
  const p = clamp01(t);
  return 1 - (1 - p) ** 3;
}

export function easeInOutCubic(t: number): number {
  const p = clamp01(t);
  return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
}

/**
 * Slower start/end than cubic — used for the pullback's position curve so
 * "the first 15% of time covers very little distance" (CONTEXT.md §5).
 */
export function easeInOutQuint(t: number): number {
  const p = clamp01(t);
  return p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
