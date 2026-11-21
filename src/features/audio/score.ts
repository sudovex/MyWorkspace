/**
 * The ambience's music, as data — pure and framework-free.
 *
 * A slow eight-chord loop in F major (ten seconds a chord), played as a soft
 * pad with a low root underneath, and a few sparse, bell-like notes on top
 * that never repeat: each bar's notes are picked by a PRNG seeded with the
 * bar's number, so the tune is the same on every visit but does not loop.
 *
 * `barEvents(bar)` returns everything that sounds in one bar; the engine
 * (`ambience.ts`) only turns those events into oscillators.
 */
import { mulberry32 } from '@/lib/prng';

/** Length of one chord, seconds. */
export const BAR_SECONDS = 10;
/** The keys land on a slow grid: eight slots a bar. */
export const SLOTS_PER_BAR = 8;

export interface Chord {
  name: string;
  /** MIDI note of the root, played low. */
  bass: number;
  /** MIDI notes of the pad voicing. */
  pad: readonly number[];
  /** MIDI notes the sparse top line may pick from. */
  keys: readonly number[];
}

export const PROGRESSION: readonly Chord[] = [
  { name: 'Fmaj9', bass: 41, pad: [57, 60, 64, 67], keys: [69, 72, 76, 79, 81] },
  { name: 'Dm9', bass: 38, pad: [53, 57, 60, 64], keys: [69, 72, 74, 76, 77] },
  { name: 'B♭maj7', bass: 46, pad: [53, 57, 62, 65], keys: [70, 72, 74, 77, 81] },
  { name: 'C6/9', bass: 48, pad: [55, 57, 62, 64], keys: [67, 72, 74, 76, 79] },
  { name: 'Am7', bass: 45, pad: [55, 60, 64, 67], keys: [69, 72, 76, 79, 81] },
  { name: 'Dm9', bass: 38, pad: [53, 57, 60, 64], keys: [69, 72, 74, 77, 81] },
  { name: 'Gm9', bass: 43, pad: [53, 58, 62, 65], keys: [70, 74, 77, 79, 81] },
  { name: 'C9sus', bass: 48, pad: [55, 58, 62, 65], keys: [67, 70, 72, 74, 79] },
];

export type Voice = 'pad' | 'bass' | 'keys';

export interface NoteEvent {
  voice: Voice;
  /** Seconds from the start of the piece. */
  time: number;
  /** Seconds the note is held before it is released. */
  duration: number;
  midi: number;
  /** 0..1 */
  velocity: number;
  /** Stereo position, -1 (left) .. 1 (right). */
  pan: number;
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function chordAt(bar: number): Chord {
  const index = ((bar % PROGRESSION.length) + PROGRESSION.length) % PROGRESSION.length;
  // The modulo keeps the index in range; the fallback satisfies the compiler.
  return PROGRESSION[index] ?? (PROGRESSION[0] as Chord);
}

/** Everything that starts sounding during bar `bar` (0-based), in time order. */
export function barEvents(bar: number): NoteEvent[] {
  const chord = chordAt(bar);
  const start = bar * BAR_SECONDS;
  const random = mulberry32(0x5eed + bar * 7919);
  const events: NoteEvent[] = [];

  events.push({
    voice: 'bass',
    time: start,
    duration: BAR_SECONDS,
    midi: chord.bass,
    velocity: 0.8,
    pan: 0,
  });

  // The pad: the chord, its notes entering a breath apart and spread wide.
  chord.pad.forEach((midi, i) => {
    const spread = chord.pad.length > 1 ? i / (chord.pad.length - 1) : 0.5;
    events.push({
      voice: 'pad',
      time: start + i * 0.22 + random() * 0.15,
      duration: BAR_SECONDS,
      midi,
      velocity: 0.62 + random() * 0.2,
      pan: (spread - 0.5) * 1.1,
    });
  });

  // The keys: one to three notes a bar, sometimes answered a step later.
  const slot = BAR_SECONDS / SLOTS_PER_BAR;
  const count = 1 + Math.floor(random() * 3);
  const used = new Set<number>();
  for (let n = 0; n < count; n += 1) {
    const at = 1 + Math.floor(random() * (SLOTS_PER_BAR - 2));
    if (used.has(at)) continue;
    used.add(at);
    const pick = Math.floor(random() * chord.keys.length);
    const midi = chord.keys[pick] ?? 72;
    const time = start + at * slot + (random() - 0.5) * 0.06;
    const pan = (random() - 0.5) * 0.9;
    events.push({
      voice: 'keys',
      time,
      duration: 0.4,
      midi,
      velocity: 0.45 + random() * 0.4,
      pan,
    });
    if (random() < 0.4) {
      const next = chord.keys[(pick + 1) % chord.keys.length] ?? midi;
      events.push({
        voice: 'keys',
        time: time + slot / 2,
        duration: 0.4,
        midi: next,
        velocity: 0.3 + random() * 0.25,
        pan: -pan,
      });
    }
  }

  return events.sort((a, b) => a.time - b.time);
}
