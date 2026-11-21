/**
 * Painted textures for individual props (the city outside the window lives
 * in `skyline.ts`): the desk
 * calendar (today's real date), the phone lock screen, wall art, the neon
 * sign, book spines and the notebook page.
 */
import { type CanvasTexture } from 'three';
import { canvasTexture, grain, roundRect, seeded } from './canvas';

export interface Fonts {
  mono: string;
  sans: string;
}

/** Tear-off desk calendar showing the real date. */
export function createCalendarTexture(fonts: Fonts, now: Date): CanvasTexture {
  return canvasTexture(512, 600, (ctx, w, h) => {
    ctx.fillStyle = '#f4efe4';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#c4452f';
    ctx.fillRect(0, 0, w, 118);
    ctx.fillStyle = '#fff6ea';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 50px ${fonts.sans}`;
    const month = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    ctx.fillText(month, w / 2, 56);
    ctx.font = `500 22px ${fonts.mono}`;
    ctx.fillStyle = 'rgba(255,246,234,0.8)';
    ctx.fillText(String(now.getFullYear()), w / 2, 96);

    // binder holes
    ctx.fillStyle = '#2a211c';
    for (const x of [w * 0.28, w * 0.72]) {
      ctx.beginPath();
      ctx.arc(x, 16, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#211c18';
    ctx.font = `700 250px ${fonts.sans}`;
    ctx.fillText(String(now.getDate()), w / 2, 292);

    ctx.fillStyle = '#c4452f';
    ctx.font = `600 34px ${fonts.sans}`;
    const weekday = now.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
    ctx.fillText(weekday, w / 2, 452);

    ctx.strokeStyle = 'rgba(33,28,24,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 492);
    ctx.lineTo(w - 60, 492);
    ctx.stroke();

    ctx.fillStyle = 'rgba(33,28,24,0.62)';
    ctx.font = `500 22px ${fonts.mono}`;
    ctx.fillText('career timeline  →', w / 2, 540);
    grain(ctx, w, h, 6, 19);
  });
}

/** Phone lock screen — a soft wallpaper, the time, one waiting notification. */
export function createPhoneTexture(fonts: Fonts, now: Date): CanvasTexture {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#1b1f4a');
    bg.addColorStop(0.55, '#3b2a6b');
    bg.addColorStop(1, '#b0506a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 64px ${fonts.sans}`;
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    ctx.fillText(time, w / 2, 118);
    ctx.font = `500 16px ${fonts.sans}`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
      w / 2,
      166,
    );

    roundRect(ctx, 18, 300, w - 36, 104, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 17px ${fonts.sans}`;
    ctx.fillText('New message', 36, 330);
    ctx.font = `400 15px ${fonts.sans}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('Got a role in mind?', 36, 356);
    ctx.fillText('Tap to say hello →', 36, 378);

    roundRect(ctx, w / 2 - 42, h - 22, 84, 6, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  });
}

/** Typographic poster for the wall. */
export function createTypePosterTexture(fonts: Fonts): CanvasTexture {
  return canvasTexture(384, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ece6d8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#17192a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `800 62px ${fonts.sans}`;
    ['MAKE IT', 'WORK.', 'MAKE IT', 'RIGHT.', 'MAKE IT'].forEach((line, i) => {
      ctx.fillText(line, 34, 96 + i * 66);
    });
    ctx.fillStyle = '#d2562f';
    ctx.fillText('FAST.', 34, 96 + 5 * 66);
    ctx.fillStyle = 'rgba(23,25,42,0.6)';
    ctx.font = `500 15px ${fonts.mono}`;
    ctx.fillText('— in that order', 36, h - 34);
    grain(ctx, w, h, 8, 29);
  });
}

/** A graphic print of a winding road at dusk — the helmet's reason to exist. */
export function createRoadPosterTexture(): CanvasTexture {
  return canvasTexture(384, 512, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, '#23204f');
    sky.addColorStop(0.6, '#d0603f');
    sky.addColorStop(1, '#f2b25a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffe2a8';
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.47, 46, 0, Math.PI * 2);
    ctx.fill();

    const ridge = (yBase: number, amp: number, color: string, seed: number) => {
      const rand = seeded(seed);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      let y = yBase;
      for (let x = 0; x <= w; x += 24) {
        y = yBase + (rand() - 0.5) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };
    ridge(h * 0.54, 60, '#7a3b52', 3);
    ridge(h * 0.63, 46, '#4a2a4c', 5);
    ridge(h * 0.74, 30, '#231a36', 8);

    // the road
    ctx.strokeStyle = '#f2d9a6';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h);
    ctx.bezierCurveTo(w * 0.2, h * 0.9, w * 0.86, h * 0.84, w * 0.5, h * 0.78);
    ctx.bezierCurveTo(w * 0.3, h * 0.75, w * 0.62, h * 0.72, w * 0.56, h * 0.7);
    ctx.stroke();
    grain(ctx, w, h, 9, 37);
  });
}

/** `> hello, world_` in a neon tube — transparent background, glow baked in. */
export function createNeonTexture(fonts: Fonts): CanvasTexture {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 118px ${fonts.mono}`;
    const text = '> hello, world_';
    ctx.shadowColor = 'rgba(255,90,170,0.95)';
    for (const blur of [46, 24, 10]) {
      ctx.shadowBlur = blur;
      ctx.fillStyle = 'rgba(255,120,190,0.9)';
      ctx.fillText(text, w / 2, h / 2 + 4);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff2f8';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

/** Vertical spine lettering for a book. */
export function createSpineTexture(
  fonts: Fonts,
  title: string,
  background: string,
  foreground: string,
  accent: string,
): CanvasTexture {
  return canvasTexture(128, 640, (ctx, w, h) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 44, w, 10);
    ctx.fillRect(0, h - 54, w, 10);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = foreground;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 52px ${fonts.sans}`;
    ctx.fillText(title, 0, 4);
    ctx.restore();
  });
}

/** Open notebook spread: a sketched system diagram and a few ruled lines. */
export function createNotebookTexture(fonts: Fonts): CanvasTexture {
  return canvasTexture(512, 384, (ctx, w, h) => {
    ctx.fillStyle = '#f1ecdf';
    ctx.fillRect(0, 0, w, h);
    // gutter
    const g = ctx.createLinearGradient(w / 2 - 26, 0, w / 2 + 26, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(w / 2 - 26, 0, 52, h);

    ctx.strokeStyle = 'rgba(70,90,150,0.22)';
    ctx.lineWidth = 1;
    for (let y = 48; y < h - 16; y += 24) {
      ctx.beginPath();
      ctx.moveTo(18, y);
      ctx.lineTo(w - 18, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#25304f';
    ctx.font = `700 26px ${fonts.sans}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Projects', 26, 40);

    ctx.strokeStyle = '#25304f';
    ctx.lineWidth = 2.5;
    ctx.font = `500 13px ${fonts.mono}`;
    const box = (x: number, y: number, label: string) => {
      ctx.strokeRect(x, y, 92, 38);
      ctx.fillText(label, x + 9, y + 24);
    };
    box(28, 74, 'client');
    box(28, 164, 'auth svc');
    box(140, 118, 'api');
    ctx.beginPath();
    ctx.moveTo(120, 93);
    ctx.lineTo(140, 128);
    ctx.moveTo(120, 183);
    ctx.lineTo(140, 148);
    ctx.stroke();

    ctx.fillStyle = '#c4452f';
    ctx.font = `600 14px ${fonts.mono}`;
    ['FixMyCode', 'Easy Navigate', 'Web Messenger'].forEach((line, i) => {
      ctx.fillText(`→ ${line}`, w / 2 + 34, 82 + i * 48);
    });
    ctx.strokeStyle = 'rgba(37,48,79,0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + 34, 98 + i * 48);
      ctx.lineTo(w - 50 - i * 22, 98 + i * 48);
      ctx.stroke();
    }
  });
}

/** Yellow sticky note with a scrawled reminder. */
export function createStickyTexture(fonts: Fonts): CanvasTexture {
  return canvasTexture(192, 192, (ctx, w, h) => {
    ctx.fillStyle = '#f0cf52';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(70,52,6,0.85)';
    ctx.font = `600 24px ${fonts.sans}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('ship it', 22, 58);
    ctx.fillText('today', 22, 92);
    ctx.strokeStyle = 'rgba(70,52,6,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, 108);
    ctx.lineTo(120, 104);
    ctx.stroke();
    grain(ctx, w, h, 8, 43);
  });
}

/** The framed certificate on the wall — the doorway to all of them. */
export function createCertificateTexture(
  fonts: Fonts,
  name: string,
  count: number,
): CanvasTexture {
  return canvasTexture(768, 576, (ctx, w, h) => {
    ctx.fillStyle = '#f4efe4';
    ctx.fillRect(0, 0, w, h);

    // printed double border with corner blocks
    ctx.strokeStyle = '#b8923a';
    ctx.lineWidth = 6;
    ctx.strokeRect(26, 26, w - 52, h - 52);
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, w - 84, h - 84);
    ctx.fillStyle = '#b8923a';
    for (const [x, y] of [
      [26, 26],
      [w - 50, 26],
      [26, h - 50],
      [w - 50, h - 50],
    ] as const) {
      ctx.fillRect(x, y, 24, 24);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#a23a22';
    ctx.font = `700 54px ${fonts.sans}`;
    ctx.fillText('C E R T I F I C A T E', w / 2, 136);
    ctx.fillStyle = 'rgba(33,28,24,0.6)';
    ctx.font = `500 22px ${fonts.mono}`;
    ctx.fillText('OF ACHIEVEMENT', w / 2, 174);

    ctx.fillStyle = 'rgba(33,28,24,0.55)';
    ctx.font = `italic 400 24px ${fonts.sans}`;
    ctx.fillText('awarded to', w / 2, 240);
    ctx.fillStyle = '#211c18';
    ctx.font = `italic 700 66px ${fonts.sans}`;
    ctx.fillText(name, w / 2, 314);
    ctx.strokeStyle = 'rgba(33,28,24,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 210, 338);
    ctx.lineTo(w / 2 + 210, 338);
    ctx.stroke();

    ctx.fillStyle = 'rgba(33,28,24,0.7)';
    ctx.font = `500 24px ${fonts.mono}`;
    ctx.fillText(`${count} certifications  ·  click to view`, w / 2, 392);

    // signature scrawl
    ctx.strokeStyle = 'rgba(33,28,24,0.7)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(110, 486);
    ctx.bezierCurveTo(150, 430, 170, 520, 200, 470);
    ctx.bezierCurveTo(220, 440, 240, 500, 290, 462);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(96, 500);
    ctx.lineTo(310, 500);
    ctx.stroke();

    // ribbon + seal
    const sx = w - 150;
    const sy = h - 132;
    ctx.fillStyle = '#a23a22';
    ctx.beginPath();
    ctx.moveTo(sx - 26, sy + 20);
    ctx.lineTo(sx - 40, sy + 92);
    ctx.lineTo(sx - 12, sy + 74);
    ctx.lineTo(sx + 2, sy + 96);
    ctx.lineTo(sx + 8, sy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 26, sy + 20);
    ctx.lineTo(sx + 44, sy + 90);
    ctx.lineTo(sx + 18, sy + 74);
    ctx.lineTo(sx + 2, sy + 96);
    ctx.lineTo(sx - 4, sy + 20);
    ctx.closePath();
    ctx.fill();
    const seal = ctx.createRadialGradient(sx - 14, sy - 14, 4, sx, sy, 52);
    seal.addColorStop(0, '#f6dc8c');
    seal.addColorStop(1, '#b8923a');
    ctx.fillStyle = seal;
    ctx.beginPath();
    for (let i = 0; i < 32; i += 1) {
      const r = i % 2 ? 46 : 52;
      const angle = (i / 32) * Math.PI * 2;
      ctx.lineTo(sx + Math.cos(angle) * r, sy + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,88,20,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 34, 0, Math.PI * 2);
    ctx.stroke();

    grain(ctx, w, h, 6, 83);
  });
}

/** Speaker cloth: a fine woven grid, dark, with a little uneven sheen. */
export function createGrilleTexture(): CanvasTexture {
  return canvasTexture(1024, 96, (ctx, w, h) => {
    ctx.fillStyle = '#1b1d27';
    ctx.fillRect(0, 0, w, h);
    const pitch = 4;
    for (let y = 0; y < h; y += pitch) {
      for (let x = 0; x < w; x += pitch) {
        const offset = (y / pitch) % 2 === 0 ? 0 : pitch / 2;
        ctx.fillStyle = 'rgba(170,180,215,0.26)';
        ctx.fillRect(x + offset, y, 1.6, 1.6);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x + offset + 1.8, y + 1.8, 1.6, 1.6);
      }
    }
    // the cloth catches the light a little more along its upper edge
    const sheen = ctx.createLinearGradient(0, 0, 0, h);
    sheen.addColorStop(0, 'rgba(160,170,210,0.10)');
    sheen.addColorStop(0.45, 'rgba(160,170,210,0)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 10, 97);
  });
}

/**
 * The monitor's cover glass: what it reflects of the room. A soft diagonal
 * band, a brighter line along the top edge where the ceiling catches it, and
 * a warm smudge in the upper right — the desk lamp, seen in the glass.
 * Drawn on black for additive blending, so only the light adds.
 */
export function createGlassSheenTexture(): CanvasTexture {
  return canvasTexture(512, 288, (ctx, w, h) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    const band = ctx.createLinearGradient(0, 0, w * 0.9, h);
    band.addColorStop(0, 'rgba(255,255,255,0)');
    band.addColorStop(0.22, 'rgba(190,205,255,0.55)');
    band.addColorStop(0.3, 'rgba(190,205,255,0.12)');
    band.addColorStop(0.42, 'rgba(190,205,255,0.32)');
    band.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, w, h);

    const top = ctx.createLinearGradient(0, 0, 0, h * 0.12);
    top.addColorStop(0, 'rgba(210,220,255,0.7)');
    top.addColorStop(1, 'rgba(210,220,255,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.12);

    const lamp = ctx.createRadialGradient(
      w * 0.86,
      h * 0.22,
      0,
      w * 0.86,
      h * 0.22,
      w * 0.2,
    );
    lamp.addColorStop(0, 'rgba(255,190,120,0.75)');
    lamp.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, w, h);
  });
}

/** The monogram printed small and low-contrast on the monitor's chin. */
export function createChinMarkTexture(fonts: Fonts): CanvasTexture {
  return canvasTexture(128, 48, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(200,208,228,0.9)';
    ctx.font = `600 26px ${fonts.sans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S M', w / 2, h / 2 + 1);
  });
}

/**
 * The shaker bottle's body: smoky translucent plastic with a printed scale
 * of measurement ticks and a small monogram. Drawn around the cylinder, with
 * the print centred at u = 0.5 (the side the object turns toward the camera).
 */
export function createShakerTexture(fonts: Fonts): CanvasTexture {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(40,46,60,0.62)';
    ctx.fillRect(0, 0, w, h);
    // the measurement scale, a little left of centre
    ctx.fillStyle = 'rgba(235,240,250,0.92)';
    const x = w * 0.43;
    for (let i = 0; i <= 10; i += 1) {
      const y = h * 0.86 - i * (h * 0.068);
      const long = i % 2 === 0;
      ctx.fillRect(x, y, long ? 22 : 12, 2.6);
      if (long && i > 0) {
        ctx.font = `600 13px ${fonts.mono}`;
        ctx.fillText(String(i * 50), x + 27, y + 5);
      }
    }
    // a monogram badge, right of centre
    ctx.font = `700 30px ${fonts.sans}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(214,240,60,0.95)';
    ctx.fillText('SM', w * 0.6, h * 0.5);
    ctx.fillStyle = 'rgba(235,240,250,0.7)';
    ctx.font = `600 11px ${fonts.mono}`;
    ctx.fillText('700 ML', w * 0.6, h * 0.5 + 20);
  });
}
