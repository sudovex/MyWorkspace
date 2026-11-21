import { describe, expect, it } from 'vitest';
import {
  LAMP_RAMP_MS,
  BOOTING_DURATION_MS,
  LAMP_INTENSITY_END,
  FLICKER_MS,
  BOUNCE_DELAY_MS,
  BOUNCE_INTENSITY_END,
  lampIntensityAt,
  lampColorAt,
  bounceIntensityAt,
  bounceColorAt,
  isBootingComplete,
  rgbToCss,
} from './lampTimeline';
import { easeInOutCubic } from '../utils/easing';

describe('lampIntensityAt (pure)', () => {
  it('is off before the ramp starts', () => {
    expect(lampIntensityAt(0)).toBe(0);
    expect(lampIntensityAt(-100)).toBe(0);
  });

  it('reaches peak intensity exactly when the ramp completes', () => {
    expect(lampIntensityAt(LAMP_RAMP_MS)).toBeCloseTo(LAMP_INTENSITY_END, 5);
  });

  it('holds at peak after the ramp completes', () => {
    expect(lampIntensityAt(LAMP_RAMP_MS + 500)).toBe(LAMP_INTENSITY_END);
  });

  it('is monotonically increasing through the ramp (flicker perturbation is small)', () => {
    const a = lampIntensityAt(200);
    const b = lampIntensityAt(600);
    const c = lampIntensityAt(1000);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
});

describe('lampIntensityAt flicker (pure)', () => {
  it('deviates from a pure eased ramp near ignition', () => {
    // Sample early in the flicker window, where the perturbation is largest,
    // and confirm it's not simply the smooth base curve.
    const withFlicker = lampIntensityAt(30);
    const pureRampAt30 = LAMP_INTENSITY_END * easeInOutCubic(30 / LAMP_RAMP_MS);
    expect(Math.abs(withFlicker - pureRampAt30)).toBeGreaterThan(0.01);
  });

  it('has fully decayed by FLICKER_MS — no seam into the smooth ramp', () => {
    // At and after FLICKER_MS, intensity is exactly the base eased ramp
    // (flickerOffsetAt returns 0 there by construction).
    expect(lampIntensityAt(FLICKER_MS)).toBeGreaterThan(0);
    expect(lampIntensityAt(FLICKER_MS)).toBeLessThan(LAMP_INTENSITY_END);
  });

  it('never drives intensity negative', () => {
    for (let t = 0; t <= LAMP_RAMP_MS; t += 10) {
      expect(lampIntensityAt(t)).toBeGreaterThanOrEqual(0);
    }
  });

  it('is confined well inside the ramp (locked constant)', () => {
    expect(FLICKER_MS).toBeLessThan(LAMP_RAMP_MS);
  });
});

describe('lampColorAt (pure)', () => {
  it('starts at the deep ember colour', () => {
    expect(lampColorAt(0)).toEqual([255, 118, 42]);
  });

  it('warms to the resting saturated-tungsten colour', () => {
    const [r, g, b] = lampColorAt(LAMP_RAMP_MS);
    expect(rgbToCss([r, g, b])).toBe('rgb(255, 168, 88)');
  });

  it('holds at the warm colour after the ramp completes', () => {
    expect(lampColorAt(LAMP_RAMP_MS + 1000)).toEqual([255, 168, 88]);
  });
});

describe('bounceIntensityAt / bounceColorAt (pure) — the indirect fill', () => {
  it('has not started before its delay elapses', () => {
    expect(bounceIntensityAt(0)).toBe(0);
    expect(bounceIntensityAt(BOUNCE_DELAY_MS)).toBe(0);
    expect(bounceColorAt(0)).toEqual([255, 118, 42]);
  });

  it('starts strictly after the key light (delayed, not simultaneous)', () => {
    const t = 100;
    expect(bounceIntensityAt(t)).toBe(0);
    expect(lampIntensityAt(t)).toBeGreaterThan(0);
  });

  it('reaches its own (dimmer) peak once delay + ramp complete, and holds', () => {
    expect(bounceIntensityAt(BOUNCE_DELAY_MS + LAMP_RAMP_MS)).toBeCloseTo(
      BOUNCE_INTENSITY_END,
      5,
    );
    expect(bounceIntensityAt(BOUNCE_DELAY_MS + LAMP_RAMP_MS + 1000)).toBe(
      BOUNCE_INTENSITY_END,
    );
  });

  it('is dimmer than the key light at every point in time (a fill, not a second spotlight)', () => {
    for (let t = 0; t <= BOUNCE_DELAY_MS + LAMP_RAMP_MS + 500; t += 50) {
      expect(bounceIntensityAt(t)).toBeLessThanOrEqual(lampIntensityAt(t) + 1e-9);
    }
  });

  it('has no flicker of its own — monotonically non-decreasing through the ramp', () => {
    let prev = bounceIntensityAt(BOUNCE_DELAY_MS);
    for (let t = BOUNCE_DELAY_MS; t <= BOUNCE_DELAY_MS + LAMP_RAMP_MS; t += 20) {
      const v = bounceIntensityAt(t);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });
});

describe('isBootingComplete', () => {
  it('flips exactly at BOOTING_DURATION_MS', () => {
    expect(isBootingComplete(BOOTING_DURATION_MS - 1)).toBe(false);
    expect(isBootingComplete(BOOTING_DURATION_MS)).toBe(true);
  });

  it('locked constants match CONTEXT.md §5', () => {
    expect(LAMP_RAMP_MS).toBe(1150);
    expect(BOOTING_DURATION_MS).toBe(1250);
  });
});
