/**
 * Geometry for the first-visit guide's arrows — pure, framework-free.
 *
 * Each arrow leaves the edge of the message card on the side facing its
 * object, bows gently, and stops a little short of the object so the tip
 * never covers what it is pointing at.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Arrow {
  start: Point;
  control: Point;
  end: Point;
  /** The two barbs of the head, each drawn from `end`. */
  head: readonly [Point, Point];
}

/** Clear space between the card and where an arrow starts. */
export const CARD_MARGIN = 12;
/** How far short of its target an arrow stops. */
export const TARGET_GAP = 16;
/** Arrows shorter than this are not worth drawing. */
export const MIN_LENGTH = 24;
const HEAD_LENGTH = 11;
const HEAD_SPREAD = 0.46;

export function contains(rect: Rect, point: Point, margin = 0): boolean {
  return (
    point.x >= rect.left - margin &&
    point.x <= rect.left + rect.width + margin &&
    point.y >= rect.top - margin &&
    point.y <= rect.top + rect.height + margin
  );
}

/** Where the ray from the rectangle's centre toward `toward` leaves it. */
export function edgePoint(rect: Rect, toward: Point, margin = 0): Point {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const halfWidth = rect.width / 2 + margin;
  const halfHeight = rect.height / 2 + margin;
  const scale = Math.min(
    dx === 0 ? Infinity : halfWidth / Math.abs(dx),
    dy === 0 ? Infinity : halfHeight / Math.abs(dy),
  );
  return { x: cx + dx * scale, y: cy + dy * scale };
}

/** The arrow from the card to `target`, or `null` if there is no room for one. */
export function guideArrow(card: Rect, target: Point): Arrow | null {
  if (contains(card, target, CARD_MARGIN)) return null;
  const start = edgePoint(card, target, CARD_MARGIN);
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (distance - TARGET_GAP < MIN_LENGTH) return null;
  const ux = dx / distance;
  const uy = dy / distance;
  const end = { x: target.x - ux * TARGET_GAP, y: target.y - uy * TARGET_GAP };

  // bow away from the vertical axis of the card, more for longer arrows
  const length = distance - TARGET_GAP;
  const bow = Math.min(46, Math.max(8, length * 0.16)) * (ux >= 0 ? -1 : 1);
  const control = {
    x: (start.x + end.x) / 2 - uy * bow,
    y: (start.y + end.y) / 2 + ux * bow,
  };

  // the head follows the curve's direction where it arrives
  const angle = Math.atan2(end.y - control.y, end.x - control.x);
  const barb = (offset: number): Point => ({
    x: end.x - Math.cos(angle + offset) * HEAD_LENGTH,
    y: end.y - Math.sin(angle + offset) * HEAD_LENGTH,
  });
  return { start, control, end, head: [barb(HEAD_SPREAD), barb(-HEAD_SPREAD)] };
}

const n = (value: number) => value.toFixed(1);

export function shaftPath({ start, control, end }: Arrow): string {
  return `M${n(start.x)} ${n(start.y)} Q${n(control.x)} ${n(control.y)} ${n(end.x)} ${n(end.y)}`;
}

export function headPath({ end, head }: Arrow): string {
  return `M${n(head[0].x)} ${n(head[0].y)} L${n(end.x)} ${n(end.y)} L${n(head[1].x)} ${n(head[1].y)}`;
}
