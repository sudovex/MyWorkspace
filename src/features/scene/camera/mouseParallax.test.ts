import { describe, expect, it } from 'vitest';
import { parallaxTargetAt, PARALLAX_MAX_X, PARALLAX_MAX_Y } from './mouseParallax';

describe('parallaxTargetAt (pure)', () => {
  it('is zero at the pointer\'s rest position', () => {
    expect(parallaxTargetAt(0, 0)).toEqual([0, 0]);
  });

  it('scales linearly with pointer position', () => {
    const [x] = parallaxTargetAt(0.5, 0);
    expect(x).toBeCloseTo(PARALLAX_MAX_X * 0.5, 6);
  });

  it('reaches exactly the max offset at the pointer extremes', () => {
    expect(parallaxTargetAt(1, 1)).toEqual([PARALLAX_MAX_X, PARALLAX_MAX_Y]);
    expect(parallaxTargetAt(-1, -1)).toEqual([-PARALLAX_MAX_X, -PARALLAX_MAX_Y]);
  });

  it('clamps pointer values outside [-1, 1] (defensive — R3F should never emit these)', () => {
    expect(parallaxTargetAt(5, -5)).toEqual([PARALLAX_MAX_X, -PARALLAX_MAX_Y]);
  });

  it('stays within a 2° apparent-rotation budget at the roomReveal viewing distance', () => {
    const VIEW_DISTANCE = 2.39;
    const [x, y] = parallaxTargetAt(1, 1);
    const angleDeg = (Math.atan(Math.hypot(x, y) / VIEW_DISTANCE) * 180) / Math.PI;
    expect(angleDeg).toBeLessThan(2);
  });
});
