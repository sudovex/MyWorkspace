/**
 * Pure, frame-rate-independent timing model for Shot 1 of the boot sequence
 * (black hold → monitor wake → POST). Every value here is milliseconds and
 * traces directly to the locked beat sheet in `CONTEXT.md` §5.
 *
 * Absolute timestamps (seconds, from the moment `black` begins):
 *   0.00–0.40  black hold
 *   0.40–0.55  monitor wake (panel spikes to ~118%)
 *   0.55–2.50  POST (3 lines, 600ms stagger; panel settles 118% → 100%)
 *   2.50–2.70  clear to fill (POST clears in one frame; panel to peak)
 *
 * The POST lines were originally 340ms apart with a 420ms hold — on screen
 * for barely a second, too fast to read on a first visit (owner's note). They
 * now arrive at a reading pace and the last one is held for 750ms.
 *
 * The `post` FSM phase owns wake + POST + clear-to-fill as one continuous
 * span, so every function below takes `localMs` measured from 0 at the
 * *start of wake* (absolute 0.40s) — i.e. the above becomes 0–150–2100–2300.
 * `BootOverlay` is the only caller; it supplies `localMs` from its own
 * `requestAnimationFrame` loop.
 */
import { easeOutCubic, easeInOutCubic } from '../utils/easing';

export const BLACK_HOLD_MS = 400;
export const WAKE_MS = 150;
/** Time between one POST line appearing and the next — a reading pace. */
export const POST_LINE_STAGGER_MS = 600;
export const POST_LINE_COUNT = 3;
/** Hold after the last line appears, before POST clears. */
const POST_HOLD_AFTER_LAST_LINE_MS = 750;
/** The panel's ramp to peak brightness once the text has cleared. */
const CLEAR_TO_FILL_MS = 200;
/** Local ms (from wake start) at which POST clears. */
export const POST_CLEAR_AT_MS =
  WAKE_MS + (POST_LINE_COUNT - 1) * POST_LINE_STAGGER_MS + POST_HOLD_AFTER_LAST_LINE_MS;
/** Total `post`-phase duration: wake + POST + clear-to-fill. */
export const POST_PHASE_MS = POST_CLEAR_AT_MS + CLEAR_TO_FILL_MS;

export const POST_LINES = [
  'WorkspaceOS v1.0.0',
  'Loading developer profile...',
  'Preparing environment...',
] as const;

type RGB = readonly [number, number, number];

/** Screen "off" — matches the `#05060a` backdrop so it reads as invisible. */
const OFF: RGB = [5, 6, 10];
/** Wake overshoot — the ~118% spike. */
const OVERSHOOT: RGB = [61, 107, 158];
/** Settled POST panel colour — the ~100% resting state. */
const RESTING: RGB = [37, 74, 112];
/** Peak brightness at clear-to-fill, where Shot 1 ends and holds. */
const FILL: RGB = [214, 224, 235];

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function rgbToCss([r, g, b]: RGB): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * The monitor panel's simulated colour at `localMs`. Piecewise: off →
 * overshoot (wake), overshoot → resting (POST hold), resting → fill
 * (clear-to-fill). Holds at `FILL` past `POST_PHASE_MS` — later shots take
 * over the panel from there.
 */
export function panelColorAt(localMs: number): RGB {
  if (localMs <= 0) return OFF;
  if (localMs <= WAKE_MS) {
    return lerpRgb(OFF, OVERSHOOT, easeOutCubic(localMs / WAKE_MS));
  }
  if (localMs <= POST_CLEAR_AT_MS) {
    const t = (localMs - WAKE_MS) / (POST_CLEAR_AT_MS - WAKE_MS);
    return lerpRgb(OVERSHOOT, RESTING, easeInOutCubic(t));
  }
  if (localMs <= POST_PHASE_MS) {
    const t = (localMs - POST_CLEAR_AT_MS) / (POST_PHASE_MS - POST_CLEAR_AT_MS);
    return lerpRgb(RESTING, FILL, easeOutCubic(t));
  }
  return FILL;
}

/** How many POST lines should be mounted (hard cut, never faded) at `localMs`. */
export function postLinesVisibleAt(localMs: number): number {
  if (localMs >= POST_CLEAR_AT_MS) return 0;
  let count = 0;
  for (let i = 0; i < POST_LINE_COUNT; i += 1) {
    const at = WAKE_MS + i * POST_LINE_STAGGER_MS;
    if (localMs >= at) count += 1;
  }
  return count;
}

/** True once POST has cleared (panel is now ramping toward peak fill). */
export function isPostCleared(localMs: number): boolean {
  return localMs >= POST_CLEAR_AT_MS;
}

/** True once Shot 1's window has fully settled (panel holding at peak fill). */
export function isFillSettled(localMs: number): boolean {
  return localMs >= POST_PHASE_MS;
}
