/**
 * Pure timing model for Welcome + dead air + cursor — the `monitor_on` FSM
 * phase. Traces to `CONTEXT.md` §5:
 *
 *   0.00        Welcome appears (single frame, no fade)
 *   0.00–0.40   dead air (protected — never overlaps with anything)
 *   0.40–0.93   cursor prompt + block appear, visible (530ms)
 *   0.93–1.46   cursor invisible (530ms) — blink-off
 *   1.46        handoff: `monitor_on` ends here, still mid "off". The camera
 *               starts the same frame this phase ends, so the cut lands
 *               while the cursor is already gone — nothing re-appears.
 *
 * `localMs` is measured from 0 at the moment `monitor_on` begins.
 */

/** 3.95–4.35 in the beat sheet — protected, never cut, never overlapped. */
export const DEAD_AIR_MS = 400;
/** Real VT100 blink rate. */
export const CURSOR_SEGMENT_MS = 530;
/** Locked: two 530ms segments (one visible, one invisible), not three. */
export const CURSOR_SEGMENT_COUNT = 2;
/** 3.95–5.41 — the full `monitor_on` phase. */
export const MONITOR_ON_DURATION_MS =
  DEAD_AIR_MS + CURSOR_SEGMENT_COUNT * CURSOR_SEGMENT_MS;

export const WELCOME_LINES = ['Welcome back,', 'Shubham Mali'] as const;
export const PROMPT_TEXT = 'WorkspaceOS >';

/** The cursor prompt line hasn't appeared until dead air ends. */
export function isCursorMounted(localMs: number): boolean {
  return localMs >= DEAD_AIR_MS;
}

/**
 * True while the cursor block should render solid. Alternates every
 * `CURSOR_SEGMENT_MS`, starting visible. Two segments means the sequence
 * always ends in the invisible half — see the handoff note above.
 */
export function isCursorVisible(localMs: number): boolean {
  if (!isCursorMounted(localMs)) return false;
  // At/after the phase boundary the cursor must already read as "off" — the
  // handoff frame cuts away mid-blink-off, never mid-blink-on.
  if (localMs >= MONITOR_ON_DURATION_MS) return false;
  const segment = Math.floor((localMs - DEAD_AIR_MS) / CURSOR_SEGMENT_MS);
  return segment % 2 === 0;
}

export function isMonitorOnComplete(localMs: number): boolean {
  return localMs >= MONITOR_ON_DURATION_MS;
}
