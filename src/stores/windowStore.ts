/**
 * WorkspaceOS window manager state.
 *
 * Owns the full lifecycle of every open window: creation, focus/stacking,
 * geometry, and minimize/maximize/restore. Kept deliberately framework-free
 * (plain Zustand + pure helpers) so the window CHROME (M5) is a thin,
 * single-responsibility view layer over this logic.
 *
 * Stacking model: a monotonic `zCounter` guarantees the focused window always
 * receives the highest z-index without ever having to renumber the others.
 */
import { create } from 'zustand';
import { type AppId } from '@/types/os';
import {
  type ManagedWindow,
  type OpenWindowOptions,
  type WindowDisplayState,
  type WindowGeometry,
} from '@/types/window';

/** Default size/position for a freshly opened window, before per-app overrides. */
const DEFAULT_GEOMETRY: WindowGeometry = { x: 120, y: 96, width: 880, height: 600 };

/** Each new window opens slightly offset from the last, so stacks stay legible. */
const CASCADE_OFFSET = 32;

interface WindowState {
  windows: ManagedWindow[];
  /** Instance id of the currently focused window, or null. */
  focusedId: string | null;
  /** Monotonically increasing z-index source. Never decreases. */
  zCounter: number;
}

interface WindowActions {
  openWindow: (appId: AppId, options?: OpenWindowOptions) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
}

const INITIAL_STATE: WindowState = {
  windows: [],
  focusedId: null,
  zCounter: 0,
};

/** Immutably replace the window matching `id` via an updater function. */
function updateWindow(
  windows: ManagedWindow[],
  id: string,
  updater: (win: ManagedWindow) => ManagedWindow,
): ManagedWindow[] {
  return windows.map((win) => (win.id === id ? updater(win) : win));
}

export const useWindowStore = create<WindowState & WindowActions>((set, get) => ({
  ...INITIAL_STATE,

  openWindow: (appId, options) => {
    const id = crypto.randomUUID();
    const count = get().windows.length;
    const nextZ = get().zCounter + 1;

    const geometry: WindowGeometry = {
      ...DEFAULT_GEOMETRY,
      x: DEFAULT_GEOMETRY.x + count * CASCADE_OFFSET,
      y: DEFAULT_GEOMETRY.y + count * CASCADE_OFFSET,
      ...options?.geometry,
    };

    const win: ManagedWindow = {
      id,
      appId,
      title: options?.title ?? appId,
      geometry,
      zIndex: nextZ,
      display: 'normal',
      restoreGeometry: null,
    };

    set((state) => ({
      windows: [...state.windows, win],
      focusedId: id,
      zCounter: nextZ,
    }));
    return id;
  },

  closeWindow: (id) => {
    set((state) => {
      const windows = state.windows.filter((w) => w.id !== id);
      const focusedId =
        state.focusedId === id
          ? // Focus the next-highest window, if any remain.
            (windows.reduce<ManagedWindow | null>(
              (top, w) => (!top || w.zIndex > top.zIndex ? w : top),
              null,
            )?.id ?? null)
          : state.focusedId;
      return { windows, focusedId };
    });
  },

  focusWindow: (id) => {
    const { focusedId, zCounter, windows } = get();
    if (focusedId === id) return;
    if (!windows.some((w) => w.id === id)) return;
    const nextZ = zCounter + 1;
    set({
      focusedId: id,
      zCounter: nextZ,
      windows: updateWindow(windows, id, (w) => ({ ...w, zIndex: nextZ })),
    });
  },

  moveWindow: (id, x, y) => {
    set((state) => ({
      windows: updateWindow(state.windows, id, (w) => ({
        ...w,
        geometry: { ...w.geometry, x, y },
      })),
    }));
  },

  resizeWindow: (id, width, height) => {
    set((state) => ({
      windows: updateWindow(state.windows, id, (w) => ({
        ...w,
        geometry: { ...w.geometry, width, height },
      })),
    }));
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: updateWindow(state.windows, id, (w) => ({
        ...w,
        display: 'minimized' as WindowDisplayState,
      })),
      focusedId: state.focusedId === id ? null : state.focusedId,
    }));
  },

  toggleMaximizeWindow: (id) => {
    set((state) => ({
      windows: updateWindow(state.windows, id, (w) => {
        if (w.display === 'maximized') {
          return {
            ...w,
            display: 'normal',
            geometry: w.restoreGeometry ?? w.geometry,
            restoreGeometry: null,
          };
        }
        return {
          ...w,
          display: 'maximized',
          restoreGeometry: w.geometry,
        };
      }),
    }));
  },

  restoreWindow: (id) => {
    set((state) => ({
      windows: updateWindow(state.windows, id, (w) => ({
        ...w,
        display: 'normal',
      })),
    }));
  },
}));
