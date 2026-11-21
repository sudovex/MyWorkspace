import { describe, expect, it } from 'vitest';
import {
  DEAD_AIR_MS,
  CURSOR_SEGMENT_MS,
  CURSOR_SEGMENT_COUNT,
  MONITOR_ON_DURATION_MS,
  isCursorMounted,
  isCursorVisible,
  isMonitorOnComplete,
} from './welcomeTimeline';

describe('locked constants', () => {
  it('matches CONTEXT.md §5 exactly (6.87s runtime depends on this)', () => {
    expect(DEAD_AIR_MS).toBe(400);
    expect(CURSOR_SEGMENT_MS).toBe(530);
    expect(CURSOR_SEGMENT_COUNT).toBe(2);
    expect(MONITOR_ON_DURATION_MS).toBe(1460);
  });
});

describe('dead air (protected, never overlapped)', () => {
  it('the cursor prompt has not mounted during dead air', () => {
    expect(isCursorMounted(0)).toBe(false);
    expect(isCursorMounted(DEAD_AIR_MS - 1)).toBe(false);
    expect(isCursorVisible(200)).toBe(false);
  });
});

describe('cursor blink (two segments, locked)', () => {
  it('mounts and is visible the instant dead air ends', () => {
    expect(isCursorMounted(DEAD_AIR_MS)).toBe(true);
    expect(isCursorVisible(DEAD_AIR_MS)).toBe(true);
  });

  it('is visible for exactly the first 530ms segment', () => {
    expect(isCursorVisible(DEAD_AIR_MS + CURSOR_SEGMENT_MS - 1)).toBe(true);
  });

  it('goes invisible for the second 530ms segment', () => {
    expect(isCursorVisible(DEAD_AIR_MS + CURSOR_SEGMENT_MS)).toBe(false);
    expect(isCursorVisible(MONITOR_ON_DURATION_MS - 1)).toBe(false);
  });

  it('is still invisible at the exact moment monitor_on ends — the handoff frame', () => {
    // This is the "cursor vanishes on blink-off, camera starts same frame"
    // beat: the phase must end mid-"off", never mid-"on".
    expect(isCursorVisible(MONITOR_ON_DURATION_MS)).toBe(false);
    expect(isMonitorOnComplete(MONITOR_ON_DURATION_MS)).toBe(true);
  });

  it('does not complete one tick before the boundary', () => {
    expect(isMonitorOnComplete(MONITOR_ON_DURATION_MS - 1)).toBe(false);
  });
});
