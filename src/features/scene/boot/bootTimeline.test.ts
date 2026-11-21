import { describe, expect, it } from 'vitest';
import {
  BLACK_HOLD_MS,
  WAKE_MS,
  POST_CLEAR_AT_MS,
  POST_PHASE_MS,
  POST_LINE_COUNT,
  POST_LINE_STAGGER_MS,
  panelColorAt,
  postLinesVisibleAt,
  isPostCleared,
  isFillSettled,
  rgbToCss,
} from './bootTimeline';

describe('panelColorAt (pure)', () => {
  it('is off for the entirety of the black hold', () => {
    expect(panelColorAt(0)).toEqual([5, 6, 10]);
    expect(panelColorAt(-50)).toEqual([5, 6, 10]);
  });

  it('spikes to the overshoot colour exactly when wake completes', () => {
    expect(panelColorAt(WAKE_MS)).toEqual([61, 107, 158]);
  });

  it('settles to resting exactly when POST clears', () => {
    expect(panelColorAt(POST_CLEAR_AT_MS)).toEqual([37, 74, 112]);
  });

  it('reaches peak fill exactly when the post phase ends, and holds after', () => {
    expect(panelColorAt(POST_PHASE_MS)).toEqual([214, 224, 235]);
    expect(panelColorAt(POST_PHASE_MS + 1000)).toEqual([214, 224, 235]);
  });

  it('moves monotonically toward each segment target (no reversal)', () => {
    const mid = WAKE_MS / 2;
    const [r] = panelColorAt(mid);
    expect(r).toBeGreaterThan(5);
    expect(r).toBeLessThan(61);
  });
});

describe('postLinesVisibleAt (pure)', () => {
  it('shows nothing before wake completes', () => {
    expect(postLinesVisibleAt(0)).toBe(0);
    expect(postLinesVisibleAt(WAKE_MS - 1)).toBe(0);
  });

  it('reveals exactly one line per stagger window, hard cut', () => {
    expect(postLinesVisibleAt(WAKE_MS)).toBe(1);
    expect(postLinesVisibleAt(WAKE_MS + POST_LINE_STAGGER_MS - 1)).toBe(1);
    expect(postLinesVisibleAt(WAKE_MS + POST_LINE_STAGGER_MS)).toBe(2);
    expect(postLinesVisibleAt(WAKE_MS + POST_LINE_STAGGER_MS * 2)).toBe(3);
    expect(postLinesVisibleAt(WAKE_MS + POST_LINE_STAGGER_MS * 2)).toBe(POST_LINE_COUNT);
  });

  it('gives every line time to be read before the screen clears', () => {
    // each line is alone on screen for at least half a second…
    expect(POST_LINE_STAGGER_MS).toBeGreaterThanOrEqual(500);
    // …and the last one is held at least as long as the others
    const lastLineAt = WAKE_MS + POST_LINE_STAGGER_MS * (POST_LINE_COUNT - 1);
    expect(POST_CLEAR_AT_MS - lastLineAt).toBeGreaterThanOrEqual(POST_LINE_STAGGER_MS);
  });

  it('clears all lines the instant POST clears, and stays cleared', () => {
    expect(postLinesVisibleAt(POST_CLEAR_AT_MS - 1)).toBe(POST_LINE_COUNT);
    expect(postLinesVisibleAt(POST_CLEAR_AT_MS)).toBe(0);
    expect(postLinesVisibleAt(POST_PHASE_MS + 1000)).toBe(0);
  });
});

describe('phase-boundary predicates', () => {
  it('isPostCleared flips exactly at POST_CLEAR_AT_MS', () => {
    expect(isPostCleared(POST_CLEAR_AT_MS - 1)).toBe(false);
    expect(isPostCleared(POST_CLEAR_AT_MS)).toBe(true);
  });

  it('isFillSettled flips exactly at POST_PHASE_MS', () => {
    expect(isFillSettled(POST_PHASE_MS - 1)).toBe(false);
    expect(isFillSettled(POST_PHASE_MS)).toBe(true);
  });
});

describe('rgbToCss', () => {
  it('formats an rgb() string, rounding component values', () => {
    expect(rgbToCss([61, 107, 158])).toBe('rgb(61, 107, 158)');
    expect(rgbToCss([5.4, 6.6, 9.5])).toBe('rgb(5, 7, 10)');
  });
});

describe('locked beat-sheet constants', () => {
  it('matches CONTEXT.md §5 exactly', () => {
    expect(BLACK_HOLD_MS).toBe(400);
    expect(WAKE_MS).toBe(150);
    expect(POST_LINE_STAGGER_MS).toBe(600);
    expect(POST_CLEAR_AT_MS).toBe(2100);
    expect(POST_PHASE_MS).toBe(2300);
  });
});
