import { describe, expect, it } from 'vitest';
import {
  BAR_SECONDS,
  PROGRESSION,
  barEvents,
  chordAt,
  midiToHz,
  type NoteEvent,
} from './score';

/** Pitch classes of F major. */
const F_MAJOR = new Set([5, 7, 9, 10, 0, 2, 4]);

describe('score (pure)', () => {
  it('tunes A4 to 440 Hz and doubles every octave', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(81)).toBeCloseTo(880, 6);
    expect(midiToHz(57)).toBeCloseTo(220, 6);
  });

  it('loops the progression, including for negative bars', () => {
    expect(chordAt(0)).toBe(PROGRESSION[0]);
    expect(chordAt(PROGRESSION.length)).toBe(PROGRESSION[0]);
    expect(chordAt(-1)).toBe(PROGRESSION[PROGRESSION.length - 1]);
  });

  it('never leaves the key', () => {
    for (const chord of PROGRESSION) {
      for (const midi of [chord.bass, ...chord.pad, ...chord.keys]) {
        expect(F_MAJOR.has(midi % 12)).toBe(true);
      }
    }
  });

  it('is deterministic: the same bar is always the same notes', () => {
    expect(barEvents(5)).toEqual(barEvents(5));
  });

  it('plays the whole chord and its root every bar, inside that bar', () => {
    for (let bar = 0; bar < 24; bar += 1) {
      const events = barEvents(bar);
      const chord = chordAt(bar);
      const of = (voice: NoteEvent['voice']) => events.filter((e) => e.voice === voice);
      expect(of('bass').map((e) => e.midi)).toEqual([chord.bass]);
      expect(
        of('pad')
          .map((e) => e.midi)
          .sort(),
      ).toEqual([...chord.pad].sort());
      expect(of('keys').length).toBeGreaterThanOrEqual(1);
      for (const event of events) {
        expect(event.time).toBeGreaterThanOrEqual(bar * BAR_SECONDS);
        expect(event.time).toBeLessThan((bar + 1) * BAR_SECONDS);
        expect(event.velocity).toBeGreaterThan(0);
        expect(event.velocity).toBeLessThanOrEqual(1);
        expect(Math.abs(event.pan)).toBeLessThanOrEqual(1);
      }
      for (const key of of('keys')) expect(chord.keys).toContain(key.midi);
    }
  });

  it('stays sparse and keeps the top line from repeating bar to bar', () => {
    const lines = new Set<string>();
    for (let bar = 0; bar < 16; bar += 1) {
      const keys = barEvents(bar).filter((e) => e.voice === 'keys');
      expect(keys.length).toBeLessThanOrEqual(6);
      lines.add(keys.map((e) => `${e.midi}@${(e.time % BAR_SECONDS).toFixed(1)}`).join());
    }
    expect(lines.size).toBeGreaterThan(10);
  });

  it('returns events in time order', () => {
    const times = barEvents(3).map((e) => e.time);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});
