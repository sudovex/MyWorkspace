/**
 * World-space layout constants shared by the room, the camera and the
 * hotspots. Metres. Desk surface sits at y = 0, the floor at y = -0.75, the
 * back wall at z = -0.82. The monitor screen faces +Z (toward the viewer).
 *
 * Framework-free on purpose (no three.js) so camera math that depends on it
 * stays unit-testable.
 */
export type Vec3 = readonly [number, number, number];

export const FLOOR_Y = -0.75;
export const BACK_WALL_Z = -0.82;
export const LEFT_WALL_X = -2.15;

export const DESK = {
  center: [0, 0, -0.3] as Vec3,
  width: 1.9,
  depth: 0.86,
} as const;

/** The monitor's glass: the surface the terminal is laid over in `os_active`. */
export const SCREEN = {
  center: [0, 0.375, -0.484] as Vec3,
  width: 0.82,
  height: 0.46,
} as const;

/** Where each interactive object sits (its base, in world space). */
export const PLACEMENT = {
  monitor: [0, 0, -0.5] as Vec3,
  keyboard: [0, 0, -0.07] as Vec3,
  mouse: [0.34, 0, -0.05] as Vec3,
  helmet: [-0.66, 0, -0.39] as Vec3,
  bikeKeys: [-0.43, 0, -0.18] as Vec3,
  mug: [-0.37, 0, -0.09] as Vec3,
  phone: [-0.62, 0, -0.02] as Vec3,
  calendar: [0.52, 0, -0.34] as Vec3,
  lamp: [0.82, 0, -0.56] as Vec3,
  notebook: [0.67, 0, -0.04] as Vec3,
  shelf: [1.14, 0.64, BACK_WALL_Z] as Vec3,
  window: [-1.14, 0.9, BACK_WALL_Z] as Vec3,
  neon: [0, 0.99, BACK_WALL_Z] as Vec3,
  chair: [-0.2, -0.3, 0.92] as Vec3,
  plant: [1.3, FLOOR_Y, -0.36] as Vec3,
  /** Centre of the framed certificate, on the back wall under the shelves. */
  certificate: [1.15, 0.385, BACK_WALL_Z] as Vec3,
  headphones: [-0.86, 0, -0.06] as Vec3,
  /**
   * Right of the calendar, in the clear patch between it, the lamp's base
   * and the notebook — no need to widen the desk.
   */
  shaker: [0.71, 0, -0.4] as Vec3,
  /** Under the screen, just in front of the monitor's foot. */
  soundbar: [0, 0, -0.375] as Vec3,
} as const;

export const WINDOW_SIZE = { width: 0.96, height: 1.16 } as const;
