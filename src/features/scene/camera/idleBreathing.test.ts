import { describe, expect, it } from 'vitest';
import { idleYOffsetAt, idleLookAtDriftAt } from './idleBreathing';

describe('idleYOffsetAt (pure)', () => {
  it('starts at zero', () => {
    expect(idleYOffsetAt(0)).toBe(0);
  });

  it('stays within the ~8mm amplitude', () => {
    for (let t = 0; t <= 24000; t += 500) {
      expect(Math.abs(idleYOffsetAt(t))).toBeLessThanOrEqual(0.008 + 1e-9);
    }
  });

  it('is periodic at 12s', () => {
    expect(idleYOffsetAt(3000)).toBeCloseTo(idleYOffsetAt(15000), 6);
  });

  it('never sits exactly at rest except at period boundaries (never dead-stop)', () => {
    expect(idleYOffsetAt(1)).not.toBe(0);
    expect(idleYOffsetAt(5999)).not.toBe(0);
  });
});

describe('idleLookAtDriftAt (pure)', () => {
  it('is quarter-period offset from the Y channel (not in lockstep)', () => {
    // At t=0 the Y channel is at zero crossing; the drift channel should be
    // at (or near) its peak, not also zero.
    expect(Math.abs(idleLookAtDriftAt(0))).toBeGreaterThan(0.01);
  });

  it('stays within its own small amplitude', () => {
    for (let t = 0; t <= 24000; t += 500) {
      expect(Math.abs(idleLookAtDriftAt(t))).toBeLessThanOrEqual(0.0125 + 1e-9);
    }
  });
});
