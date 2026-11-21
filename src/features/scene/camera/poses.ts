/**
 * Named camera poses expressed in world space, plus the pure helpers that
 * decide where the camera should rest for a given moment of the experience.
 *
 * Poses are plain reversible data (not baked into the rig): the intro pushes
 * in `roomWide → desk`; clicking the monitor travels `desk → monitor` and back;
 * opening a panel leans the camera toward the object that opened it.
 *
 * Two poses adapt to the viewport's aspect ratio so the composition survives
 * narrow windows: the monitor pose backs off until the whole screen fits, and
 * the desk pose backs off until the whole desk does.
 */
import { type ExperiencePhase, type HotspotId } from '@/types/experience';
import { SCREEN, type Vec3 } from '../room/layout';

export interface CameraPose {
  /** World position of the camera. */
  position: Vec3;
  /** World point the camera looks at. */
  target: Vec3;
}

/** Vertical field of view, degrees. Shared with the `<Canvas>` camera. */
export const CAMERA_FOV = 40;

/** Aspect the fixed poses are composed for. */
const REFERENCE_ASPECT = 16 / 9;

export const CAMERA_POSES = {
  /** High and wide, off to the right — the establishing shot the intro opens on. */
  roomWide: {
    position: [2.5, 1.7, 4.05],
    target: [-0.15, 0.3, -0.5],
  },
  /** At the desk — the resting, interactive view. */
  desk: {
    position: [0.3, 0.78, 1.9],
    target: [0.03, 0.37, -0.45],
  },
  /**
   * Still at the desk, head turned to the left wall: the window, the framed
   * prints, and the wall running off into the dark. The monitor stays in the
   * right of the frame so the visitor never loses where they are.
   */
  leftWall: {
    position: [0.72, 0.84, 2.1],
    target: [-1.55, 0.66, 0.1],
  },
} as const satisfies Record<string, CameraPose>;

export type CameraPoseId = keyof typeof CAMERA_POSES;

/** How much of the viewport the monitor's glass may fill, per axis. */
export const MONITOR_FILL = { vertical: 0.8, horizontal: 0.9 } as const;

function halfFovTan(): number {
  return Math.tan((CAMERA_FOV * Math.PI) / 360);
}

/**
 * Distance at which a `width × height` rectangle, viewed head-on, occupies at
 * most `fillV` of the viewport's height and `fillH` of its width.
 */
export function fitDistance(
  width: number,
  height: number,
  aspect: number,
  fillV: number,
  fillH: number,
): number {
  const t = 2 * halfFovTan();
  const byHeight = height / (fillV * t);
  const byWidth = width / (fillH * t * Math.max(aspect, 0.01));
  return Math.max(byHeight, byWidth);
}

/** Head-on to the screen, as close as the viewport's aspect allows. */
export function monitorPoseFor(aspect: number): CameraPose {
  const distance = fitDistance(
    SCREEN.width,
    SCREEN.height,
    aspect,
    MONITOR_FILL.vertical,
    MONITOR_FILL.horizontal,
  );
  const [cx, cy, cz] = SCREEN.center;
  return { position: [cx, cy, cz + distance], target: [cx, cy, cz] };
}

/** Narrowest aspect the desk pose is composed for before it starts backing off. */
const DESK_MIN_ASPECT = 1.45;
/** Never back off further than this multiple of the composed distance. */
const DESK_MAX_PULLBACK = 2.6;

/** The desk pose, pulled back along its own view axis on narrow viewports. */
export function deskPoseFor(aspect: number): CameraPose {
  return pulledBack(CAMERA_POSES.desk, aspect);
}

/**
 * The left-wall pose, pulled back the same way — but less far: its subject
 * (two prints and a window) is narrower than the desk, and backing all the way
 * off would only put more night between the visitor and the wall.
 */
const LEFT_MAX_PULLBACK = 1.7;
/** On a portrait screen there is only room for the prints: aim at them. */
const LEFT_NARROW_TARGET: Vec3 = [-2.1, 0.9, 0.42];
const LEFT_NARROWEST_ASPECT = 0.6;

export function leftPoseFor(aspect: number): CameraPose {
  const { position, target } = CAMERA_POSES.leftWall;
  const narrow = Math.min(
    1,
    Math.max(0, (DESK_MIN_ASPECT - aspect) / (DESK_MIN_ASPECT - LEFT_NARROWEST_ASPECT)),
  );
  if (narrow === 0) return { position, target };
  const aimed: Vec3 = [
    target[0] + (LEFT_NARROW_TARGET[0] - target[0]) * narrow,
    target[1] + (LEFT_NARROW_TARGET[1] - target[1]) * narrow,
    target[2] + (LEFT_NARROW_TARGET[2] - target[2]) * narrow,
  ];
  return pulledBack({ position, target: aimed }, aspect, LEFT_MAX_PULLBACK);
}

function pulledBack(
  { position, target }: CameraPose,
  aspect: number,
  maxPullback: number = DESK_MAX_PULLBACK,
): CameraPose {
  const scale = Math.min(
    maxPullback,
    Math.max(1, DESK_MIN_ASPECT / Math.max(aspect, 0.01)),
  );
  if (scale === 1) return { position, target };
  return {
    position: [
      target[0] + (position[0] - target[0]) * scale,
      target[1] + (position[1] - target[1]) * scale,
      target[2] + (position[2] - target[2]) * scale,
    ],
    target,
  };
}

/**
 * Where the camera leans when an object opens a panel. Deliberately partial
 * moves — the DOM panel is the destination; the camera only acknowledges what
 * was touched.
 */
export const FOCUS_POSES: Readonly<Partial<Record<HotspotId, CameraPose>>> = {
  helmet: { position: [-0.42, 0.42, 0.72], target: [-0.66, 0.12, -0.42] },
  calendar: { position: [0.42, 0.4, 0.62], target: [0.52, 0.08, -0.34] },
  bookshelf: { position: [0.86, 0.8, 0.95], target: [1.1, 0.86, -0.8] },
  notebook: { position: [0.56, 0.52, 0.86], target: [0.67, 0.0, -0.04] },
  phone: { position: [-0.46, 0.5, 0.86], target: [-0.62, 0.0, -0.02] },
  headphones: { position: [-0.5, 0.5, 0.86], target: [-0.86, 0.12, -0.06] },
  shaker: { position: [0.6, 0.48, 0.55], target: [0.71, 0.1, -0.4] },
  certificate: { position: [0.92, 0.55, 0.85], target: [1.15, 0.385, -0.82] },
};

interface RestingPoseInput {
  phase: ExperiencePhase;
  aspect: number;
  /** The object that opened the current panel, if a panel is open. */
  panelOrigin: HotspotId | null;
}

/**
 * The pose the camera should settle at. `reveal` is authored separately (see
 * `introTimeline.ts`) — this returns where it *ends*.
 */
export function restingPose({
  phase,
  aspect,
  panelOrigin,
}: RestingPoseInput): CameraPose {
  switch (phase) {
    case 'black':
    case 'post':
    case 'booting':
    case 'monitor_on':
      return CAMERA_POSES.roomWide;
    case 'zooming':
    case 'os_active':
      return monitorPoseFor(aspect);
    case 'reveal':
      return deskPoseFor(aspect);
    case 'room_idle': {
      const focus = panelOrigin ? FOCUS_POSES[panelOrigin] : undefined;
      // Focus poses are composed for wide viewports; on narrow ones the panel
      // covers the room anyway, so stay at the (fitted) desk pose.
      if (focus && aspect >= REFERENCE_ASPECT * 0.7) return focus;
      return deskPoseFor(aspect);
    }
  }
}
