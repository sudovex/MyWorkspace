/**
 * Large-surface textures: wood, floor planks, painted wall, rug, soft glows.
 */
import { type CanvasTexture } from 'three';
import { canvasTexture, grain, seeded } from './canvas';

/** Warm walnut desk top — long streaky grain with a few darker figure bands. */
export function createDeskWoodTexture(): CanvasTexture {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const rand = seeded(11);
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, '#6f4a30');
    base.addColorStop(0.5, '#7a5236');
    base.addColorStop(1, '#684429');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 520; i += 1) {
      const y = rand() * h;
      const wobble = 3 + rand() * 9;
      const light = rand() > 0.55;
      ctx.strokeStyle = light
        ? `rgba(214,160,108,${0.03 + rand() * 0.06})`
        : `rgba(38,20,10,${0.04 + rand() * 0.1})`;
      ctx.lineWidth = 0.6 + rand() * 1.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      const freq = 0.004 + rand() * 0.006;
      const offset = rand() * 100;
      for (let x = 0; x <= w; x += 32) {
        ctx.lineTo(x, y + Math.sin(x * freq + offset) * wobble);
      }
      ctx.stroke();
    }
    // A couple of soft cathedral figures.
    for (let i = 0; i < 3; i += 1) {
      const cx = rand() * w;
      const cy = rand() * h;
      for (let r = 8; r < 90; r += 9) {
        ctx.strokeStyle = `rgba(40,22,12,${0.06 - r * 0.0005})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 3.4, r * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    grain(ctx, w, h, 10, 3);
  });
}

/** Dark herringbone-free plank floor; tiles across the room. */
export function createFloorTexture(): CanvasTexture {
  return canvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      const rand = seeded(23);
      ctx.fillStyle = '#2a1f1a';
      ctx.fillRect(0, 0, w, h);
      const plankH = h / 8;
      for (let row = 0; row < 8; row += 1) {
        const y = row * plankH;
        let x = -rand() * 300;
        while (x < w) {
          const len = 260 + rand() * 300;
          const tone = 26 + Math.floor(rand() * 18);
          ctx.fillStyle = `rgb(${tone + 22},${tone + 6},${tone - 2})`;
          ctx.fillRect(x, y, len, plankH);
          for (let i = 0; i < 26; i += 1) {
            ctx.strokeStyle = `rgba(12,7,4,${0.05 + rand() * 0.12})`;
            ctx.lineWidth = 0.6 + rand() * 1.2;
            const yy = y + rand() * plankH;
            ctx.beginPath();
            ctx.moveTo(x, yy);
            ctx.lineTo(x + len, yy + (rand() - 0.5) * 6);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(6,4,3,0.75)';
          ctx.fillRect(x + len - 2, y, 2.5, plankH);
          x += len;
        }
        ctx.fillStyle = 'rgba(6,4,3,0.8)';
        ctx.fillRect(0, y, w, 2.5);
      }
      grain(ctx, w, h, 8, 5);
    },
    { repeat: [2.2, 2.2] },
  );
}

/** Painted plaster wall — a deep ink blue with roller mottling. */
export function createWallTexture(): CanvasTexture {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      const rand = seeded(31);
      ctx.fillStyle = '#27304a';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i += 1) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 10 + rand() * 46;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const light = rand() > 0.5;
        g.addColorStop(0, light ? 'rgba(120,136,190,0.035)' : 'rgba(8,10,22,0.05)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      grain(ctx, w, h, 7, 9);
    },
    { repeat: [3, 2] },
  );
}

/** A flat-woven rug: muted field, border bands, a quiet geometric motif. */
export function createRugTexture(): CanvasTexture {
  return canvasTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2b2f45';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c98a4b';
    ctx.lineWidth = 6;
    ctx.strokeRect(26, 26, w - 52, h - 52);
    ctx.strokeStyle = 'rgba(214,220,240,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, w - 88, h - 88);

    ctx.strokeStyle = 'rgba(160,172,214,0.22)';
    ctx.lineWidth = 2;
    const step = 56;
    for (let x = 80; x < w - 60; x += step) {
      for (let y = 80; y < h - 60; y += step) {
        ctx.beginPath();
        ctx.moveTo(x, y - 16);
        ctx.lineTo(x + 16, y);
        ctx.lineTo(x, y + 16);
        ctx.lineTo(x - 16, y);
        ctx.closePath();
        ctx.stroke();
      }
    }
    // weave lines
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    grain(ctx, w, h, 16, 13);
  });
}

/** Felt desk mat with a stitched edge. */
export function createDeskMatTexture(): CanvasTexture {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#15171f';
    ctx.fillRect(0, 0, w, h);
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = 'rgba(150,160,190,0.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(9, 9, w - 18, h - 18);
    ctx.setLineDash([]);
    grain(ctx, w, h, 14, 17);
  });
}

/** Soft round falloff — reused for glows, light pools and beacons. */
export function createGlowTexture(
  inner = 'rgba(255,255,255,1)',
  outer = 'rgba(255,255,255,0)',
  size = 128,
): CanvasTexture {
  return canvasTexture(size, size, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  });
}

/** A thin ring — the pulsing "this is clickable" beacon. */
export function createRingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (ctx, w) => {
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(w / 2, w / 2, w / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();
  });
}

/**
 * The window's light falling across the floor: four soft panes, sheared so it
 * reads as moonlight raking in at an angle.
 */
export function createWindowLightTexture(): CanvasTexture {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.filter = 'blur(14px)';
    ctx.fillStyle = 'rgba(150,185,255,0.9)';
    const pad = 70;
    const gap = 22;
    const pw = (w - pad * 2 - gap) / 2;
    const ph = (h - pad * 2 - gap) / 2;
    for (let i = 0; i < 2; i += 1) {
      for (let j = 0; j < 2; j += 1) {
        ctx.fillRect(pad + i * (pw + gap), pad + j * (ph + gap), pw, ph);
      }
    }
    ctx.filter = 'none';
  });
}

/**
 * Darkness, as a gradient: an alpha map (three reads the green channel) that
 * is opaque at its left edge and clear at its right. Laid over the far end of
 * a wall so it runs off into the dark instead of just stopping.
 */
export function createFalloffTexture(): CanvasTexture {
  return canvasTexture(
    256,
    4,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, '#d2d2d2');
      g.addColorStop(0.65, '#5a5a5a');
      g.addColorStop(1, '#000000');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { srgb: false },
  );
}
