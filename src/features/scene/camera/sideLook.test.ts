import { describe, expect, it } from 'vitest';
import { LOOK_BACK_AT, LOOK_LEFT_AT, approach, nextRoomView } from './sideLook';

describe('nextRoomView (pure)', () => {
  it('turns left when the cursor is pushed into the left edge', () => {
    expect(nextRoomView('desk', LOOK_LEFT_AT - 0.05, LOOK_LEFT_AT + 0.1)).toBe('left');
    expect(nextRoomView('desk', -1, -0.9)).toBe('left');
  });

  it('does not turn for a cursor that is merely on the left side', () => {
    expect(nextRoomView('desk', -0.6, -0.4)).toBe('desk');
    // over the headphones / phone, well short of the edge
    expect(nextRoomView('desk', LOOK_LEFT_AT + 0.05, 0)).toBe('desk');
  });

  it('stays turned while the cursor explores what came into view', () => {
    expect(nextRoomView('left', -0.2, -0.9)).toBe('left');
    expect(nextRoomView('left', LOOK_BACK_AT - 0.05, -0.2)).toBe('left');
  });

  it('faces the desk again once the cursor moves into the right of the screen', () => {
    expect(nextRoomView('left', LOOK_BACK_AT + 0.05, 0)).toBe('desk');
  });

  it('ignores a resting cursor, and one moving the other way', () => {
    // chosen from the keyboard with the cursor parked on the right
    expect(nextRoomView('left', 0.8, 0.8)).toBe('left');
    expect(nextRoomView('left', 0.7, 0.8)).toBe('left');
    // sent back from the keyboard with the cursor parked on the left edge
    expect(nextRoomView('desk', -0.95, -0.95)).toBe('desk');
    expect(nextRoomView('desk', -0.9, -0.95)).toBe('desk');
  });

  it('leaves a gap between the two thresholds', () => {
    expect(LOOK_BACK_AT - LOOK_LEFT_AT).toBeGreaterThan(0.8);
  });
});

describe('approach (pure)', () => {
  it('moves toward the target without passing it', () => {
    expect(approach(0, 1, 0.25)).toBe(0.25);
    expect(approach(0.9, 1, 0.25)).toBe(1);
    expect(approach(1, 0, 0.4)).toBeCloseTo(0.6);
    expect(approach(0.1, 0, 0.4)).toBe(0);
    expect(approach(0.5, 0.5, 0.4)).toBe(0.5);
  });
});
