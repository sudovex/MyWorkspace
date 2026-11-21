import { describe, expect, it } from 'vitest';
import {
  ARC_AMPLITUDE,
  LOOKAT_LAG_MS,
  OVERSHOOT_FRACTION,
  PUSH_IN_DURATION_MS,
  SETTLE_MS,
  isPushInComplete,
  pushInLookAtAt,
  pushInPositionAt,
} from './introTimeline';

const START = [2, 2, 4] as const;
const END = [0, 1, 1] as const;

function distance(a: readonly number[], b: readonly number[]): number {
  return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
}

describe('pushInPositionAt', () => {
  it('starts exactly at the start pose and ends exactly at the end pose', () => {
    expect(pushInPositionAt(0, START, END)).toEqual(START);
    expect(pushInPositionAt(PUSH_IN_DURATION_MS, START, END)).toEqual(END);
    expect(pushInPositionAt(PUSH_IN_DURATION_MS + 5000, START, END)).toEqual(END);
  });

  it('has mass: the first 15% of time covers under 5% of the travel', () => {
    const total = distance(START, END);
    const early = pushInPositionAt(PUSH_IN_DURATION_MS * 0.15, START, END);
    expect(distance(START, early) / total).toBeLessThan(0.05);
  });

  it('travels monotonically toward the desk along the depth axis until the settle', () => {
    let previous = pushInPositionAt(0, START, END)[2];
    for (let ms = 50; ms <= PUSH_IN_DURATION_MS - SETTLE_MS; ms += 50) {
      const z = pushInPositionAt(ms, START, END)[2];
      expect(z).toBeLessThanOrEqual(previous + 1e-9);
      previous = z;
    }
  });

  it('overshoots the end pose slightly, then settles back onto it', () => {
    const atOvershoot = pushInPositionAt(PUSH_IN_DURATION_MS - SETTLE_MS, START, END);
    // Past the end along the travel direction (z decreasing).
    expect(atOvershoot[2]).toBeLessThan(END[2]);
    expect(END[2] - atOvershoot[2]).toBeCloseTo(
      (START[2] - END[2]) * OVERSHOOT_FRACTION,
      6,
    );
    const late = pushInPositionAt(PUSH_IN_DURATION_MS - 1, START, END);
    expect(distance(late, END)).toBeLessThan(0.001);
  });

  it('arcs sideways mid-move and not at either end', () => {
    const mid = pushInPositionAt(PUSH_IN_DURATION_MS / 2, START, END);
    // Where a straight-line move would be in X, given how far it has come in Z.
    const progress = (START[2] - mid[2]) / (START[2] - END[2]);
    const straightX = START[0] + (END[0] - START[0]) * progress;
    expect(straightX - mid[0]).toBeGreaterThan(ARC_AMPLITUDE * 0.9);
    expect(straightX - mid[0]).toBeLessThanOrEqual(ARC_AMPLITUDE + 1e-9);
  });
});

describe('pushInLookAtAt', () => {
  it('holds during the lag, then reaches the end exactly on completion', () => {
    expect(pushInLookAtAt(0, START, END)).toEqual(START);
    expect(pushInLookAtAt(LOOKAT_LAG_MS, START, END)).toEqual(START);
    expect(pushInLookAtAt(PUSH_IN_DURATION_MS, START, END)).toEqual(END);
  });

  it('lags behind position early in the move', () => {
    const ms = PUSH_IN_DURATION_MS * 0.35;
    const lookProgress =
      (START[2] - pushInLookAtAt(ms, START, END)[2]) / (START[2] - END[2]);
    const positionProgress =
      (START[2] - pushInPositionAt(ms - LOOKAT_LAG_MS, START, END)[2]) /
      (START[2] - END[2]);
    expect(lookProgress).toBeGreaterThan(0);
    expect(lookProgress).toBeLessThan(1);
    // Sanity: both are mid-flight, neither has arrived.
    expect(positionProgress).toBeLessThan(1);
  });
});

describe('isPushInComplete', () => {
  it('flips exactly at the duration', () => {
    expect(isPushInComplete(PUSH_IN_DURATION_MS - 1)).toBe(false);
    expect(isPushInComplete(PUSH_IN_DURATION_MS)).toBe(true);
  });
});
