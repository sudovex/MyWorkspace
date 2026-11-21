/**
 * Tiny helpers for procedurally drawn textures. Every surface in the room is
 * painted at runtime on a 2D canvas — no image assets, no network — which is
 * what lets the placeholder room look finished before production models and
 * textures exist (see `TODO_ASSETS.md`).
 */
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { mulberry32 } from '@/lib/prng';

export type Draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

interface TextureOptions {
  /** Colour data (default) vs. linear data such as roughness maps. */
  srgb?: boolean;
  repeat?: readonly [number, number];
  anisotropy?: number;
}

export function canvasTexture(
  width: number,
  height: number,
  draw: Draw,
  { srgb = true, repeat, anisotropy = 8 }: TextureOptions = {},
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, width, height);
  const texture = new CanvasTexture(canvas);
  if (srgb) texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  if (repeat) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  texture.needsUpdate = true;
  return texture;
}

/** Deterministic PRNG — textures look identical on every load. */
export const seeded = mulberry32;

/** Sprinkle fine monochrome noise over whatever is already drawn. */
export function grain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  seed = 7,
): void {
  const rand = seeded(seed);
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * amount;
    data[i] = Math.max(0, Math.min(255, data[i]! + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]! + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]! + n));
  }
  ctx.putImageData(image, 0, 0);
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export const MONO = '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace';
export const SANS = '"Geist", ui-sans-serif, system-ui, -apple-system, sans-serif';
