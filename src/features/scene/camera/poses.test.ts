import { describe, expect, it } from 'vitest';
import {
  CAMERA_FOV,
  CAMERA_POSES,
  FOCUS_POSES,
  MONITOR_FILL,
  deskPoseFor,
  fitDistance,
  leftPoseFor,
  monitorPoseFor,
  restingPose,
} from './poses';
import { LEFT_WALL_X, SCREEN } from '../room/layout';

const TAN = Math.tan((CAMERA_FOV * Math.PI) / 360);

/** Fraction of the viewport (height, width) the screen fills at a pose. */
function screenFill(aspect: number): { v: number; h: number } {
  const pose = monitorPoseFor(aspect);
  const distance = pose.position[2] - pose.target[2];
  const visibleHeight = 2 * distance * TAN;
  return {
    v: SCREEN.height / visibleHeight,
    h: SCREEN.width / (visibleHeight * aspect),
  };
}

describe('monitorPoseFor', () => {
  it('looks head-on at the centre of the screen', () => {
    const pose = monitorPoseFor(16 / 9);
    expect(pose.target).toEqual(SCREEN.center);
    expect(pose.position[0]).toBe(SCREEN.center[0]);
    expect(pose.position[1]).toBe(SCREEN.center[1]);
    expect(pose.position[2]).toBeGreaterThan(SCREEN.center[2]);
  });

  it.each([0.46, 0.75, 1, 4 / 3, 16 / 9, 21 / 9, 3.5])(
    'never lets the screen overflow the viewport at aspect %f',
    (aspect) => {
      const { v, h } = screenFill(aspect);
      expect(v).toBeLessThanOrEqual(MONITOR_FILL.vertical + 1e-9);
      expect(h).toBeLessThanOrEqual(MONITOR_FILL.horizontal + 1e-9);
      // …and it is as close as allowed: one axis sits exactly on its limit.
      const tight =
        Math.abs(v - MONITOR_FILL.vertical) < 1e-9 ||
        Math.abs(h - MONITOR_FILL.horizontal) < 1e-9;
      expect(tight).toBe(true);
    },
  );

  it('backs off as the viewport narrows', () => {
    expect(monitorPoseFor(0.5).position[2]).toBeGreaterThan(
      monitorPoseFor(16 / 9).position[2],
    );
  });
});

describe('fitDistance', () => {
  it('is governed by height on wide viewports and width on narrow ones', () => {
    const wide = fitDistance(1, 1, 3, 1, 1);
    const narrow = fitDistance(1, 1, 0.5, 1, 1);
    expect(wide).toBeCloseTo(1 / (2 * TAN));
    expect(narrow).toBeCloseTo(1 / (2 * TAN * 0.5));
  });
});

describe('deskPoseFor', () => {
  it('is the composed pose on wide viewports', () => {
    expect(deskPoseFor(16 / 9)).toEqual(CAMERA_POSES.desk);
    expect(deskPoseFor(2.4)).toEqual(CAMERA_POSES.desk);
  });

  it('pulls straight back along the view axis on narrow viewports', () => {
    const pose = deskPoseFor(0.6);
    const { position, target } = CAMERA_POSES.desk;
    expect(pose.target).toEqual(target);
    const ratio = (pose.position[2] - target[2]) / (position[2] - target[2]);
    expect(ratio).toBeGreaterThan(1);
    expect((pose.position[0] - target[0]) / (position[0] - target[0])).toBeCloseTo(ratio);
    expect((pose.position[1] - target[1]) / (position[1] - target[1])).toBeCloseTo(ratio);
  });

  it('caps how far it will back off', () => {
    expect(deskPoseFor(0.05)).toEqual(deskPoseFor(0.01));
  });
});

describe('leftPoseFor', () => {
  it('is the composed pose on wide viewports', () => {
    expect(leftPoseFor(16 / 9)).toEqual(CAMERA_POSES.leftWall);
  });

  it('stays at the desk but looks well to the left of it, inside the room', () => {
    const { position, target } = CAMERA_POSES.leftWall;
    const desk = CAMERA_POSES.desk;
    expect(target[0]).toBeLessThan(desk.target[0] - 1);
    expect(target[0]).toBeGreaterThan(LEFT_WALL_X);
    // a head turn, not a walk: the camera itself barely moves
    const moved = Math.hypot(
      position[0] - desk.position[0],
      position[1] - desk.position[1],
      position[2] - desk.position[2],
    );
    expect(moved).toBeLessThan(0.6);
  });

  it('on narrow viewports backs off and aims at the prints themselves', () => {
    const pose = leftPoseFor(0.5);
    const { position, target } = CAMERA_POSES.leftWall;
    const distance = (p: readonly number[], t: readonly number[]) =>
      Math.hypot(
        (p[0] ?? 0) - (t[0] ?? 0),
        (p[1] ?? 0) - (t[1] ?? 0),
        (p[2] ?? 0) - (t[2] ?? 0),
      );
    expect(distance(pose.position, pose.target)).toBeGreaterThan(
      distance(position, target),
    );
    // closer to the wall, and still on the room's side of it
    expect(pose.target[0]).toBeLessThan(target[0]);
    expect(pose.target[0]).toBeGreaterThan(LEFT_WALL_X);
    // and it changes smoothly with the aspect, with no jump at the threshold
    expect(leftPoseFor(1.44).target[0]).toBeCloseTo(target[0], 1);
  });
});

describe('restingPose', () => {
  it('holds the wide shot until the reveal, then lands on the desk', () => {
    for (const phase of ['black', 'post', 'booting', 'monitor_on'] as const) {
      expect(restingPose({ phase, aspect: 16 / 9, panelOrigin: null })).toEqual(
        CAMERA_POSES.roomWide,
      );
    }
    expect(restingPose({ phase: 'reveal', aspect: 16 / 9, panelOrigin: null })).toEqual(
      CAMERA_POSES.desk,
    );
  });

  it('sits at the monitor while zooming and inside the OS', () => {
    const monitor = monitorPoseFor(16 / 9);
    expect(restingPose({ phase: 'zooming', aspect: 16 / 9, panelOrigin: null })).toEqual(
      monitor,
    );
    expect(
      restingPose({ phase: 'os_active', aspect: 16 / 9, panelOrigin: null }),
    ).toEqual(monitor);
  });

  it('leans toward the object that opened a panel', () => {
    expect(
      restingPose({ phase: 'room_idle', aspect: 16 / 9, panelOrigin: 'helmet' }),
    ).toEqual(FOCUS_POSES.helmet);
    // Objects without a focus pose (and no panel at all) rest at the desk.
    expect(
      restingPose({ phase: 'room_idle', aspect: 16 / 9, panelOrigin: 'mug' }),
    ).toEqual(CAMERA_POSES.desk);
    expect(
      restingPose({ phase: 'room_idle', aspect: 16 / 9, panelOrigin: null }),
    ).toEqual(CAMERA_POSES.desk);
  });

  it('ignores focus poses on narrow viewports', () => {
    expect(
      restingPose({ phase: 'room_idle', aspect: 0.5, panelOrigin: 'helmet' }),
    ).toEqual(deskPoseFor(0.5));
  });
});
