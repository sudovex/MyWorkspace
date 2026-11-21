'use client';

/**
 * Snake, played inside the terminal where the prompt usually sits. `/snake`
 * starts it; Esc or Q hands the prompt back and prints the score.
 *
 * Deliberately plain: a grid in the terminal's own colours, a green snake,
 * an amber dot. It owns the clock and the keys; the rules are in `snake.ts`.
 *
 *  - Keys: arrows or WASD to steer, Space to start / pause / play again,
 *    Esc or Q to quit. Listened for on `window` in the capture phase so that
 *    Esc quits the game rather than leaving the monitor, and arrows steer
 *    rather than scroll the terminal.
 *  - Touch: swipe on the board to steer, tap to start / pause.
 *  - It pauses itself when the tab is hidden or a panel opens over it.
 *  - The best score is kept in `localStorage`.
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { SCREEN_COLORS } from '@/config/screenTheme';
import { useExperienceStore } from '@/stores/experienceStore';
import {
  createGame,
  primary,
  step,
  tickMs,
  turn,
  type Direction,
  type SnakeState,
} from './snake';

const BEST_KEY = 'workspace-os:snake-best';
const SWIPE_PX = 24;

const KEY_TO_DIRECTION: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

export interface SnakeResult {
  score: number;
  best: number;
  newBest: boolean;
}

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(best: number): void {
  try {
    window.localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // storage blocked: the best lasts as long as the page
  }
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

const HINT: Record<SnakeState['status'], string> = {
  ready: 'press an arrow key to start',
  playing: 'space pauses · esc quits',
  paused: 'paused — space to carry on · esc quits',
  over: 'game over — space to play again · esc quits',
  won: 'you filled the board! space to play again · esc quits',
};

/** The same hints for thumbs: there is no Space or Esc on a phone. */
const TOUCH_HINT: Record<SnakeState['status'], string> = {
  ready: 'swipe on the board to start',
  playing: 'swipe to steer · tap to pause',
  paused: 'paused — tap to carry on',
  over: 'game over — tap to play again',
  won: 'you filled the board! tap to play again',
};

export function SnakeGame({ onExit }: { onExit: (result: SnakeResult) => void }) {
  const [game, setGame] = useState<SnakeState>(() => createGame(newSeed()));
  const [best, setBest] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [touch, setTouch] = useState(false);
  const panelOpen = useExperienceStore((s) => s.activePanel !== null);
  const startBest = useRef(0);
  const gameRef = useRef(game);
  gameRef.current = game;
  const bestRef = useRef(best);
  bestRef.current = best;
  const rootRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const stored = readBest();
    startBest.current = stored;
    setBest(stored);
    setTouch(window.matchMedia('(pointer: coarse)').matches);
    rootRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  // A finished game may set a new best.
  useEffect(() => {
    if (
      (game.status === 'over' || game.status === 'won') &&
      game.score > bestRef.current
    ) {
      setBest(game.score);
      writeBest(game.score);
    }
  }, [game.status, game.score]);

  const quit = useCallback(() => {
    const final = Math.max(bestRef.current, gameRef.current.score);
    if (final > bestRef.current) writeBest(final);
    onExit({
      score: gameRef.current.score,
      best: final,
      newBest: final > startBest.current && gameRef.current.score === final,
    });
  }, [onExit]);

  // Never play on while nobody can see it.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    if ((hidden || panelOpen) && gameRef.current.status === 'playing') {
      setGame((g) => ({ ...g, status: 'paused' }));
    }
  }, [hidden, panelOpen]);

  // The clock: one step per tick, faster as the score climbs.
  useEffect(() => {
    if (game.status !== 'playing') return;
    const id = window.setTimeout(() => setGame(step), tickMs(game.score));
    return () => window.clearTimeout(id);
  }, [game]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (useExperienceStore.getState().activePanel !== null) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const direction = KEY_TO_DIRECTION[key];
      let handled = true;
      if (direction) setGame((g) => turn(g, direction));
      else if (key === ' ' || key === 'Enter') setGame((g) => primary(g, newSeed()));
      else if (key === 'Escape' || key === 'q') quit();
      else handled = false;
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [quit]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const from = swipe.current;
    swipe.current = null;
    if (!from) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) {
      setGame((g) => primary(g, newSeed()));
      return;
    }
    const direction: Direction =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    setGame((g) => turn(g, direction));
  };

  const { width, height, snake, food, status, score } = game;
  const occupied = new Map<number, number>();
  snake.forEach((cell, i) => occupied.set(cell.y * width + cell.x, i));
  const dead = status === 'over';

  return (
    <div
      ref={rootRef}
      role="application"
      aria-label="Snake. Arrow keys to steer, space to pause, escape to quit."
      data-snake={status}
      className="mt-[0.4em] inline-block"
    >
      <div className="flex items-baseline justify-between gap-[2em] pb-[0.35em]">
        <span style={{ color: SCREEN_COLORS.accent }}>▍ SNAKE</span>
        <span style={{ color: SCREEN_COLORS.dim }}>
          score{' '}
          <span style={{ color: SCREEN_COLORS.text }} aria-live="polite">
            {score}
          </span>
          {'   '}best <span style={{ color: SCREEN_COLORS.text }}>{best}</span>
        </span>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="grid cursor-pointer touch-none rounded-[0.25em] p-[0.2em] select-none"
        style={{
          gridTemplateColumns: `repeat(${width}, 1.1em)`,
          gridAutoRows: '1.1em',
          border: '1px solid rgba(143,180,255,0.22)',
          background: 'rgba(143,180,255,0.035)',
          opacity: status === 'paused' ? 0.55 : 1,
        }}
      >
        {Array.from({ length: width * height }, (_, index) => {
          const segment = occupied.get(index);
          const isFood = food !== null && food.y * width + food.x === index;
          if (segment === undefined && !isFood) {
            return (
              <span key={index} className="grid place-items-center">
                <span className="size-[0.08em] rounded-full bg-white/10" />
              </span>
            );
          }
          if (isFood) {
            return (
              <span key={index} className="grid place-items-center">
                <span
                  className="snake-food size-[0.5em] rounded-full"
                  style={{
                    background: SCREEN_COLORS.accent,
                    boxShadow: `0 0 0.5em ${SCREEN_COLORS.accent}`,
                  }}
                />
              </span>
            );
          }
          const head = segment === 0;
          return (
            <span
              key={index}
              className="m-[0.06em] rounded-[0.18em]"
              style={{
                background: dead
                  ? SCREEN_COLORS.error
                  : head
                    ? '#d6ffe7'
                    : SCREEN_COLORS.ok,
                opacity: head ? 1 : 0.92 - Math.min(0.4, (segment ?? 0) * 0.02),
              }}
            />
          );
        })}
      </div>
      <div
        className="flex items-baseline justify-between gap-[1.5em] pt-[0.4em] text-[0.86em]"
        style={{ color: SCREEN_COLORS.dim }}
      >
        <span>{(touch ? TOUCH_HINT : HINT)[status]}</span>
        <button
          type="button"
          onClick={quit}
          className="cursor-pointer rounded-[0.2em] underline decoration-white/25 underline-offset-[0.25em] hover:text-white"
        >
          quit
        </button>
      </div>
    </div>
  );
}
