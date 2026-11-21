/**
 * Snake, as pure functions over an immutable state — no timers, no DOM.
 *
 * The component (`SnakeGame.tsx`) owns the clock and the keys; everything
 * that decides what happens on a tick or a key press lives here, which is
 * what makes the rules testable: walls and your own tail end the game, food
 * grows you by one, and a turn straight back on yourself is ignored.
 *
 * Turns are queued (up to two per tick), so a quick "up, left" inside one
 * tick is a clean U-turn rather than a lost key. The food is placed by a
 * seeded PRNG carried in the state, so a game is reproducible from its seed.
 */
import { mulberry32 } from '@/lib/prng';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Cell {
  x: number;
  y: number;
}

export type SnakeStatus = 'ready' | 'playing' | 'paused' | 'over' | 'won';

export interface SnakeState {
  width: number;
  height: number;
  /** Head first. */
  snake: readonly Cell[];
  direction: Direction;
  /** Turns pressed since the last tick, oldest first. */
  queue: readonly Direction[];
  food: Cell | null;
  score: number;
  status: SnakeStatus;
  /** PRNG state for the next food placement. */
  seed: number;
}

export const BOARD = { width: 22, height: 13 } as const;
const START_LENGTH = 3;
const MAX_QUEUED_TURNS = 2;

const DELTA: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;

/** One draw from the PRNG, and the state to draw the next one from. */
function draw(seed: number): [number, number] {
  return [mulberry32(seed)(), (seed + 0x6d2b79f5) | 0];
}

/** Put food on a random free cell — or nowhere, if the board is full. */
function placeFood(
  width: number,
  height: number,
  snake: readonly Cell[],
  seed: number,
): { food: Cell | null; seed: number } {
  const taken = new Set(snake.map((c) => c.y * width + c.x));
  const free: Cell[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!taken.has(y * width + x)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { food: null, seed };
  const [r, next] = draw(seed);
  return { food: free[Math.floor(r * free.length)] ?? null, seed: next };
}

export function createGame(
  seed: number,
  width: number = BOARD.width,
  height: number = BOARD.height,
): SnakeState {
  const head = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const snake = Array.from({ length: START_LENGTH }, (_, i) => ({
    x: head.x - i,
    y: head.y,
  }));
  const placed = placeFood(width, height, snake, seed);
  return {
    width,
    height,
    snake,
    direction: 'right',
    queue: [],
    food: placed.food,
    score: 0,
    status: 'ready',
    seed: placed.seed,
  };
}

/**
 * The player pressed a direction. Starts a game that is waiting; ignored
 * while paused or finished, and when it would reverse straight into the
 * snake's own neck (judged against the last *queued* direction).
 */
export function turn(state: SnakeState, direction: Direction): SnakeState {
  if (state.status !== 'ready' && state.status !== 'playing') return state;
  const last = state.queue[state.queue.length - 1] ?? state.direction;
  const status = 'playing';
  if (direction === last || direction === OPPOSITE[last]) {
    return state.status === 'ready' ? { ...state, status } : state;
  }
  if (state.queue.length >= MAX_QUEUED_TURNS) return { ...state, status };
  return { ...state, status, queue: [...state.queue, direction] };
}

/** Space: start, pause, resume — or, once it is over, a fresh game. */
export function primary(state: SnakeState, nextSeed: number): SnakeState {
  switch (state.status) {
    case 'ready':
    case 'paused':
      return { ...state, status: 'playing' };
    case 'playing':
      return { ...state, status: 'paused' };
    case 'over':
    case 'won':
      return createGame(nextSeed, state.width, state.height);
  }
}

/** Advance one tick. Does nothing unless the game is being played. */
export function step(state: SnakeState): SnakeState {
  if (state.status !== 'playing') return state;
  const [next, ...queue] = state.queue;
  const direction = next ?? state.direction;
  const head = state.snake[0];
  if (!head) return state;
  const delta = DELTA[direction];
  const moved = { x: head.x + delta.x, y: head.y + delta.y };

  const outside =
    moved.x < 0 || moved.y < 0 || moved.x >= state.width || moved.y >= state.height;
  if (outside) return { ...state, direction, queue, status: 'over' };

  const eating = state.food !== null && sameCell(moved, state.food);
  // the tail moves out of the way this tick, unless the snake is growing
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((cell) => sameCell(cell, moved))) {
    return { ...state, direction, queue, status: 'over' };
  }

  const snake = [moved, ...body];
  if (!eating) return { ...state, snake, direction, queue };

  const placed = placeFood(state.width, state.height, snake, state.seed);
  return {
    ...state,
    snake,
    direction,
    queue,
    food: placed.food,
    seed: placed.seed,
    score: state.score + 1,
    status: placed.food === null ? 'won' : 'playing',
  };
}

/** Milliseconds per tick: brisk to start, a little quicker with every bite. */
export function tickMs(score: number): number {
  return Math.max(70, 150 - score * 4);
}
