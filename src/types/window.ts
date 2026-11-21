/**
 * Window-manager domain types.
 *
 * WorkspaceOS ships a hand-built window manager (no react-rnd / third-party
 * windowing libs) so we own every pixel of the drag, resize and stacking UX.
 * These types describe a single managed window instance.
 */
import { type AppId } from './os';

/** Absolute pixel geometry within the desktop viewport. */
export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Lifecycle/display state of a window. */
export type WindowDisplayState = 'normal' | 'minimized' | 'maximized';

/**
 * A live window instance. One application (`appId`) may in principle have
 * multiple instances, so `id` is the instance identity and `appId` is the type.
 */
export interface ManagedWindow {
  /** Unique per instance (crypto.randomUUID). */
  id: string;
  appId: AppId;
  title: string;
  geometry: WindowGeometry;
  zIndex: number;
  display: WindowDisplayState;
  /** Geometry to return to when un-maximizing. Null when in `normal` state. */
  restoreGeometry: WindowGeometry | null;
}

/** Options accepted when opening a window; everything falls back to sensible defaults. */
export interface OpenWindowOptions {
  title?: string;
  geometry?: Partial<WindowGeometry>;
}
