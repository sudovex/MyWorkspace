/**
 * The experience finite state machine — single source of truth for "where in
 * the journey the visitor is".
 *
 * The scene runtime (WebGL), the interface layer (DOM panels / HUD) and the OS
 * runtime (the monitor's terminal) are fully decoupled and communicate ONLY
 * through this store. Transitions are guarded by a pure, exported table so
 * state can never enter an impossible configuration.
 *
 * Beyond the phase, the store carries the small amount of cross-runtime state
 * the room needs: which DOM panel is open (and which object opened it, so the
 * camera can lean toward it), what the pointer is hovering, where the monitor
 * screen sits in CSS pixels (so the terminal can be laid exactly over it),
 * whether the lamp is on, and whether the room's sound is.
 */
import { create } from 'zustand';
import {
  EXPERIENCE_PHASES,
  type ExperiencePhase,
  type GalleryAlbum,
  type GuidePoints,
  type HotspotId,
  type HoverInfo,
  type PanelId,
  type PhoneView,
  type ResumeSectionId,
  type RoomView,
  type ScreenRect,
} from '@/types/experience';

/**
 * Allowed transitions out of each phase — the whole journey in one place.
 *  - `black → room_idle` is the reduced-motion path, `black → os_active` the
 *    low-power path (no WebGL at all), `black → reveal` the returning-visitor
 *    cut (skips the boot text, keeps the camera move).
 *  - every intro phase may cut straight to `room_idle`: the skip affordance.
 */
export const PHASE_TRANSITIONS: Readonly<
  Record<ExperiencePhase, readonly ExperiencePhase[]>
> = {
  black: ['post', 'reveal', 'room_idle', 'os_active'],
  post: ['booting', 'black', 'room_idle'],
  booting: ['monitor_on', 'room_idle'],
  monitor_on: ['reveal', 'room_idle'],
  reveal: ['room_idle'],
  room_idle: ['zooming'],
  zooming: ['os_active', 'room_idle'],
  os_active: ['room_idle'],
} as const;

/** Phases that belong to the intro (boot text + camera push-in). */
export const INTRO_PHASES: ReadonlySet<ExperiencePhase> = new Set<ExperiencePhase>([
  'black',
  'post',
  'booting',
  'monitor_on',
  'reveal',
]);

/** Phases during which the WebGL canvas should stop rendering entirely. */
const FROZEN_CANVAS_PHASES: ReadonlySet<ExperiencePhase> = new Set<ExperiencePhase>([
  'os_active',
]);

/**
 * Pure predicate: is `to` a legal next phase from `from`?
 * Exported separately from the store so it is testable without React.
 */
export function canTransition(from: ExperiencePhase, to: ExperiencePhase): boolean {
  return PHASE_TRANSITIONS[from].includes(to);
}

/** Pure predicate: is the ambience actually coming out of the speakers? */
export function isSoundAudible(state: {
  soundOn: boolean;
  soundUnlocked: boolean;
}): boolean {
  return state.soundOn && state.soundUnlocked;
}

/** Pure predicate: may a DOM panel open during `phase`? */
export function canOpenPanel(phase: ExperiencePhase): boolean {
  return phase === 'room_idle' || phase === 'os_active';
}

interface ExperienceState {
  phase: ExperiencePhase;
  /** 0..1 progress of the current phase's primary animation. */
  phaseProgress: number;
  /** True while the canvas should be frozen (GPU reclaimed for the OS). */
  isCanvasFrozen: boolean;
  /**
   * When true the cinematic intro is skipped. Set from `prefers-reduced-motion`
   * and low device-tier detection.
   */
  prefersInstantEntry: boolean;
  /** The DOM panel currently open over the room, if any. */
  activePanel: PanelId | null;
  /** Deep-link target inside the résumé panel. */
  panelSection: ResumeSectionId | null;
  /** Which screen the phone should open on. */
  panelView: PhoneView | null;
  /** Which album the gallery should open on. */
  panelAlbum: GalleryAlbum | null;
  /** The room object that opened the panel — the camera leans toward it. */
  panelOrigin: HotspotId | null;
  /** What the pointer is over in the room. */
  hovered: HoverInfo | null;
  /** The monitor screen's rectangle in CSS px, reported by the scene. */
  monitorRect: ScreenRect | null;
  /**
   * Which way the camera faces at the desk. Always `desk` outside
   * `room_idle` and while a panel is open.
   */
  roomView: RoomView;
  /**
   * The first-visit guide: one message and an arrow to every clickable
   * object. While it is up the room holds still and nothing in it reacts.
   */
  guideOpen: boolean;
  /** Where those objects are on the page right now — reported by the scene. */
  guidePoints: GuidePoints | null;
  /** The desk lamp — a real switch the visitor can flip. */
  lampOn: boolean;
  /**
   * The visitor's sound preference — on by default. The soundbar, the HUD
   * button, the `M` key and the terminal's `sound` command all flip this.
   */
  soundOn: boolean;
  /**
   * Browsers refuse to play audio until the visitor has interacted with the
   * page. False until that first click / key press; the ambience is audible
   * only when `soundOn && soundUnlocked` (see `isSoundAudible`).
   */
  soundUnlocked: boolean;
  /** A short transient message (mug facts and the like). */
  toast: { id: number; text: string } | null;
  /**
   * True once the WebGL scene has compiled its shaders and drawn its first
   * frames. The intro waits for this before lifting the cover, so the camera
   * move never starts on a stutter.
   */
  sceneReady: boolean;
}

interface ExperienceActions {
  /** Attempt a transition. Returns `true` on success, `false` if disallowed. */
  transition: (to: ExperiencePhase) => boolean;
  setPhaseProgress: (progress: number) => void;
  setPrefersInstantEntry: (value: boolean) => void;
  /** Cut the intro: any intro phase → `room_idle`. No-op elsewhere. */
  skipIntro: () => boolean;
  /** `room_idle` → `zooming` (the camera finishes the move into `os_active`). */
  enterMonitor: () => boolean;
  /** `os_active` / `zooming` → `room_idle`. */
  exitMonitor: () => boolean;
  openPanel: (
    panel: PanelId,
    options?: {
      section?: ResumeSectionId;
      view?: PhoneView;
      album?: GalleryAlbum;
      origin?: HotspotId;
    },
  ) => boolean;
  closePanel: () => void;
  setHovered: (hovered: HoverInfo | null) => void;
  setMonitorRect: (rect: ScreenRect | null) => void;
  /** Show the guide. Only at the desk, facing it, with no panel open. */
  openGuide: () => boolean;
  closeGuide: () => void;
  setGuidePoints: (points: GuidePoints | null) => void;
  /** Turn to the left wall / back to the desk. Only at the desk, panels shut. */
  setRoomView: (view: RoomView) => boolean;
  toggleLamp: () => void;
  /**
   * Flip the sound. Before the browser has unlocked audio the sound is not
   * actually playing whatever the preference says, so the first press on any
   * sound control always means "start it".
   */
  toggleSound: () => void;
  setSoundOn: (on: boolean) => void;
  /** The first interaction happened — audio may start. */
  unlockSound: () => void;
  showToast: (text: string) => void;
  clearToast: () => void;
  setSceneReady: (ready: boolean) => void;
  reset: () => void;
}

const INITIAL_STATE: ExperienceState = {
  phase: 'black',
  phaseProgress: 0,
  isCanvasFrozen: false,
  prefersInstantEntry: false,
  activePanel: null,
  panelSection: null,
  panelView: null,
  panelAlbum: null,
  panelOrigin: null,
  hovered: null,
  monitorRect: null,
  roomView: 'desk',
  guideOpen: false,
  guidePoints: null,
  lampOn: true,
  soundOn: true,
  soundUnlocked: false,
  toast: null,
  sceneReady: false,
};

let toastCounter = 0;

export const useExperienceStore = create<ExperienceState & ExperienceActions>(
  (set, get) => ({
    ...INITIAL_STATE,

    transition: (to) => {
      const { phase } = get();
      if (!canTransition(phase, to)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[experience] illegal transition: "${phase}" → "${to}". ` +
              `Allowed: ${PHASE_TRANSITIONS[phase].join(', ') || '(none)'}`,
          );
        }
        return false;
      }
      set({
        phase: to,
        phaseProgress: 0,
        isCanvasFrozen: FROZEN_CANVAS_PHASES.has(to),
        hovered: null,
        roomView: 'desk',
        guideOpen: false,
        guidePoints: null,
      });
      return true;
    },

    setPhaseProgress: (progress) =>
      set({ phaseProgress: Math.min(1, Math.max(0, progress)) }),

    setPrefersInstantEntry: (value) => set({ prefersInstantEntry: value }),

    skipIntro: () => {
      const { phase, transition } = get();
      if (!INTRO_PHASES.has(phase)) return false;
      return transition('room_idle');
    },

    enterMonitor: () => {
      const { phase, activePanel, transition } = get();
      if (phase !== 'room_idle' || activePanel !== null) return false;
      return transition('zooming');
    },

    exitMonitor: () => {
      const { phase, transition } = get();
      if (phase !== 'os_active' && phase !== 'zooming') return false;
      set({
        activePanel: null,
        panelSection: null,
        panelView: null,
        panelAlbum: null,
        panelOrigin: null,
      });
      return transition('room_idle');
    },

    openPanel: (panel, options) => {
      if (!canOpenPanel(get().phase)) return false;
      set({
        activePanel: panel,
        panelSection: options?.section ?? null,
        panelView: options?.view ?? null,
        panelAlbum: options?.album ?? null,
        panelOrigin: options?.origin ?? null,
        hovered: null,
        roomView: 'desk',
        guideOpen: false,
        guidePoints: null,
      });
      return true;
    },

    closePanel: () =>
      set({
        activePanel: null,
        panelSection: null,
        panelView: null,
        panelAlbum: null,
        panelOrigin: null,
      }),

    setHovered: (hovered) => {
      const current = get().hovered;
      if (current?.id === hovered?.id) return;
      set({ hovered });
    },

    setMonitorRect: (monitorRect) => set({ monitorRect }),

    openGuide: () => {
      const { phase, activePanel } = get();
      if (phase !== 'room_idle' || activePanel !== null) return false;
      set({ guideOpen: true, guidePoints: null, roomView: 'desk', hovered: null });
      return true;
    },

    closeGuide: () => {
      if (get().guideOpen) set({ guideOpen: false, guidePoints: null });
    },

    setGuidePoints: (guidePoints) => set({ guidePoints }),

    setRoomView: (roomView) => {
      const { phase, activePanel, guideOpen } = get();
      if (
        roomView === 'left' &&
        (phase !== 'room_idle' || activePanel !== null || guideOpen)
      ) {
        return false;
      }
      if (get().roomView !== roomView) set({ roomView, hovered: null });
      return true;
    },

    toggleLamp: () => set((state) => ({ lampOn: !state.lampOn })),

    toggleSound: () =>
      set((state) =>
        state.soundUnlocked
          ? { soundOn: !state.soundOn }
          : { soundOn: true, soundUnlocked: true },
      ),

    setSoundOn: (soundOn) => set({ soundOn }),

    unlockSound: () => {
      if (!get().soundUnlocked) set({ soundUnlocked: true });
    },

    showToast: (text) => {
      toastCounter += 1;
      set({ toast: { id: toastCounter, text } });
    },

    clearToast: () => set({ toast: null }),

    setSceneReady: (sceneReady) => set({ sceneReady }),

    reset: () => set(INITIAL_STATE),
  }),
);

/* ----------------------------- selector hooks ---------------------------- */

export const useExperiencePhase = (): ExperiencePhase =>
  useExperienceStore((s) => s.phase);

export const useIsCanvasFrozen = (): boolean =>
  useExperienceStore((s) => s.isCanvasFrozen);

export { EXPERIENCE_PHASES };

// Dev-only handle for poking the FSM from the browser console
// (`__experience.getState().openPanel('resume')`). Never present in production.
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  (window as unknown as { __experience?: typeof useExperienceStore }).__experience =
    useExperienceStore;
}
