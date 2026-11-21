import { describe, expect, it } from 'vitest';
import {
  BOARD,
  createGame,
  primary,
  sameCell,
  step,
  tickMs,
  turn,
  type SnakeState,
} from './snake';

/** A game already under way, with the food parked out of the way. */
function playing(overrides: Partial<SnakeState> = {}): SnakeState {
  return {
    ...createGame(1),
    status: 'playing',
    food: { x: 0, y: 0 },
    ...overrides,
  };
}

describe('createGame (pure)', () => {
  it('starts a three-cell snake facing right in the middle, waiting', () => {
    const game = createGame(7);
    expect(game.width).toBe(BOARD.width);
    expect(game.snake).toHaveLength(3);
    expect(game.snake[0]).toEqual({
      x: Math.floor(BOARD.width / 2),
      y: Math.floor(BOARD.height / 2),
    });
    expect(game.direction).toBe('right');
    expect(game.status).toBe('ready');
    expect(game.score).toBe(0);
  });

  it('never puts the food on the snake, and is reproducible from its seed', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const game = createGame(seed);
      expect(game.food).not.toBeNull();
      expect(game.snake.some((c) => game.food && sameCell(c, game.food))).toBe(false);
    }
    expect(createGame(42)).toEqual(createGame(42));
  });
});

describe('step (pure)', () => {
  it('does nothing until the game is being played', () => {
    const ready = createGame(3);
    expect(step(ready)).toBe(ready);
    const paused = { ...playing(), status: 'paused' as const };
    expect(step(paused)).toBe(paused);
  });

  it('moves one cell, keeping its length', () => {
    const game = playing();
    const next = step(game);
    expect(next.snake[0]).toEqual({ x: game.snake[0]!.x + 1, y: game.snake[0]!.y });
    expect(next.snake).toHaveLength(3);
    expect(next.snake[2]).toEqual(game.snake[1]);
  });

  it('grows by one and scores when it eats, and puts new food somewhere free', () => {
    const game = playing();
    const head = game.snake[0]!;
    const next = step({ ...game, food: { x: head.x + 1, y: head.y } });
    expect(next.score).toBe(1);
    expect(next.snake).toHaveLength(4);
    expect(next.food).not.toBeNull();
    expect(next.snake.some((c) => next.food && sameCell(c, next.food))).toBe(false);
  });

  it('ends at a wall', () => {
    const game = playing({
      snake: [
        { x: BOARD.width - 1, y: 3 },
        { x: BOARD.width - 2, y: 3 },
        { x: BOARD.width - 3, y: 3 },
      ],
    });
    expect(step(game).status).toBe('over');
    expect(step({ ...game, direction: 'up', snake: [{ x: 4, y: 0 }] }).status).toBe(
      'over',
    );
  });

  it('ends when it runs into itself', () => {
    // a hook: heading left into its own body
    const game = playing({
      direction: 'left',
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
        { x: 4, y: 4 },
      ],
    });
    expect(step(game).status).toBe('over');
  });

  it('may follow its own tail into the cell the tail is leaving', () => {
    // a 2×2 loop: the head moves to where the tail was
    const game = playing({
      direction: 'down',
      snake: [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 6 },
      ],
    });
    const next = step(game);
    expect(next.status).toBe('playing');
    expect(next.snake[0]).toEqual({ x: 5, y: 6 });
  });

  it('is won when the board is full', () => {
    const game: SnakeState = {
      ...playing(),
      width: 4,
      height: 1,
      snake: [
        { x: 2, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ],
      food: { x: 3, y: 0 },
    };
    const next = step(game);
    expect(next.status).toBe('won');
    expect(next.food).toBeNull();
    expect(next.score).toBe(1);
  });
});

describe('turn (pure)', () => {
  it('starts a waiting game, even on a key that cannot turn', () => {
    expect(turn(createGame(1), 'up').status).toBe('playing');
    const reversed = turn(createGame(1), 'left');
    expect(reversed.status).toBe('playing');
    expect(reversed.queue).toEqual([]);
  });

  it('ignores reversing into its own neck', () => {
    const game = playing();
    expect(turn(game, 'left')).toBe(game);
    expect(turn(game, 'right')).toBe(game);
  });

  it('queues two quick turns, so a U-turn inside one tick works', () => {
    let game = playing();
    const head = game.snake[0]!;
    game = turn(turn(game, 'up'), 'left');
    expect(game.queue).toEqual(['up', 'left']);
    game = step(step(game));
    expect(game.status).toBe('playing');
    expect(game.snake[0]).toEqual({ x: head.x - 1, y: head.y - 1 });
    expect(game.direction).toBe('left');
  });

  it('judges a reversal against the last queued turn, and caps the queue', () => {
    let game = turn(playing(), 'up');
    expect(turn(game, 'down')).toBe(game);
    game = turn(turn(game, 'left'), 'down');
    expect(game.queue).toEqual(['up', 'left']);
  });

  it('does nothing while paused or after the end', () => {
    const paused = { ...playing(), status: 'paused' as const };
    expect(turn(paused, 'up')).toBe(paused);
    const over = { ...playing(), status: 'over' as const };
    expect(turn(over, 'up')).toBe(over);
  });
});

describe('primary (pure)', () => {
  it('starts, pauses, resumes — and restarts after the end', () => {
    const ready = createGame(1);
    const started = primary(ready, 2);
    expect(started.status).toBe('playing');
    expect(primary(started, 2).status).toBe('paused');
    expect(primary(primary(started, 2), 2).status).toBe('playing');
    const fresh = primary({ ...started, status: 'over', score: 9 }, 5);
    expect(fresh).toEqual(createGame(5));
  });
});

describe('tickMs (pure)', () => {
  it('speeds up with the score, down to a floor', () => {
    expect(tickMs(0)).toBe(150);
    expect(tickMs(5)).toBeLessThan(tickMs(0));
    expect(tickMs(1000)).toBe(70);
  });
});
