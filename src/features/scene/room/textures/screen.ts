/**
 * The monitor's idle screen, repainted a few times a second while the room is
 * at rest: a terminal that types its own tour of the workspace and then waits
 * on a blinking cursor. It is a preview of — and visually continuous with —
 * the real DOM terminal that takes over once the camera lands on the screen
 * (see `features/os/`), so the handoff reads as the same machine.
 */
import { SCREEN_COLORS, TERMINAL_PROMPT, TERMINAL_TITLE } from '@/config/screenTheme';
import { roundRect } from './canvas';
import { type Fonts } from './props';

export const SCREEN_TEXTURE_SIZE = { width: 1024, height: 576 } as const;

interface ScriptLine {
  kind: 'command' | 'output' | 'gap';
  text: string;
  color?: string;
}

const SCRIPT: readonly ScriptLine[] = [
  { kind: 'command', text: 'whoami' },
  { kind: 'output', text: 'Shubham Mali — Software Engineer @ miniOrange' },
  { kind: 'gap', text: '' },
  { kind: 'command', text: 'ls ~/workspace' },
  {
    kind: 'output',
    text: 'resume.pdf   experience/   projects/   gallery/   contact.txt',
    color: SCREEN_COLORS.ok,
  },
  { kind: 'gap', text: '' },
  { kind: 'command', text: 'cat focus.txt' },
  { kind: 'output', text: 'backend · identity & security · OAuth2 / OIDC / SAML / SSO' },
  { kind: 'gap', text: '' },
  { kind: 'command', text: './open-terminal --interactive' },
];

const CHAR_MS = 55;
const OUTPUT_PAUSE_MS = 380;
const LOOP_HOLD_MS = 6500;
const PROMPT = TERMINAL_PROMPT;

interface Step {
  line: ScriptLine;
  startMs: number;
  endMs: number;
}

const STEPS: readonly Step[] = (() => {
  const steps: Step[] = [];
  let t = 600;
  for (const line of SCRIPT) {
    const duration =
      line.kind === 'command' ? line.text.length * CHAR_MS + OUTPUT_PAUSE_MS : 140;
    steps.push({ line, startMs: t, endMs: t + duration });
    t += duration;
  }
  return steps;
})();

const SCRIPT_MS = (STEPS[STEPS.length - 1]?.endMs ?? 0) + LOOP_HOLD_MS;

export function paintIdleScreen(
  ctx: CanvasRenderingContext2D,
  fonts: Fonts,
  elapsedMs: number,
  highlight: number,
): void {
  const { width: w, height: h } = SCREEN_TEXTURE_SIZE;
  const t = elapsedMs % SCRIPT_MS;

  const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 60, w * 0.5, h * 0.5, w * 0.72);
  bg.addColorStop(0, SCREEN_COLORS.backgroundEdge);
  bg.addColorStop(1, SCREEN_COLORS.background);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // window chrome
  ctx.fillStyle = SCREEN_COLORS.chrome;
  ctx.fillRect(0, 0, w, 46);
  const dots = ['#ff6b6b', '#ffc857', '#5fd38d'];
  dots.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(28 + i * 24, 23, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = SCREEN_COLORS.dim;
  ctx.font = `500 17px ${fonts.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(TERMINAL_TITLE, w / 2, 24);

  // body
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 23px ${fonts.mono}`;
  const left = 38;
  let y = 100;
  const lineHeight = 36;
  let cursorX = left;
  let cursorY = y;

  for (const step of STEPS) {
    if (t < step.startMs) break;
    const { line } = step;
    if (line.kind === 'gap') {
      y += lineHeight * 0.45;
      continue;
    }
    if (line.kind === 'command') {
      const typed = Math.min(line.text.length, Math.floor((t - step.startMs) / CHAR_MS));
      ctx.fillStyle = SCREEN_COLORS.prompt;
      ctx.fillText(PROMPT, left, y);
      const promptWidth = ctx.measureText(PROMPT).width;
      ctx.fillStyle = SCREEN_COLORS.text;
      const shown = line.text.slice(0, typed);
      ctx.fillText(shown, left + promptWidth, y);
      cursorX = left + promptWidth + ctx.measureText(shown).width;
      cursorY = y;
    } else {
      ctx.fillStyle = line.color ?? SCREEN_COLORS.dim;
      ctx.fillText(line.text, left, y);
    }
    y += lineHeight;
  }

  // block cursor, 530ms blink
  if (Math.floor(elapsedMs / 530) % 2 === 0) {
    ctx.fillStyle = SCREEN_COLORS.accent;
    ctx.fillRect(cursorX + 3, cursorY - 21, 13, 27);
  }

  // call to action — brightens with hover (`highlight` 0..1)
  const pillW = 430;
  const pillH = 52;
  const px = (w - pillW) / 2;
  const py = h - 92;
  roundRect(ctx, px, py, pillW, pillH, 26);
  ctx.fillStyle = `rgba(143,180,255,${0.12 + highlight * 0.22})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(143,180,255,${0.45 + highlight * 0.5})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  const pulse = 0.55 + 0.45 * Math.sin(elapsedMs / 420);
  ctx.fillStyle = `rgba(125,226,168,${0.5 + pulse * 0.5})`;
  ctx.beginPath();
  ctx.arc(px + 30, py + pillH / 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e6eeff';
  ctx.font = `600 20px ${fonts.mono}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('click to open the terminal  →', px + 50, py + pillH / 2 + 1);

  // faint scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let sy = 0; sy < h; sy += 4) ctx.fillRect(0, sy, w, 1);
}
