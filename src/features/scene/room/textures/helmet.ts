/**
 * The helmet's livery, painted in the shell's own UV space.
 *
 * Modelled on the owner's real helmet (from his photos) — a matte charcoal
 * shell with hi-viz yellow blades, white chevrons on the crown, a halftone
 * panel on each flank, a yellow band down the back and a white flash behind
 * the visor pivot — with his own lettering in place of the manufacturer's.
 *
 * The shell is a sculpted sphere, so its UVs are a sphere's: `u` runs around
 * the head and `v` from crown to base. Graphics are authored once in "side
 * coordinates" — `a` from the nose (0) round to the back of the head (1), `t`
 * from the crown (0) down to the base (1) — and stamped onto both flanks,
 * which is what keeps the design symmetrical when the helmet is seen from
 * above. Note that near the crown a band of constant `t` is a ring around the
 * top of the head: that is how the crown's arcs are drawn.
 */
import { type CanvasTexture } from 'three';
import { canvasTexture, grain } from './canvas';
import { type Fonts } from './props';

const W = 2048;
const H = 1024;
/** `u` of the nose (+Z) on three's sphere. */
const U_FRONT = 0.25;

const CHARCOAL = '#33363c';
const BLACK = '#17181c';
const CARBON = '#222429';
const GREY = '#686b72';
const HIVIZ = '#d8f01c';
const WHITE = '#eef0ea';

/**
 * The eye port, in side coordinates. Shared with the 3D model, which sinks
 * the shell inward over exactly this region (`objects/Helmet.tsx`).
 */
export const EYE_PORT = { halfWidth: 0.385, top: 0.365, bottom: 0.565 } as const;

type Point = readonly [a: number, t: number];

/** Canvas x for side coordinate `a` on the right (+1) or left (−1) flank. */
function xFor(a: number, side: 1 | -1): number {
  return (U_FRONT + (side * a) / 2) * W;
}

/** Run `draw` once per flank (the left one twice: it wraps the canvas edge). */
function onBothFlanks(draw: (x: (a: number) => number, side: 1 | -1) => void): void {
  for (const side of [1, -1] as const) {
    for (const wrap of side === 1 ? [0] : [0, W]) {
      draw((a) => xFor(a, side) + wrap, side);
    }
  }
}

function trace(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  x: (a: number) => number,
): void {
  ctx.beginPath();
  points.forEach(([a, t], i) => {
    if (i === 0) ctx.moveTo(x(a), t * H);
    else ctx.lineTo(x(a), t * H);
  });
  ctx.closePath();
}

/** Fill a polygon given in side coordinates, on both flanks. */
function blade(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  color: string,
): void {
  ctx.fillStyle = color;
  onBothFlanks((x) => {
    trace(ctx, points, x);
    ctx.fill();
  });
}

/** Stroke a polygon's outline, on both flanks — the pinstripes. */
function pinstripe(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  color: string,
  width: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  onBothFlanks((x) => {
    trace(ctx, points, x);
    ctx.stroke();
  });
}

/** Lettering that reads correctly from outside on both flanks. */
function lettering(
  ctx: CanvasRenderingContext2D,
  text: string,
  [a, t]: Point,
  tilt: number,
  font: string,
  paint: (ctx: CanvasRenderingContext2D, text: string) => void,
): void {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  onBothFlanks((x, side) => {
    ctx.save();
    ctx.translate(x(a), t * H);
    // Lettering leans along the panel it sits on; the lean mirrors.
    ctx.rotate(side * tilt);
    paint(ctx, text);
    ctx.restore();
  });
}

const HALFTONE: readonly Point[] = [
  [0.33, 0.215],
  [0.74, 0.2],
  [0.79, 0.25],
  [0.74, 0.335],
  [0.4, 0.34],
  [0.3, 0.27],
];

export function createHelmetLiveryTexture(fonts: Fonts): CanvasTexture {
  return canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = CHARCOAL;
    ctx.fillRect(0, 0, W, H);

    // ---------------------------------------------------------------- crown
    // the centre ridge: black from the brow, over the top, down the back
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, W, 0.055 * H);
    blade(
      ctx,
      [
        [0, 0.04],
        [0.09, 0.04],
        [0.07, 0.3],
        [0, 0.3],
      ],
      BLACK,
    );
    blade(
      ctx,
      [
        [0.93, 0.04],
        [1, 0.04],
        [1, 0.26],
        [0.95, 0.26],
      ],
      BLACK,
    );
    // two nested yellow arcs wrapping the back of the crown
    blade(
      ctx,
      [
        [0.6, 0.075],
        [1, 0.075],
        [1, 0.105],
        [0.6, 0.105],
      ],
      HIVIZ,
    );
    blade(
      ctx,
      [
        [0.66, 0.135],
        [1, 0.135],
        [1, 0.165],
        [0.66, 0.165],
      ],
      HIVIZ,
    );
    // a white chevron either side of the ridge, a grey one behind it
    blade(
      ctx,
      [
        [0.14, 0.085],
        [0.5, 0.075],
        [0.46, 0.15],
        [0.2, 0.185],
      ],
      WHITE,
    );
    blade(
      ctx,
      [
        [0.52, 0.19],
        [0.86, 0.195],
        [0.92, 0.3],
        [0.82, 0.24],
      ],
      GREY,
    );

    // ----------------------------------------------------------------- brow
    blade(
      ctx,
      [
        [0.07, 0.2],
        [0.22, 0.2],
        [0.3, 0.27],
        [0.34, 0.365],
        [0.07, 0.365],
      ],
      GREY,
    );
    // the yellow blade sweeping from the brow back to the visor's top corner
    blade(
      ctx,
      [
        [0.09, 0.265],
        [0.2, 0.215],
        [0.31, 0.275],
        [0.42, 0.365],
        [0.3, 0.365],
        [0.2, 0.3],
        [0.12, 0.33],
      ],
      HIVIZ,
    );

    // ----------------------------------------------- flank: halftone panel
    blade(ctx, HALFTONE, BLACK);
    ctx.fillStyle = 'rgba(160,166,176,0.6)';
    onBothFlanks((x) => {
      ctx.save();
      trace(ctx, HALFTONE, x);
      ctx.clip();
      for (let a = 0.3; a <= 0.8; a += 0.017) {
        for (let t = 0.2; t <= 0.345; t += 0.017) {
          // dots thin out toward the back of the panel
          const size = 3.4 * (1 - (a - 0.3) * 1.1);
          if (size <= 0.6) continue;
          ctx.beginPath();
          ctx.arc(x(a), t * H, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });
    pinstripe(ctx, HALFTONE, 'rgba(150,156,166,0.75)', 3);
    pinstripe(
      ctx,
      HALFTONE.map(([a, t]) => [a + 0.012, t + (t < 0.27 ? -0.014 : 0.014)] as const),
      'rgba(150,156,166,0.4)',
      2,
    );

    // ------------------------------------------------------- back of head
    // yellow tab at the top rear, then the long yellow band down the back
    blade(
      ctx,
      [
        [0.83, 0.225],
        [0.99, 0.235],
        [0.99, 0.3],
        [0.87, 0.29],
      ],
      HIVIZ,
    );
    blade(
      ctx,
      [
        [0.8, 0.345],
        [0.93, 0.33],
        [0.93, 0.66],
        [0.86, 0.7],
        [0.8, 0.62],
      ],
      HIVIZ,
    );
    blade(
      ctx,
      [
        [0.95, 0.33],
        [1, 0.33],
        [1, 0.7],
        [0.95, 0.68],
      ],
      BLACK,
    );

    // ------------------------------------------------- behind / below visor
    // the white flash running back from under the pivot
    blade(
      ctx,
      [
        [0.4, 0.6],
        [0.6, 0.575],
        [0.78, 0.5],
        [0.8, 0.545],
        [0.66, 0.63],
        [0.46, 0.665],
      ],
      WHITE,
    );
    // the lower yellow blade
    blade(
      ctx,
      [
        [0.47, 0.72],
        [0.68, 0.65],
        [0.8, 0.64],
        [0.84, 0.7],
        [0.7, 0.76],
        [0.52, 0.8],
      ],
      HIVIZ,
    );

    // ------------------------------------- chin bar and base trim: carbon
    blade(
      ctx,
      [
        [0, 0.6],
        [0.4, 0.6],
        [0.46, 0.665],
        [0.47, 0.72],
        [0.52, 0.8],
        [0, 0.8],
      ],
      CARBON,
    );
    // a hint of weave on the chin
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    onBothFlanks((x) => {
      for (let a = 0.02; a <= 0.4; a += 0.012) {
        for (let t = 0.615; t <= 0.79; t += 0.012) {
          ctx.fillRect(x(a), t * H, 2.2, 2.2);
        }
      }
    });
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0.8 * H, W, 0.2 * H);

    // ------------------------------------------------------------ lettering
    lettering(
      ctx,
      'SM-1',
      [0.52, 0.352],
      -0.03,
      `italic 800 54px ${fonts.sans}`,
      (c, text) => {
        c.fillStyle = WHITE;
        c.fillText(text, 0, 0);
      },
    );
    lettering(
      ctx,
      'SHUBX',
      [0.865, 0.5],
      -Math.PI / 2,
      `800 70px ${fonts.sans}`,
      (c, text) => {
        c.lineWidth = 4;
        c.strokeStyle = 'rgba(44,50,8,0.8)';
        c.strokeText(text, 0, 0);
      },
    );

    // ------------------------------------------------------- the eye port
    // What you see through the visor: the dark liner, cheek pads either
    // side, the breath deflector across the bottom.
    const x0 = xFor(EYE_PORT.halfWidth, -1);
    const x1 = xFor(EYE_PORT.halfWidth, 1);
    const y0 = EYE_PORT.top * H;
    const y1 = EYE_PORT.bottom * H;
    const port = () => {
      ctx.beginPath();
      ctx.moveTo(x0 + 50, y0);
      ctx.lineTo(x1 - 50, y0);
      ctx.quadraticCurveTo(x1, y0, x1, y0 + 46);
      ctx.lineTo(x1 - 30, y1 - 34);
      ctx.quadraticCurveTo(x1 - 40, y1, x1 - 84, y1);
      ctx.lineTo(x0 + 84, y1);
      ctx.quadraticCurveTo(x0 + 40, y1, x0 + 30, y1 - 34);
      ctx.lineTo(x0, y0 + 46);
      ctx.quadraticCurveTo(x0, y0, x0 + 50, y0);
      ctx.closePath();
    };
    ctx.save();
    port();
    ctx.clip();
    const depth = ctx.createLinearGradient(0, y0, 0, y1);
    depth.addColorStop(0, '#020203');
    depth.addColorStop(0.55, '#0b0c0f');
    depth.addColorStop(1, '#16171b');
    ctx.fillStyle = depth;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    // cheek pads
    ctx.fillStyle = '#24262c';
    for (const cx of [x0 + 150, x1 - 150]) {
      ctx.beginPath();
      ctx.ellipse(cx, y1 - 26, 150, 78, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // breath deflector
    ctx.fillStyle = '#2c2e35';
    ctx.beginPath();
    ctx.ellipse((x0 + x1) / 2, y1 + 6, 190, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // the rubber gasket around the port
    port();
    ctx.strokeStyle = '#08090b';
    ctx.lineWidth = 14;
    ctx.stroke();

    grain(ctx, W, H, 9, 71);
  });
}
