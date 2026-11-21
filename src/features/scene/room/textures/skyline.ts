/**
 * The city outside the window, painted as four layers so the view has real
 * depth: a rain-heavy sky, a far skyline lost in haze, a mid row of towers
 * with lit floors and signs, and one or two near buildings whose windows you
 * can look into. `objects/WindowView.tsx` slides the layers against each
 * other as the camera moves (parallax), which a single flat picture never did.
 *
 * Each skyline layer tiles horizontally (every tower is drawn three times:
 * at x, x - width and x + width), is transparent above its roofline, and ends
 * in a solid row at the bottom so it can be clamped downward for free.
 *
 * The painters are plain canvas code (`paintSky`, `paintFar`, …) so they can
 * be previewed outside WebGL; the `create…` wrappers turn them into textures.
 * Everything is seeded — the city is the same city on every visit.
 */
import { RepeatWrapping, type CanvasTexture } from 'three';
import { canvasTexture, seeded } from './canvas';

type Ctx = CanvasRenderingContext2D;

/**
 * Where each skyline layer lives: how far behind the glass (`depth`, metres),
 * and the slab of world its texture covers on that plane (`width` × `height`,
 * starting at height `bottom`).
 */
export const SKYLINE = {
  far: { depth: 10, width: 9, height: 4.5, bottom: -1.2 },
  mid: { depth: 5, width: 6, height: 3, bottom: -1 },
  near: { depth: 2.2, width: 5, height: 2.5, bottom: -0.9 },
} as const;

export type SkylineLayerId = keyof typeof SKYLINE;

/**
 * The sky is mapped by view direction, not position: these are the tangents
 * (x/z and y/z of the view ray) its texture spans.
 */
export const SKY_VIEW = { minX: -1.3, maxX: 0.1, minY: -0.45, maxY: 0.45 } as const;

/** A red aircraft-warning light on a rooftop, in the layer's uv (v up). */
export interface SkylineBeacon {
  u: number;
  v: number;
}

export interface SkylinePaint {
  texture: CanvasTexture;
  beacons: SkylineBeacon[];
}

/* --------------------------------- helpers -------------------------------- */

const WARM = ['255,214,150', '255,196,120', '255,228,180', '250,180,110'] as const;
const COOL = ['170,220,255', '200,232,255', '150,200,255'] as const;

function pick<T>(list: readonly T[], r: number): T {
  return list[Math.min(list.length - 1, Math.floor(r * list.length))] as T;
}

/** Soft additive light: a street lamp in the rain, a sign's spill. */
function bloom(
  ctx: Ctx,
  x: number,
  y: number,
  radius: number,
  rgb: string,
  alpha: number,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.5, `rgba(${rgb},${alpha * 0.35})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

/**
 * Run `draw` three times so whatever it paints wraps around the left/right
 * edges. `primary` is true for the copy that sits inside the canvas proper.
 */
function tiled(ctx: Ctx, width: number, draw: (primary: boolean) => void) {
  for (const dx of [-width, 0, width]) {
    ctx.save();
    ctx.translate(dx, 0);
    draw(dx === 0);
    ctx.restore();
  }
}

/** Where a canvas point sits in the layer's uv (u wraps, v points up). */
function toUv(point: { x: number; y: number }, w: number, h: number): SkylineBeacon {
  return { u: (((point.x / w) % 1) + 1) % 1, v: 1 - point.y / h };
}

type Roof = 'flat' | 'stepped' | 'spire' | 'crown' | 'slant' | 'tank' | 'billboard';
type Glazing = 'dots' | 'homes' | 'offices' | 'ribbon' | 'rooms';

interface Tower {
  /** Left edge, roofline (canvas y) and width, px. */
  x: number;
  top: number;
  w: number;
  roof: Roof;
  glazing: Glazing;
  seed: number;
  /** 0..1 — how much of the building is awake. */
  lit: number;
}

interface Look {
  /** Wall colour at the roof and at street level. */
  wallTop: string;
  wallBottom: string;
  /** The slightly lighter flank that makes a box read as a building. */
  flank: string;
  /** Roof furniture, parapets. */
  trim: string;
  /** Detail scale: 1 = the mid layer. */
  scale: number;
}

/** Paints one building. Returns the canvas position of its beacon, if it has one. */
function paintTower(
  ctx: Ctx,
  tower: Tower,
  look: Look,
  height: number,
): { x: number; y: number } | null {
  const random = seeded(tower.seed);
  const { x, w, glazing } = tower;
  const s = look.scale;
  let top = tower.top;
  let beacon: { x: number; y: number } | null = null;
  const cx = x + w / 2;

  const wall = ctx.createLinearGradient(0, top, 0, height);
  wall.addColorStop(0, look.wallTop);
  wall.addColorStop(1, look.wallBottom);

  /* ---- what stands on the roof ---- */
  ctx.fillStyle = wall;
  ctx.strokeStyle = look.trim;
  ctx.lineWidth = Math.max(1, 2 * s);
  switch (tower.roof) {
    case 'stepped':
    case 'spire': {
      let stepWidth = w;
      let stepTop = top;
      const steps = 2 + Math.floor(random() * 2);
      for (let i = 0; i < steps; i += 1) {
        stepWidth *= 0.7;
        const stepHeight = (16 + random() * 22) * s;
        stepTop -= stepHeight;
        ctx.fillRect(cx - stepWidth / 2, stepTop, stepWidth, stepHeight + 1);
      }
      if (tower.roof === 'spire') {
        const mast = (46 + random() * 40) * s;
        ctx.beginPath();
        ctx.moveTo(cx, stepTop);
        ctx.lineTo(cx, stepTop - mast);
        ctx.stroke();
        beacon = { x: cx, y: stepTop - mast };
      }
      break;
    }
    case 'crown': {
      const rise = (40 + random() * 30) * s;
      ctx.beginPath();
      ctx.moveTo(x, top + 1);
      ctx.lineTo(x + w * 0.2, top - rise * 0.55);
      ctx.lineTo(cx - w * 0.08, top - rise);
      ctx.lineTo(cx + w * 0.08, top - rise);
      ctx.lineTo(x + w * 0.8, top - rise * 0.55);
      ctx.lineTo(x + w, top + 1);
      ctx.closePath();
      ctx.fill();
      const mast = 34 * s;
      ctx.beginPath();
      ctx.moveTo(cx, top - rise);
      ctx.lineTo(cx, top - rise - mast);
      ctx.stroke();
      beacon = { x: cx, y: top - rise - mast };
      // the crown is lit from inside
      bloom(ctx, cx, top - rise * 0.5, w * 0.5, '255,200,140', 0.22);
      break;
    }
    case 'slant': {
      const rise = (18 + random() * 26) * s;
      const leftHigh = random() > 0.5;
      ctx.beginPath();
      ctx.moveTo(x, top + 1);
      ctx.lineTo(x, top - (leftHigh ? rise : 0));
      ctx.lineTo(x + w, top - (leftHigh ? 0 : rise));
      ctx.lineTo(x + w, top + 1);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'tank': {
      // a water tank on legs: the oldest shape on any skyline
      const tankWidth = Math.min(w * 0.42, 60 * s);
      const tx = x + w * (0.2 + random() * 0.4);
      const legs = 16 * s;
      const body = 26 * s;
      ctx.fillStyle = look.trim;
      ctx.fillRect(tx, top - legs, 2 * s, legs);
      ctx.fillRect(tx + tankWidth - 2 * s, top - legs, 2 * s, legs);
      ctx.fillRect(tx + tankWidth / 2 - s, top - legs, 2 * s, legs);
      ctx.fillStyle = look.wallTop;
      ctx.fillRect(tx - 2 * s, top - legs - body, tankWidth + 4 * s, body);
      ctx.beginPath();
      ctx.moveTo(tx - 4 * s, top - legs - body);
      ctx.lineTo(tx + tankWidth / 2, top - legs - body - 12 * s);
      ctx.lineTo(tx + tankWidth + 4 * s, top - legs - body);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'billboard': {
      const boardWidth = Math.min(w * 0.8, 150 * s);
      const boardHeight = 44 * s;
      const bx = cx - boardWidth / 2;
      const by = top - 18 * s - boardHeight;
      ctx.fillStyle = look.trim;
      ctx.fillRect(bx + boardWidth * 0.2, top - 18 * s, 3 * s, 18 * s);
      ctx.fillRect(bx + boardWidth * 0.8, top - 18 * s, 3 * s, 18 * s);
      const magenta = random() > 0.4;
      const panel = ctx.createLinearGradient(bx, by, bx + boardWidth, by + boardHeight);
      panel.addColorStop(0, magenta ? '#ff4fa3' : '#48e0ff');
      panel.addColorStop(1, magenta ? '#8a5bff' : '#4f7bff');
      ctx.fillStyle = panel;
      ctx.fillRect(bx, by, boardWidth, boardHeight);
      // abstract "artwork": a few dark bars, so it reads as a sign, not a lamp
      ctx.fillStyle = 'rgba(10,8,30,0.55)';
      for (let i = 0; i < 4; i += 1) {
        const barWidth = boardWidth * (0.08 + random() * 0.16);
        ctx.fillRect(
          bx + boardWidth * (0.08 + i * 0.22),
          by + boardHeight * 0.3,
          barWidth,
          boardHeight * 0.4,
        );
      }
      bloom(
        ctx,
        cx,
        by + boardHeight / 2,
        boardWidth * 0.95,
        magenta ? '255,90,170' : '90,210,255',
        0.3,
      );
      break;
    }
    case 'flat':
    default: {
      // parapet, a stair bulkhead, a couple of AC units, maybe an aerial
      const units = 1 + Math.floor(random() * 3);
      for (let i = 0; i < units; i += 1) {
        const uw = (10 + random() * 26) * s;
        const uh = (6 + random() * 14) * s;
        ctx.fillStyle = look.wallTop;
        ctx.fillRect(x + random() * Math.max(1, w - uw), top - uh, uw, uh + 1);
      }
      if (random() > 0.55) {
        const ax = x + w * (0.15 + random() * 0.7);
        const mast = (20 + random() * 30) * s;
        ctx.beginPath();
        ctx.moveTo(ax, top);
        ctx.lineTo(ax, top - mast);
        ctx.stroke();
      }
    }
  }

  /* ---- the body ---- */
  ctx.fillStyle = wall;
  ctx.fillRect(x, top, w, height - top);
  ctx.fillStyle = look.flank;
  ctx.fillRect(x, top, Math.max(2, w * 0.1), height - top);
  ctx.fillStyle = look.trim;
  ctx.fillRect(x, top, w, Math.max(1, 2 * s));
  top += 4 * s;

  /* ---- its windows ---- */
  const inset = Math.max(2, w * 0.1) + 3 * s;
  const usable = w - inset - 4 * s;

  if (glazing === 'dots') {
    const stepX = 5;
    const stepY = 6;
    for (let wy = top + 3; wy < height - 8; wy += stepY) {
      for (let wx = x + 3; wx < x + w - 3; wx += stepX) {
        if (random() < tower.lit * 0.5) {
          const rgb = random() > 0.3 ? pick(WARM, random()) : pick(COOL, random());
          ctx.fillStyle = `rgba(${rgb},${0.35 + random() * 0.5})`;
          ctx.fillRect(wx, wy, 2, 2.4);
        }
      }
    }
  } else if (glazing === 'homes') {
    // flats: every window its own life — on, off, a different lamp
    const cellX = 15 * s;
    const cellY = 19 * s;
    const cols = Math.max(1, Math.floor(usable / cellX));
    const pad = (usable - cols * cellX) / 2;
    for (let wy = top + 6 * s; wy < height - cellY; wy += cellY) {
      for (let c = 0; c < cols; c += 1) {
        const wx = x + inset + pad + c * cellX;
        const r = random();
        if (r < tower.lit) {
          const rgb = random() > 0.22 ? pick(WARM, random()) : pick(COOL, random());
          ctx.fillStyle = `rgba(${rgb},${0.55 + random() * 0.45})`;
        } else {
          ctx.fillStyle = 'rgba(70,90,160,0.16)';
        }
        ctx.fillRect(wx + 2 * s, wy, cellX - 6 * s, cellY - 8 * s);
      }
    }
  } else if (glazing === 'offices') {
    // offices: whole floors left on, in cold white
    const cellX = 11 * s;
    const cellY = 16 * s;
    const cols = Math.max(1, Math.floor(usable / cellX));
    const pad = (usable - cols * cellX) / 2;
    for (let wy = top + 6 * s; wy < height - cellY; wy += cellY) {
      const floorLit = random() < tower.lit * 0.75;
      const rgb = random() > 0.3 ? pick(COOL, random()) : pick(WARM, random());
      for (let c = 0; c < cols; c += 1) {
        const wx = x + inset + pad + c * cellX;
        const on = floorLit ? random() > 0.12 : random() < 0.05;
        ctx.fillStyle = on
          ? `rgba(${rgb},${0.5 + random() * 0.4})`
          : 'rgba(70,90,160,0.14)';
        ctx.fillRect(wx + s, wy, cellX - 3 * s, cellY - 7 * s);
      }
    }
  } else if (glazing === 'ribbon') {
    // a glass tower: mullions catching the city, a few bright storeys
    ctx.fillStyle = 'rgba(110,140,220,0.13)';
    const rib = 9 * s;
    for (let wx = x + inset; wx < x + w - 4 * s; wx += rib) {
      ctx.fillRect(wx, top + 4 * s, rib - 3 * s, height - top);
    }
    const cellY = 15 * s;
    for (let wy = top + 8 * s; wy < height - cellY; wy += cellY) {
      if (random() < tower.lit * 0.5) {
        const rgb = random() > 0.5 ? pick(COOL, random()) : pick(WARM, random());
        const from = x + inset + random() * usable * 0.4;
        const span = usable * (0.25 + random() * 0.6);
        ctx.fillStyle = `rgba(${rgb},${0.4 + random() * 0.4})`;
        ctx.fillRect(from, wy, Math.min(span, x + w - 4 * s - from), cellY - 8 * s);
      }
    }
  } else {
    // 'rooms' — the near buildings: windows big enough to look into
    const cellX = 46 * s;
    const cellY = 58 * s;
    const cols = Math.max(1, Math.floor(usable / cellX));
    const pad = (usable - cols * cellX) / 2;
    for (let wy = top + 14 * s; wy < height - cellY * 0.6; wy += cellY) {
      // a ledge under every floor
      ctx.fillStyle = look.trim;
      ctx.fillRect(x, wy + cellY - 12 * s, w, 2 * s);
      for (let c = 0; c < cols; c += 1) {
        const wx = x + inset + pad + c * cellX + 7 * s;
        const ww = cellX - 14 * s;
        const wh = cellY - 22 * s;
        const r = random();
        if (r >= tower.lit) {
          // dark glass, holding a little of the sky
          const glass = ctx.createLinearGradient(0, wy, 0, wy + wh);
          glass.addColorStop(0, 'rgba(60,80,150,0.32)');
          glass.addColorStop(1, 'rgba(30,40,90,0.18)');
          ctx.fillStyle = glass;
          ctx.fillRect(wx, wy, ww, wh);
        } else {
          const tv = random() < 0.16;
          const rgb = tv ? '150,205,255' : pick(WARM, random());
          const room = ctx.createLinearGradient(0, wy, 0, wy + wh);
          room.addColorStop(0, `rgba(${rgb},0.98)`);
          room.addColorStop(1, `rgba(${rgb},0.62)`);
          ctx.fillStyle = room;
          ctx.fillRect(wx, wy, ww, wh);
          const dressing = random();
          ctx.fillStyle = 'rgba(30,18,24,0.5)';
          if (dressing < 0.3) {
            // half-drawn curtain
            ctx.fillRect(wx, wy, ww * (0.3 + random() * 0.25), wh);
          } else if (dressing < 0.55) {
            // blinds
            for (
              let by = wy + 3 * s;
              by < wy + wh * (0.4 + random() * 0.6);
              by += 4 * s
            ) {
              ctx.fillRect(wx, by, ww, 1.6 * s);
            }
          } else if (dressing < 0.72) {
            // a plant on the sill
            const px = wx + ww * (0.25 + random() * 0.5);
            ctx.beginPath();
            ctx.ellipse(px, wy + wh - 9 * s, 6 * s, 9 * s, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(px - 3 * s, wy + wh - 4 * s, 6 * s, 4 * s);
          }
          bloom(ctx, wx + ww / 2, wy + wh / 2, cellX * 0.95, rgb, 0.16);
        }
        // frame and a single mullion
        ctx.fillStyle = look.wallBottom;
        ctx.fillRect(wx + ww / 2 - s, wy, 2 * s, wh);
        ctx.fillStyle = look.trim;
        ctx.fillRect(wx - 2 * s, wy + wh, ww + 4 * s, 3 * s);
      }
    }
  }

  return beacon;
}

/** Fade the feet of a layer into the wet glow of the streets below it. */
function streetHaze(
  ctx: Ctx,
  w: number,
  h: number,
  from: number,
  rgb: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, h * from, 0, h);
  g.addColorStop(0, `rgba(${rgb},0)`);
  g.addColorStop(1, `rgba(${rgb},${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, h * from, w, h * (1 - from));
  ctx.restore();
}

/**
 * Fill the gaps between buildings with ground fog that thickens toward the
 * street, ending in a solid row — which is what lets the layer be clamped
 * downward (the wide shot looks down into the city).
 */
function groundFog(ctx: Ctx, w: number, h: number, from: number, rgb: string) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  const g = ctx.createLinearGradient(0, h * from, 0, h - 6);
  g.addColorStop(0, `rgba(${rgb},0)`);
  g.addColorStop(1, `rgba(${rgb},1)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, h * from, w, h * (1 - from));
  ctx.restore();
  ctx.fillStyle = `rgb(${rgb})`;
  ctx.fillRect(0, h - 6, w, 6);
}

/* ----------------------------------- sky ---------------------------------- */

/** Overcast and raining: cloud lit from below by the city, the moon behind it. */
export function paintSky(ctx: Ctx, w: number, h: number): void {
  const random = seeded(73);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#04061a');
  sky.addColorStop(0.2, '#0a1034');
  sky.addColorStop(0.34, '#181a4c');
  sky.addColorStop(0.46, '#33286a');
  sky.addColorStop(0.58, '#5e3a74');
  sky.addColorStop(0.75, '#7c4668');
  sky.addColorStop(1, '#8a4a5c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // the moon, before the clouds, so they can pass in front of it
  // low enough to be seen from the desk, and clear of the tallest far towers
  const mx = w * 0.63;
  const my = h * 0.36;
  bloom(ctx, mx, my, h * 0.36, '140,165,255', 0.3);
  bloom(ctx, mx, my, h * 0.11, '215,228,255', 0.55);
  const disc = ctx.createRadialGradient(mx, my, 0, mx, my, h * 0.02);
  disc.addColorStop(0, 'rgba(244,247,255,1)');
  disc.addColorStop(0.75, 'rgba(236,242,255,0.95)');
  disc.addColorStop(1, 'rgba(220,230,255,0)');
  ctx.fillStyle = disc;
  ctx.fillRect(mx - h * 0.03, my - h * 0.03, h * 0.06, h * 0.06);

  // cloud: long soft smudges — dark bellies up high, and lower down the
  // undersides catching the city's violet
  const smudge = (cxp: number, cy: number, rx: number, ry: number, rgba: string) => {
    ctx.save();
    ctx.translate(cxp, cy);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba);
    g.addColorStop(1, rgba.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  };
  for (let i = 0; i < 190; i += 1) {
    const cy = h * (0.03 + random() ** 1.2 * 0.52);
    const cxp = random() * w;
    const rx = w * (0.05 + random() * 0.15);
    const ry = h * (0.014 + random() * 0.04);
    const low = Math.min(1, cy / (h * 0.5));
    if (random() > 0.45) {
      const rgb = `${Math.round(5 + low * 22)},${Math.round(7 + low * 12)},${Math.round(24 + low * 34)}`;
      smudge(cxp, cy, rx, ry, `rgba(${rgb},${0.26 + random() * 0.26})`);
    } else {
      const rgb = `${Math.round(84 + low * 110)},${Math.round(82 + low * 26)},${Math.round(160 + low * 24)}`;
      smudge(cxp, cy + ry * 0.6, rx, ry * 0.7, `rgba(${rgb},${0.07 + random() * 0.1})`);
    }
  }
  // a few wisps straight across the moon, so it sits *in* the weather
  for (let i = 0; i < 5; i += 1) {
    smudge(
      mx + (random() - 0.5) * w * 0.12,
      my + (random() - 0.35) * h * 0.07,
      w * (0.05 + random() * 0.05),
      h * 0.016,
      `rgba(18,22,60,${0.3 + random() * 0.2})`,
    );
  }

  // the city's glow on the underside of the weather
  const glow = ctx.createLinearGradient(0, h * 0.36, 0, h * 0.7);
  glow.addColorStop(0, 'rgba(255,120,170,0)');
  glow.addColorStop(1, 'rgba(255,130,150,0.22)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, h * 0.36, w, h * 0.64);
}

/* ---------------------------------- layers -------------------------------- */

function roofline(layer: SkylineLayerId, h: number, worldY: number): number {
  const { bottom, height } = SKYLINE[layer];
  return h - ((worldY - bottom) / height) * h;
}

/** The far skyline: many small towers, two landmarks, all of it in haze. */
export function paintFar(ctx: Ctx, w: number, h: number): SkylineBeacon[] {
  const random = seeded(211);
  ctx.clearRect(0, 0, w, h);
  const back: Look = {
    wallTop: '#343a78',
    wallBottom: '#262a5e',
    flank: 'rgba(120,130,210,0.10)',
    trim: '#3c4384',
    scale: 0.42,
  };
  const front: Look = {
    ...back,
    wallTop: '#262c64',
    wallBottom: '#1c2050',
    trim: '#2f3672',
  };

  const towers: { tower: Tower; look: Look }[] = [];
  const roofs: Roof[] = ['flat', 'flat', 'stepped', 'slant', 'flat', 'stepped'];
  for (const [look, low, high, lit] of [
    [back, 1.0, 2.25, 0.5],
    [front, 0.25, 1.5, 0.75],
  ] as const) {
    let x = random() * 20;
    while (x < w) {
      const width = 30 + random() * 56;
      towers.push({
        look,
        tower: {
          x,
          w: width,
          top: roofline('far', h, low + random() ** 1.5 * (high - low)),
          roof: pick(roofs, random()),
          glazing: 'dots',
          seed: Math.floor(random() * 1e6),
          lit: lit * (0.5 + random() * 0.7),
        },
      });
      x += width * (0.72 + random() * 0.5);
    }
  }
  // two landmarks, placed where the desk view can see them
  const landmark = (
    u: number,
    worldTop: number,
    width: number,
    roof: Roof,
    seed: number,
  ) => ({
    look: back,
    tower: {
      x: w * u - width / 2,
      w: width,
      top: roofline('far', h, worldTop),
      roof,
      glazing: 'dots' as const,
      seed,
      lit: 0.9,
    },
  });
  towers.splice(
    Math.floor(towers.length / 2),
    0,
    landmark(0.57, 2.55, 38, 'crown', 5),
    landmark(0.36, 2.2, 46, 'spire', 9),
    landmark(0.9, 2.35, 40, 'spire', 14),
  );

  const lights: SkylineBeacon[] = [];
  tiled(ctx, w, (primary) => {
    for (const { tower, look } of towers) {
      const at = paintTower(ctx, tower, look, h);
      if (at && primary) lights.push(toUv(at, w, h));
    }
  });

  streetHaze(ctx, w, h, 0.35, '170,110,190', 0.5);
  groundFog(ctx, w, h, 0.7, '75,58,120');
  return lights;
}

/** The middle distance: real buildings — lit floors, glass, signs, tanks. */
export function paintMid(ctx: Ctx, w: number, h: number): SkylineBeacon[] {
  const random = seeded(389);
  ctx.clearRect(0, 0, w, h);
  const look: Look = {
    wallTop: '#151a42',
    wallBottom: '#0d1030',
    flank: 'rgba(110,125,215,0.10)',
    trim: '#232a5e',
    scale: 1,
  };
  const plan: [Roof, Glazing, number, number][] = [
    // roof, glazing, roof height (world), width (px)
    ['tank', 'homes', 0.55, 250],
    ['flat', 'offices', 1.05, 200],
    ['billboard', 'homes', 0.3, 280],
    ['spire', 'ribbon', 1.35, 170],
    ['flat', 'homes', 0.72, 230],
    ['slant', 'offices', 0.95, 190],
    ['tank', 'homes', 0.18, 260],
    ['stepped', 'ribbon', 1.18, 180],
    ['billboard', 'offices', 0.5, 240],
  ];
  const towers: Tower[] = [];
  let x = 0;
  const gapTotal = w - plan.reduce((sum, item) => sum + item[3], 0);
  for (const [roof, glazing, worldTop, width] of plan) {
    x += (gapTotal / plan.length) * (0.4 + random() * 1.2);
    towers.push({
      x,
      w: width,
      top: roofline('mid', h, worldTop),
      roof,
      glazing,
      seed: Math.floor(random() * 1e6),
      lit: 0.22 + random() * 0.34,
    });
    x += width;
  }

  const lights: SkylineBeacon[] = [];
  tiled(ctx, w, (primary) => {
    for (const tower of towers) {
      const at = paintTower(ctx, tower, look, h);
      if (at && primary) lights.push(toUv(at, w, h));
    }
  });

  // a vertical neon sign down the side of two of them
  tiled(ctx, w, () => {
    for (const [index, rgb] of [
      [1, '80,230,255'],
      [4, '255,80,170'],
    ] as const) {
      const tower = towers[index];
      if (!tower) continue;
      const sx = tower.x + tower.w - 16;
      const sy = tower.top + 40;
      ctx.fillStyle = `rgba(${rgb},0.95)`;
      ctx.fillRect(sx, sy, 9, 130);
      ctx.fillStyle = 'rgba(8,8,28,0.7)';
      for (let i = 1; i < 5; i += 1) ctx.fillRect(sx, sy + i * 26 - 3, 9, 5);
      bloom(ctx, sx + 4, sy + 65, 90, rgb, 0.3);
    }
  });

  // street lamps and traffic, far below, smeared by the rain
  tiled(ctx, w, () => {
    const lamps = seeded(57);
    for (let i = 0; i < 46; i += 1) {
      const tint = lamps();
      const rgb = tint > 0.6 ? '255,170,90' : tint > 0.3 ? '255,110,160' : '120,200,255';
      bloom(
        ctx,
        lamps() * w,
        h * (0.8 + lamps() * 0.2),
        14 + lamps() * 34,
        rgb,
        0.2 + lamps() * 0.22,
      );
    }
  });

  streetHaze(ctx, w, h, 0.55, '150,90,170', 0.42);
  groundFog(ctx, w, h, 0.72, '44,33,79');
  return lights;
}

/** Across the street: two buildings close enough to see into. */
export function paintNear(ctx: Ctx, w: number, h: number): SkylineBeacon[] {
  ctx.clearRect(0, 0, w, h);
  const look: Look = {
    wallTop: '#0b0d24',
    wallBottom: '#07081a',
    flank: 'rgba(100,115,200,0.09)',
    trim: '#171b3e',
    scale: 1.15,
  };
  const towers: Tower[] = [
    // left of the desk view: tall, with a water tank
    {
      x: w * 0.12,
      w: w * 0.3,
      top: roofline('near', h, 1.12),
      roof: 'tank',
      glazing: 'rooms',
      seed: 4021,
      lit: 0.34,
    },
    // out of frame from the desk; slides in when the camera turns or pulls back
    {
      x: w * 0.7,
      w: w * 0.22,
      top: roofline('near', h, 0.62),
      roof: 'flat',
      glazing: 'rooms',
      seed: 977,
      lit: 0.42,
    },
  ];
  tiled(ctx, w, () => {
    for (const tower of towers) paintTower(ctx, tower, look, h);
  });
  streetHaze(ctx, w, h, 0.6, '120,70,150', 0.3);
  // unlike the other layers this one has gaps, so its bottom row must stay
  // exactly as painted: clamping repeats it downward
  return [];
}

/* --------------------------------- textures -------------------------------- */

function layerTexture(
  width: number,
  height: number,
  paint: (ctx: Ctx, w: number, h: number) => SkylineBeacon[],
): SkylinePaint {
  let beacons: SkylineBeacon[] = [];
  const texture = canvasTexture(width, height, (ctx, w, h) => {
    beacons = paint(ctx, w, h);
  });
  texture.wrapS = RepeatWrapping;
  texture.needsUpdate = true;
  return { texture, beacons };
}

export function createSkyTexture(): CanvasTexture {
  return canvasTexture(1024, 512, paintSky);
}

export function createFarSkyline(): SkylinePaint {
  return layerTexture(1024, 512, paintFar);
}

export function createMidSkyline(): SkylinePaint {
  return layerTexture(2048, 1024, paintMid);
}

export function createNearSkyline(): SkylinePaint {
  return layerTexture(2048, 1024, paintNear);
}
