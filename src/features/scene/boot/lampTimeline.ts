/**
 * Pure timing model for the lamp ramp — the `booting` FSM phase.
 * Traces to `CONTEXT.md` §5: 2.70–3.85 lamp ramp (1.15s, non-linear,
 * 2200K → 2900K), held inside a slightly longer 2.70–3.95 `booting` window
 * so there's a beat of settle before `monitor_on` (Welcome) begins.
 *
 * The lamp ramps for real here even though it isn't on screen yet — the
 * camera is still tight on the monitor and `BootOverlay` is still opaque.
 * That's intentional, not a bug: per the core inversion
 * (`DESIGN_PHILOSOPHY.md` §2), the lamp must already be fully on *before*
 * the camera ever reveals it in Shot 3. `localMs` is measured from 0 at the
 * moment the `booting` phase begins.
 */
import { clamp01, easeInOutCubic, lerp } from '../utils/easing';

/** 2.70–3.85 in the beat sheet. */
export const LAMP_RAMP_MS = 1150;
/** 2.70–3.95 — the full `booting` phase, including settle after the ramp. */
export const BOOTING_DURATION_MS = 1250;

/**
 * Target intensity — the lamp's resting peak once fully on. Tuned for
 * "warmer, not brighter": reach comes from `distance` and the bounce fill
 * below, not from cranking this up. Kept close to the original placeholder
 * value rather than the brighter one from the first lighting pass.
 */
export const LAMP_INTENSITY_END = 2.5;
/** Ignition window: a brief tungsten flicker before the ramp stabilizes. */
export const FLICKER_MS = 220;

type RGB = readonly [number, number, number];

/** ~2000K — a deep, saturated ember; warmer than a neutral incandescent start. */
const COLOR_START: RGB = [255, 118, 42];
/** ~2700K — a rich, saturated tungsten amber. Warmer than a "clean" white-orange. */
const COLOR_END: RGB = [255, 168, 88];

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function rgbToCss([r, g, b]: RGB): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

const FLICKER_AMPLITUDE = 0.32;
const FLICKER_FREQ_1 = 0.085;
const FLICKER_FREQ_2 = 0.21;
const FLICKER_PHASE_2 = 1.3;

/**
 * A decaying, two-frequency intensity perturbation confined to the first
 * `FLICKER_MS` — the filament "catching" before it stabilizes. Reaches
 * (effectively) zero by `FLICKER_MS` so it blends into the smooth ramp
 * below with no visible seam; deterministic (not `Math.random()`) so it's
 * exactly reproducible and unit-testable.
 */
function flickerOffsetAt(localMs: number): number {
  if (localMs < 0 || localMs >= FLICKER_MS) return 0;
  const envelope = (1 - localMs / FLICKER_MS) ** 2;
  const wave =
    0.7 * Math.sin(localMs * FLICKER_FREQ_1) +
    0.3 * Math.sin(localMs * FLICKER_FREQ_2 + FLICKER_PHASE_2);
  return envelope * FLICKER_AMPLITUDE * wave;
}

/**
 * Point-light intensity at `localMs`: the eased ramp, plus a brief ignition
 * flicker in the first `FLICKER_MS`, holding at peak once fully ramped.
 */
export function lampIntensityAt(localMs: number): number {
  if (localMs <= 0) return 0;
  const t = easeInOutCubic(clamp01(localMs / LAMP_RAMP_MS));
  const base = LAMP_INTENSITY_END * t;
  return Math.max(0, base + flickerOffsetAt(localMs));
}

/** Point-light colour at `localMs`, warming from ember to tungsten. */
export function lampColorAt(localMs: number): RGB {
  if (localMs <= 0) return COLOR_START;
  const t = easeInOutCubic(clamp01(localMs / LAMP_RAMP_MS));
  return lerpRgb(COLOR_START, COLOR_END, t);
}

export function isBootingComplete(localMs: number): boolean {
  return localMs >= BOOTING_DURATION_MS;
}

/**
 * The indirect bounce fill — a second, much dimmer light standing in for
 * light bouncing off the desk, broadening the illuminated area beyond the
 * key light's own falloff so the desk reads as evenly warm-lit rather than
 * a single hot spot ("the lamp still feels like a spotlight"). Starts
 * `BOUNCE_DELAY_MS` after the key light, and ramps smoothly with no
 * flicker of its own — one flickering light in a room is a detail; two
 * flickering in sync is a coincidence the eye notices. Reuses the key
 * light's own colour progression (a bounce is the same light, softened).
 */
export const BOUNCE_DELAY_MS = 200;
export const BOUNCE_INTENSITY_END = 0.85;

export function bounceIntensityAt(localMs: number): number {
  const t = easeInOutCubic(clamp01((localMs - BOUNCE_DELAY_MS) / LAMP_RAMP_MS));
  return BOUNCE_INTENSITY_END * t;
}

export function bounceColorAt(localMs: number): RGB {
  const delayed = localMs - BOUNCE_DELAY_MS;
  if (delayed <= 0) return COLOR_START;
  const t = easeInOutCubic(clamp01(delayed / LAMP_RAMP_MS));
  return lerpRgb(COLOR_START, COLOR_END, t);
}
