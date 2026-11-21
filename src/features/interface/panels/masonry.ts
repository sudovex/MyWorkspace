/**
 * Masonry placement for portrait photos — pure.
 *
 * Frames are dealt into columns left to right (frame i → column i % count),
 * so reading order is row by row. Columns can then hold different numbers of
 * frames (9 photos in 4 columns is 3 + 2 + 2 + 2), and with every frame the
 * same shape they would end at very different heights, leaving a hole at the
 * bottom of the wall. So each column picks its frames' shapes: columns with
 * fewer frames show them uncropped (9:16), columns with more use slightly
 * squarer crops, chosen so that every column ends at (nearly) the same height.
 * A short album uses fewer columns than asked for (about two frames each),
 * and a lone frame beside pairs may be cropped extra-tall (1:2).
 */

/** Frame shapes a photo may be cropped to, as width ÷ height. Tallest first. */
export const SHAPES = [9 / 16, 3 / 4, 4 / 5, 1] as const;
/**
 * An extra-tall frame (1:2), used only when a column holds a single photo
 * beside columns of two: no other shape can make one frame as tall as two.
 */
export const EXTRA_TALL = 1 / 2;

export interface MasonryCell {
  /** Index of the frame in the original list. */
  index: number;
  /** Width ÷ height to display it at. */
  aspect: number;
}

const heightOf = (aspect: number) => 1 / aspect;

/** All multisets of `count` shapes, as arrays (small: count ≤ ~6). */
function combinations(shapes: readonly number[], count: number, from = 0): number[][] {
  if (count === 0) return [[]];
  const out: number[][] = [];
  for (let s = from; s < shapes.length; s += 1) {
    for (const rest of combinations(shapes, count - 1, s)) {
      out.push([shapes[s] ?? 1, ...rest]);
    }
  }
  return out;
}

/** The shapes for one column of `count` frames that best reach `target`. */
function shapesFor(shapes: readonly number[], count: number, target: number): number[] {
  let best: number[] = [];
  let bestError = Infinity;
  for (const combo of combinations(shapes, count)) {
    const error = Math.abs(combo.reduce((sum, a) => sum + heightOf(a), 0) - target);
    // prefer the taller (less cropped) option on ties
    if (error < bestError - 1e-9) {
      best = combo;
      bestError = error;
    }
  }
  // alternate tall and short down the column so it does not read as a stack
  const sorted = [...best].sort((a, b) => a - b);
  const woven: number[] = [];
  while (sorted.length) {
    const tall = sorted.shift();
    if (tall !== undefined) woven.push(tall);
    const short = sorted.pop();
    if (short !== undefined) woven.push(short);
  }
  return woven;
}

export function balancedMasonry(total: number, columnCount: number): MasonryCell[][] {
  let count = Math.max(1, Math.min(columnCount, Math.max(total, 1)));
  // A short album gets fewer, wider columns — about two photos to a column —
  // rather than a row of lonely frames.
  if (total < 2 * count && count > 2) count = Math.max(2, Math.ceil(total / 2));

  const columns: number[][] = Array.from({ length: count }, () => []);
  for (let i = 0; i < total; i += 1) columns[i % count]?.push(i);

  const sizes = columns.map((column) => column.length);
  const fewest = Math.min(...sizes);
  const most = Math.max(...sizes);
  const tallest = heightOf(SHAPES[0]);
  // Can the short columns, shown uncropped, match the long ones made squarer?
  const reachable = most === fewest || (fewest + 1) * heightOf(1) <= fewest * tallest;
  const shapes: readonly number[] = reachable ? SHAPES : [EXTRA_TALL, ...SHAPES];
  const target = fewest * (reachable ? tallest : heightOf(EXTRA_TALL));

  return columns.map((column) => {
    const picked = shapesFor(shapes, column.length, target);
    return column.map((index, row) => ({ index, aspect: picked[row] ?? SHAPES[0] }));
  });
}

/** Total height of a column, in widths. */
export function columnHeight(column: readonly MasonryCell[]): number {
  return column.reduce((sum, cell) => sum + heightOf(cell.aspect), 0);
}
