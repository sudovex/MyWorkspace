'use client';

/**
 * Plays the room's ambience and keeps it in step with the store.
 *
 * The sound is ON by default, but browsers do not let a page make noise
 * before the visitor has interacted with it. So this waits for the first
 * click or key press anywhere on the page (`unlockSound`) and starts then —
 * in practice the click that skips the intro or the first object clicked.
 *
 * The soundbar, the HUD button, the `M` key and the terminal's `sound`
 * command never talk to this component: they flip `soundOn` in the store,
 * and this follows. Renders nothing.
 */
import { useEffect } from 'react';
import { AUDIO } from '@/config/audio';
import { profile } from '@/content';
import { isSoundAudible, useExperienceStore } from '@/stores/experienceStore';
import { AmbienceEngine, renderAmbience } from './ambience';

/** Keys that browsers do not count as "the visitor interacted". */
const PASSIVE_KEYS = new Set(['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'Tab']);

/** While the phone's Spotify screen has real players on it, step back. */
const DUCKED_LEVEL = 0.2;

function readPreference(): boolean | null {
  try {
    const stored = window.localStorage.getItem(AUDIO.storageKey);
    return stored === null ? null : stored !== 'off';
  } catch {
    return null;
  }
}

function writePreference(on: boolean): void {
  try {
    window.localStorage.setItem(AUDIO.storageKey, on ? 'on' : 'off');
  } catch {
    // Private mode / storage disabled: the preference just lasts the visit.
  }
}

export function AmbientSound() {
  useEffect(() => {
    const engine = new AmbienceEngine();
    const store = useExperienceStore;

    if (readPreference() === false) store.getState().setSoundOn(false);

    const apply = () => {
      const state = store.getState();
      engine.setPlaying(isSoundAudible(state) && !document.hidden);
      const overSpotify =
        state.activePanel === 'contact' &&
        state.panelView === 'spotify' &&
        profile.spotify.playlists.length > 0;
      engine.setDuck(overSpotify ? DUCKED_LEVEL : 1);
    };

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.soundOn !== previous.soundOn) writePreference(state.soundOn);
      if (
        state.soundOn !== previous.soundOn ||
        state.soundUnlocked !== previous.soundUnlocked ||
        state.activePanel !== previous.activePanel ||
        state.panelView !== previous.panelView
      ) {
        apply();
      }
    });

    // Bubble-phase `click` / `keyup`, deliberately: a press on a sound control
    // has already been handled by the time these run, so the same gesture is
    // never counted twice (once as "unlock", once as "toggle").
    const onGesture = (event: Event) => {
      if (event instanceof KeyboardEvent && PASSIVE_KEYS.has(event.key)) return;
      store.getState().unlockSound();
      // Also re-ask on every later gesture, in case the browser refused the
      // first time (or interrupted the audio since).
      apply();
    };
    window.addEventListener('click', onGesture);
    window.addEventListener('keyup', onGesture);
    document.addEventListener('visibilitychange', apply);

    // Dev-only: `await __ambience.render(30)` renders the mix offline.
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __ambience?: unknown }).__ambience = {
        render: renderAmbience,
      };
    }

    return () => {
      unsubscribe();
      window.removeEventListener('click', onGesture);
      window.removeEventListener('keyup', onGesture);
      document.removeEventListener('visibilitychange', apply);
      engine.dispose();
    };
  }, []);

  return null;
}
