import { describe, expect, it } from 'vitest';
import {
  CARD_MARGIN,
  MIN_LENGTH,
  TARGET_GAP,
  contains,
  edgePoint,
  guideArrow,
  headPath,
  shaftPath,
  type Rect,
} from './arrows';

const CARD: Rect = { left: 500, top: 300, width: 400, height: 200 };
const CENTRE = { x: 700, y: 400 };

describe('edgePoint (pure)', () => {
  it('leaves through the side facing the target', () => {
    expect(edgePoint(CARD, { x: 1400, y: 400 })).toEqual({ x: 900, y: 400 });
    expect(edgePoint(CARD, { x: 0, y: 400 })).toEqual({ x: 500, y: 400 });
    expect(edgePoint(CARD, { x: 700, y: 0 })).toEqual({ x: 700, y: 300 });
    expect(edgePoint(CARD, { x: 700, y: 900 })).toEqual({ x: 700, y: 500 });
  });

  it('stays on the border for a diagonal target, and honours the margin', () => {
    const corner = edgePoint(CARD, { x: 1500, y: 800 });
    expect(corner.x).toBeCloseTo(900);
    expect(corner.y).toBeCloseTo(500);
    expect(edgePoint(CARD, { x: 1400, y: 400 }, 10).x).toBe(910);
  });

  it('does not divide by zero for a target at the centre', () => {
    expect(edgePoint(CARD, CENTRE)).toEqual(CENTRE);
  });
});

describe('guideArrow (pure)', () => {
  it('draws nothing to an object the card is covering, or one right beside it', () => {
    expect(guideArrow(CARD, { x: 720, y: 410 })).toBeNull();
    expect(contains(CARD, { x: 905, y: 400 }, CARD_MARGIN)).toBe(true);
    expect(guideArrow(CARD, { x: 905, y: 400 })).toBeNull();
    expect(
      guideArrow(CARD, { x: 900 + CARD_MARGIN + TARGET_GAP + 5, y: 400 }),
    ).toBeNull();
  });

  it('starts off the card, and stops short of the target', () => {
    const target = { x: 1300, y: 150 };
    const arrow = guideArrow(CARD, target);
    expect(arrow).not.toBeNull();
    if (!arrow) return;
    expect(contains(CARD, arrow.start)).toBe(false);
    expect(contains(CARD, arrow.start, CARD_MARGIN + 0.01)).toBe(true);
    const short = Math.hypot(target.x - arrow.end.x, target.y - arrow.end.y);
    expect(short).toBeCloseTo(TARGET_GAP);
    const length = Math.hypot(arrow.end.x - arrow.start.x, arrow.end.y - arrow.start.y);
    expect(length).toBeGreaterThanOrEqual(MIN_LENGTH);
  });

  it('bows, and mirrors the bow on the other side of the card', () => {
    const right = guideArrow(CARD, { x: 1300, y: 400 });
    const left = guideArrow(CARD, { x: 100, y: 400 });
    expect(right && left).toBeTruthy();
    if (!right || !left) return;
    // a horizontal arrow's control point sits off the straight line…
    expect(right.control.y).not.toBeCloseTo(400);
    // …on the same side (above) for both
    expect(Math.sign(right.control.y - 400)).toBe(Math.sign(left.control.y - 400));
  });

  it('puts the head behind the tip, one barb each side', () => {
    const arrow = guideArrow(CARD, { x: 1300, y: 400 });
    if (!arrow) throw new Error('expected an arrow');
    for (const barb of arrow.head) expect(barb.x).toBeLessThan(arrow.end.x);
    expect(Math.sign(arrow.head[0].y - arrow.end.y)).toBe(
      -Math.sign(arrow.head[1].y - arrow.end.y),
    );
    expect(shaftPath(arrow)).toMatch(/^M[\d.]+ [\d.]+ Q[\d.]+ [\d.]+ [\d.]+ [\d.]+$/);
    expect(headPath(arrow)).toMatch(/^M.+ L.+ L.+$/);
  });
});
