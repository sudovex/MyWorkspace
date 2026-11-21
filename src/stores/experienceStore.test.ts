import { describe, expect, it, beforeEach } from 'vitest';
import {
  canOpenPanel,
  canTransition,
  isSoundAudible,
  PHASE_TRANSITIONS,
  useExperienceStore,
} from './experienceStore';
import { EXPERIENCE_PHASES } from '@/types/experience';

describe('canTransition (pure)', () => {
  it('permits every declared transition', () => {
    for (const from of EXPERIENCE_PHASES) {
      for (const to of PHASE_TRANSITIONS[from]) {
        expect(canTransition(from, to)).toBe(true);
      }
    }
  });

  it('rejects a transition that is not declared', () => {
    // `booting` only allows `monitor_on` (and the skip cut to `room_idle`).
    expect(canTransition('booting', 'os_active')).toBe(false);
    expect(canTransition('room_idle', 'black')).toBe(false);
  });

  it('models the full happy path black → os_active', () => {
    const path = [
      'black',
      'post',
      'booting',
      'monitor_on',
      'reveal',
      'room_idle',
      'zooming',
      'os_active',
    ] as const;
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransition(path[i]!, path[i + 1]!)).toBe(true);
    }
  });
});

describe('experience store', () => {
  beforeEach(() => {
    useExperienceStore.getState().reset();
  });

  it('starts black with a live (unfrozen) canvas', () => {
    const s = useExperienceStore.getState();
    expect(s.phase).toBe('black');
    expect(s.isCanvasFrozen).toBe(false);
  });

  it('applies a legal transition and returns true', () => {
    const ok = useExperienceStore.getState().transition('post');
    expect(ok).toBe(true);
    expect(useExperienceStore.getState().phase).toBe('post');
  });

  it('rejects an illegal transition and leaves state untouched', () => {
    // From `black` only post / reveal / room_idle / os_active are legal.
    const ok = useExperienceStore.getState().transition('zooming');
    expect(ok).toBe(false);
    expect(useExperienceStore.getState().phase).toBe('black');
  });

  it('freezes the canvas exactly when entering os_active', () => {
    const s = useExperienceStore.getState();
    s.transition('os_active'); // black → os_active is the low-tier skip path
    expect(useExperienceStore.getState().isCanvasFrozen).toBe(true);
    useExperienceStore.getState().transition('room_idle');
    expect(useExperienceStore.getState().isCanvasFrozen).toBe(false);
  });

  it('clamps phase progress to the 0..1 range', () => {
    const { setPhaseProgress } = useExperienceStore.getState();
    setPhaseProgress(2);
    expect(useExperienceStore.getState().phaseProgress).toBe(1);
    setPhaseProgress(-1);
    expect(useExperienceStore.getState().phaseProgress).toBe(0);
  });

  it('skips the intro from any intro phase, and only from an intro phase', () => {
    for (const from of ['black', 'post', 'booting', 'monitor_on', 'reveal'] as const) {
      useExperienceStore.setState({ phase: from });
      expect(useExperienceStore.getState().skipIntro()).toBe(true);
      expect(useExperienceStore.getState().phase).toBe('room_idle');
    }
    expect(useExperienceStore.getState().skipIntro()).toBe(false);
  });

  it('enters and exits the monitor through zooming', () => {
    useExperienceStore.setState({ phase: 'room_idle' });
    expect(useExperienceStore.getState().enterMonitor()).toBe(true);
    expect(useExperienceStore.getState().phase).toBe('zooming');
    useExperienceStore.getState().transition('os_active');
    expect(useExperienceStore.getState().exitMonitor()).toBe(true);
    expect(useExperienceStore.getState().phase).toBe('room_idle');
  });

  it('refuses to enter the monitor while a panel is open', () => {
    useExperienceStore.setState({ phase: 'room_idle' });
    useExperienceStore.getState().openPanel('resume');
    expect(useExperienceStore.getState().enterMonitor()).toBe(false);
    expect(useExperienceStore.getState().phase).toBe('room_idle');
  });

  it('opens panels only at the desk or inside the OS, with deep links', () => {
    expect(canOpenPanel('reveal')).toBe(false);
    expect(useExperienceStore.getState().openPanel('gallery')).toBe(false);

    useExperienceStore.setState({ phase: 'room_idle' });
    const ok = useExperienceStore
      .getState()
      .openPanel('resume', { section: 'experience', origin: 'calendar' });
    expect(ok).toBe(true);
    const s = useExperienceStore.getState();
    expect(s.activePanel).toBe('resume');
    expect(s.panelSection).toBe('experience');
    expect(s.panelOrigin).toBe('calendar');

    useExperienceStore.getState().closePanel();
    expect(useExperienceStore.getState().activePanel).toBeNull();
    expect(useExperienceStore.getState().panelOrigin).toBeNull();
  });

  it('can open the phone on a specific screen, and forgets it on close', () => {
    useExperienceStore.setState({ phase: 'room_idle' });
    useExperienceStore
      .getState()
      .openPanel('contact', { view: 'spotify', origin: 'headphones' });
    expect(useExperienceStore.getState().panelView).toBe('spotify');
    useExperienceStore.getState().closePanel();
    expect(useExperienceStore.getState().panelView).toBeNull();
  });

  it('can open the gallery on an album, and forgets it on close', () => {
    useExperienceStore.setState({ phase: 'room_idle' });
    useExperienceStore
      .getState()
      .openPanel('gallery', { album: 'gym', origin: 'shaker' });
    expect(useExperienceStore.getState().panelAlbum).toBe('gym');
    useExperienceStore.getState().closePanel();
    expect(useExperienceStore.getState().panelAlbum).toBeNull();
  });

  it('flips the lamp', () => {
    expect(useExperienceStore.getState().lampOn).toBe(true);
    useExperienceStore.getState().toggleLamp();
    expect(useExperienceStore.getState().lampOn).toBe(false);
  });

  it('turns to the left wall only at the desk, and faces front again on its own', () => {
    const store = useExperienceStore;
    expect(store.getState().setRoomView('left')).toBe(false);
    store.setState({ phase: 'room_idle' });
    expect(store.getState().setRoomView('left')).toBe(true);
    expect(store.getState().roomView).toBe('left');
    // opening a panel faces the desk again…
    store.getState().openPanel('gallery');
    expect(store.getState().roomView).toBe('desk');
    expect(store.getState().setRoomView('left')).toBe(false);
    store.getState().closePanel();
    // …and so does walking into the monitor
    store.getState().setRoomView('left');
    store.getState().enterMonitor();
    expect(store.getState().roomView).toBe('desk');
  });

  it('shows the guide only at the desk, and anything else the visitor does ends it', () => {
    const store = useExperienceStore;
    expect(store.getState().openGuide()).toBe(false);
    store.setState({ phase: 'room_idle', roomView: 'left' });
    expect(store.getState().openGuide()).toBe(true);
    expect(store.getState().guideOpen).toBe(true);
    // it faces the desk, and the room cannot be turned while it is up
    expect(store.getState().roomView).toBe('desk');
    expect(store.getState().setRoomView('left')).toBe(false);
    store.getState().setGuidePoints({ helmet: { x: 10, y: 20 } });
    store.getState().closeGuide();
    expect(store.getState().guideOpen).toBe(false);
    expect(store.getState().guidePoints).toBeNull();
    // opening a panel or walking into the monitor dismisses it too
    store.getState().openGuide();
    store.getState().openPanel('resume');
    expect(store.getState().guideOpen).toBe(false);
    store.getState().closePanel();
    store.getState().openGuide();
    store.getState().enterMonitor();
    expect(store.getState().guideOpen).toBe(false);
  });

  it('wants sound by default, but is silent until the browser unlocks audio', () => {
    const state = useExperienceStore.getState();
    expect(state.soundOn).toBe(true);
    expect(state.soundUnlocked).toBe(false);
    expect(isSoundAudible(state)).toBe(false);
    state.unlockSound();
    expect(isSoundAudible(useExperienceStore.getState())).toBe(true);
  });

  it('treats the first press on a sound control as "start", then toggles', () => {
    const { toggleSound } = useExperienceStore.getState();
    toggleSound();
    expect(isSoundAudible(useExperienceStore.getState())).toBe(true);
    toggleSound();
    expect(useExperienceStore.getState().soundOn).toBe(false);
    expect(isSoundAudible(useExperienceStore.getState())).toBe(false);
    toggleSound();
    expect(isSoundAudible(useExperienceStore.getState())).toBe(true);
  });

  it('starts the sound on a first press even if the stored preference was off', () => {
    useExperienceStore.getState().setSoundOn(false);
    useExperienceStore.getState().toggleSound();
    expect(isSoundAudible(useExperienceStore.getState())).toBe(true);
  });
});
