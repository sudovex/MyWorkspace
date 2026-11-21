/**
 * Pure sine-drift model for `room_idle`'s "never dead-stop" camera breathing.
 * Traces to `CONTEXT.md` §5: ~12s-period sine on Y of ~8mm, plus a small
 * look-at drift standing in for "~0.3° rotational drift" (expressed as a
 * look-at-target offset rather than a raw rotation, since `camera.lookAt()`
 * recomputes the full orientation each frame and would otherwise fight a
 * directly-set rotation). The two channels are offset a quarter period apart
 * so the motion doesn't read as one mechanical back-and-forth.
 */
const IDLE_PERIOD_MS = 12000;
const IDLE_Y_AMPLITUDE = 0.008;
/** ≈0.3° at the `roomReveal` camera-to-target distance (~2.39m). */
const IDLE_LOOKAT_DRIFT = 0.0125;

export function idleYOffsetAt(elapsedMs: number): number {
  return Math.sin((elapsedMs / IDLE_PERIOD_MS) * Math.PI * 2) * IDLE_Y_AMPLITUDE;
}

export function idleLookAtDriftAt(elapsedMs: number): number {
  return (
    Math.sin((elapsedMs / IDLE_PERIOD_MS) * Math.PI * 2 + Math.PI / 2) * IDLE_LOOKAT_DRIFT
  );
}
