import { describe, expect, it } from 'vitest';
import { EXTRA_TALL, SHAPES, balancedMasonry, columnHeight } from './masonry';

describe('balancedMasonry (pure)', () => {
  it('places every frame exactly once, row by row', () => {
    for (const columns of [1, 2, 3, 4]) {
      const layout = balancedMasonry(9, columns);
      expect(layout).toHaveLength(columns);
      const indices = layout.flat().map((cell) => cell.index);
      expect([...indices].sort((a, b) => a - b)).toEqual([...Array(9).keys()]);
      // the first row reads left to right: 0, 1, 2, …
      expect(layout.map((column) => column[0]?.index)).toEqual([
        ...Array(columns).keys(),
      ]);
    }
  });

  it('ends every column at nearly the same height', () => {
    for (const [total, columns] of [
      [9, 2],
      [9, 3],
      [9, 4],
      [7, 3],
      [12, 4],
      [5, 4],
    ] as const) {
      const heights = balancedMasonry(total, columns).map(columnHeight);
      const spread = Math.max(...heights) - Math.min(...heights);
      expect(spread / Math.max(...heights)).toBeLessThan(0.06);
    }
  });

  it('shows photos uncropped when the columns divide evenly', () => {
    const layout = balancedMasonry(9, 3);
    for (const cell of layout.flat()) expect(cell.aspect).toBe(SHAPES[0]);
  });

  it('gives a short album about two frames per column', () => {
    expect(balancedMasonry(5, 4).map((column) => column.length)).toEqual([2, 2, 1]);
    expect(balancedMasonry(9, 4)).toHaveLength(4);
    // the lone frame is made extra tall to match its neighbours' pairs
    expect(balancedMasonry(5, 4)[2]?.[0]?.aspect).toBe(EXTRA_TALL);
  });

  it('only uses the allowed shapes, and copes with tiny inputs', () => {
    for (const [total, columns] of [
      [9, 4],
      [5, 4],
      [3, 3],
    ] as const) {
      for (const cell of balancedMasonry(total, columns).flat()) {
        expect([...SHAPES, EXTRA_TALL]).toContain(cell.aspect);
      }
    }
    expect(balancedMasonry(0, 4)).toEqual([[]]);
    expect(balancedMasonry(2, 4)).toHaveLength(2);
  });
});
