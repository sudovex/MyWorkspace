/**
 * Experience-level domain types.
 *
 * The entire visitor journey is a single finite state machine. These types are
 * its vocabulary — intentionally framework-free (no React, no Zustand) so the
 * transition logic is unit-testable in isolation.
 *
 * The flow: a short cinematic BOOT, then the camera pushes IN from a wide
 * establishing shot to the desk (`reveal`). At the desk (`room_idle`) every
 * object is a doorway: the monitor zooms into a usable terminal
 * (`zooming` → `os_active`), while the calendar, bookshelf, helmet, notebook
 * and phone open DOM panels (résumé, gallery, contact) over the room.
 */
export const EXPERIENCE_PHASES = [
  /** Pure black. The machine is off. */
  'black',
  /** POST / BIOS diagnostics printing to the boot screen. */
  'post',
  /** The lamp warms up off-screen while the panel holds. */
  'booting',
  /** Welcome + cursor on the boot screen. */
  'monitor_on',
  /** Camera pushes in from the wide establishing shot to the desk. */
  'reveal',
  /** At the desk. The room is interactive. */
  'room_idle',
  /** Camera zooming into the monitor; the WebGL→DOM handoff runs. */
  'zooming',
  /** The monitor's OS / terminal is active. The WebGL scene is frozen. */
  'os_active',
] as const;

export type ExperiencePhase = (typeof EXPERIENCE_PHASES)[number];

/** DOM panels that can open over the room (or over the terminal). */
export const PANEL_IDS = ['resume', 'gallery', 'contact', 'certificates'] as const;
export type PanelId = (typeof PANEL_IDS)[number];

/** Sections of the résumé panel — a hotspot can deep-link into one. */
export const RESUME_SECTIONS = [
  'summary',
  'experience',
  'projects',
  'skills',
  'education',
  'certifications',
] as const;
export type ResumeSectionId = (typeof RESUME_SECTIONS)[number];

/** Screens inside the phone — an object can open the phone on one of them. */
export const PHONE_VIEWS = ['home', 'spotify'] as const;
export type PhoneView = (typeof PHONE_VIEWS)[number];

/**
 * Which way the visitor is facing at the desk: the desk itself, or turned to
 * the left wall (cursor pushed to the left edge of the screen).
 */
export const ROOM_VIEWS = ['desk', 'left'] as const;
export type RoomView = (typeof ROOM_VIEWS)[number];

/** Albums in the gallery — an object can open the gallery on one of them. */
export const GALLERY_ALBUMS = ['rides', 'gym'] as const;
export type GalleryAlbum = (typeof GALLERY_ALBUMS)[number];

/** Every clickable object in the room. */
export const HOTSPOT_IDS = [
  'monitor',
  'calendar',
  'bookshelf',
  'helmet',
  'notebook',
  'phone',
  'lamp',
  'mug',
  'certificate',
  'headphones',
  'soundbar',
  'shaker',
] as const;
export type HotspotId = (typeof HOTSPOT_IDS)[number];

/** What the pointer is currently over — drives the DOM hover label. */
export interface HoverInfo {
  id: HotspotId;
  label: string;
  hint: string;
}

/** A point on the page, in CSS pixels (viewport space). */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** Where the first-visit guide's arrows should land, per object. */
export type GuidePoints = Readonly<Partial<Record<HotspotId, ScreenPoint>>>;

/** The monitor screen's projected rectangle in CSS pixels (viewport space). */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}
