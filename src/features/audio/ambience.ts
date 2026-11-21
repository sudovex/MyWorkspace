/**
 * The room's sound: night rain on the window and slow, soft music — generated
 * live with the Web Audio API. No audio files, no network.
 *
 * Two layers, mixed quietly:
 *
 *  - RAIN. One loop of stereo noise shaped by three filters — a soft hiss, a
 *    mid "body" and a low rumble, all muffled the way rain is from indoors —
 *    with slow LFOs so it swells and eases like weather, plus a loop of
 *    individual drops ticking on the sill.
 *  - MUSIC. The score in `score.ts`: a detuned pad through a slowly opening
 *    low-pass, a low root, and sparse bell-like keys with a long echo, all
 *    in a generated reverb.
 *
 * `buildAmbience` wires the graph onto any `BaseAudioContext`, so the same
 * code plays live and renders offline (`renderAmbience`, used to check levels
 * without ears). `AmbienceEngine` owns the live context: it creates it lazily
 * (browsers only allow that after a user gesture), fades in and out, and
 * suspends the context whenever nothing is audible so a muted or hidden tab
 * costs no CPU.
 */
import { AUDIO } from '@/config/audio';
import { mulberry32 } from '@/lib/prng';
import { BAR_SECONDS, barEvents, midiToHz, type NoteEvent } from './score';

export interface AmbienceLayers {
  rain?: boolean;
  music?: boolean;
}

export interface AmbienceGraph {
  /** Fade this for mute / un-mute. Starts at 0. */
  master: GainNode;
  /** A second, independent level (used to duck under other audio). */
  duck: GainNode;
  /** Schedule every note that starts before `time` (context seconds). */
  scheduleUntil: (time: number) => void;
}

/* ------------------------------ generated buffers ------------------------ */

function noiseBuffer(ctx: BaseAudioContext, seconds: number, seed: number): AudioBuffer {
  const length = Math.floor(seconds * ctx.sampleRate);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const random = mulberry32(seed + channel * 101);
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) data[i] = random() * 2 - 1;
  }
  return buffer;
}

/** Individual raindrops: short, pitched ticks scattered across the stereo field. */
function dropsBuffer(ctx: BaseAudioContext, seconds: number, seed: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(seconds * rate);
  const buffer = ctx.createBuffer(2, length, rate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const random = mulberry32(seed);
  const count = Math.floor(seconds * 7);
  for (let n = 0; n < count; n += 1) {
    const heavy = random() < 0.18;
    const frequency = heavy ? 260 + random() * 380 : 900 + random() * 2100;
    const decay = heavy ? 0.03 + random() * 0.03 : 0.006 + random() * 0.016;
    const amplitude = (0.15 + random() ** 2 * 0.85) * (heavy ? 0.55 : 0.4);
    const pan = random();
    const start = Math.floor(random() * (length - rate * 0.4));
    const samples = Math.floor(decay * 7 * rate);
    let phase = 0;
    for (let i = 0; i < samples; i += 1) {
      const t = i / rate;
      // the pitch falls a little as the drop settles
      phase +=
        (2 * Math.PI * frequency * (1 - 0.25 * Math.min(1, t / (decay * 4)))) / rate;
      const attack = Math.min(1, i / (rate * 0.0008));
      const sample = Math.sin(phase) * Math.exp(-t / decay) * attack * amplitude;
      const at = start + i;
      left[at] = (left[at] ?? 0) + sample * Math.cos((pan * Math.PI) / 2);
      right[at] = (right[at] ?? 0) + sample * Math.sin((pan * Math.PI) / 2);
    }
  }
  return buffer;
}

/** A plain, dark room reverb: decaying noise that loses its top end as it fades. */
function reverbImpulse(
  ctx: BaseAudioContext,
  seconds: number,
  seed: number,
): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(seconds * rate);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const random = mulberry32(seed + channel * 53);
    const data = buffer.getChannelData(channel);
    let smoothed = 0;
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      // one-pole low-pass whose cutoff drops over the tail
      const k = 0.5 - 0.42 * t;
      smoothed += k * (random() * 2 - 1 - smoothed);
      const onset = Math.min(1, i / (rate * 0.012));
      data[i] = smoothed * onset * (1 - t) ** 2.4;
    }
  }
  return buffer;
}

/* --------------------------------- helpers -------------------------------- */

function gainNode(ctx: BaseAudioContext, value: number): GainNode {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

function filterNode(
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  frequency: number,
  q = 0.707,
): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

function loop(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();
  return source;
}

/** A very slow sine added to an `AudioParam` — the weather's movement. */
function lfo(
  ctx: BaseAudioContext,
  target: AudioParam,
  frequency: number,
  depth: number,
): void {
  const oscillator = ctx.createOscillator();
  oscillator.frequency.value = frequency;
  const amount = gainNode(ctx, depth);
  oscillator.connect(amount).connect(target);
  oscillator.start();
}

function panned(ctx: BaseAudioContext, pan: number, to: AudioNode): AudioNode {
  // Safari gained StereoPannerNode late; without it the note is simply centred.
  if (typeof ctx.createStereoPanner !== 'function') return to;
  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  panner.connect(to);
  return panner;
}

/* ---------------------------------- graph --------------------------------- */

export function buildAmbience(
  ctx: BaseAudioContext,
  destination: AudioNode,
  layers: AmbienceLayers = {},
): AmbienceGraph {
  const withRain = layers.rain ?? true;
  const withMusic = layers.music ?? true;

  // master → duck → glue compressor → output level → speakers
  const master = gainNode(ctx, 0);
  const duck = gainNode(ctx, 1);
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.03;
  compressor.release.value = 0.5;
  const output = gainNode(ctx, AUDIO.volume);
  master.connect(duck).connect(compressor).connect(output).connect(destination);

  /* -------------------------------- rain --------------------------------- */

  if (withRain) {
    const rain = gainNode(ctx, AUDIO.rain);
    rain.connect(master);
    const noise = loop(ctx, noiseBuffer(ctx, 6, 11));

    // the hiss of it falling, heard through glass
    const hiss = gainNode(ctx, 0.04);
    noise
      .connect(filterNode(ctx, 'highpass', 850, 0.5))
      .connect(filterNode(ctx, 'lowpass', 3800, 0.6))
      .connect(filterNode(ctx, 'lowpass', 6500, 0.5))
      .connect(hiss)
      .connect(rain);
    lfo(ctx, hiss.gain, 0.043, 0.01);
    lfo(ctx, hiss.gain, 0.117, 0.005);

    // the body: rain on the roof and the street below
    const body = filterNode(ctx, 'bandpass', 430, 0.55);
    const bodyGain = gainNode(ctx, 0.19);
    noise.connect(body).connect(bodyGain).connect(rain);
    lfo(ctx, body.frequency, 0.031, 90);
    lfo(ctx, bodyGain.gain, 0.071, 0.03);

    // far-off rumble: the weight of the weather
    const rumble = gainNode(ctx, 0.17);
    noise
      .connect(filterNode(ctx, 'lowpass', 115, 0.6))
      .connect(rumble)
      .connect(rain);
    lfo(ctx, rumble.gain, 0.023, 0.07);

    // single drops on the sill
    loop(ctx, dropsBuffer(ctx, 13, 29))
      .connect(filterNode(ctx, 'lowpass', 4200, 0.5))
      .connect(gainNode(ctx, 0.1))
      .connect(rain);
  }

  /* -------------------------------- music -------------------------------- */

  if (!withMusic) return { master, duck, scheduleUntil: () => undefined };

  const music = gainNode(ctx, AUDIO.music);
  music.connect(master);

  const reverb = ctx.createConvolver();
  reverb.buffer = reverbImpulse(ctx, 3.4, 71);
  reverb.connect(gainNode(ctx, 0.9)).connect(music);

  // pad: every voice → one slowly breathing low-pass
  const padFilter = filterNode(ctx, 'lowpass', 1050, 0.4);
  lfo(ctx, padFilter.frequency, 0.027, 320);
  const padBus = gainNode(ctx, 0.036);
  padFilter.connect(padBus);
  padBus.connect(music);
  padBus.connect(gainNode(ctx, 0.55)).connect(reverb);

  const bassBus = gainNode(ctx, 0.03);
  bassBus.connect(filterNode(ctx, 'lowpass', 420, 0.5)).connect(music);

  // keys: dry + a long, dark echo + the room
  const keysBus = gainNode(ctx, 0.09);
  keysBus.connect(music);
  keysBus.connect(gainNode(ctx, 0.7)).connect(reverb);
  const echo = ctx.createDelay(1.5);
  echo.delayTime.value = BAR_SECONDS / 16;
  const echoTone = filterNode(ctx, 'lowpass', 1700, 0.5);
  const feedback = gainNode(ctx, 0.42);
  keysBus.connect(gainNode(ctx, 0.5)).connect(echo);
  echo.connect(echoTone).connect(feedback).connect(echo);
  echoTone.connect(music);
  echoTone.connect(gainNode(ctx, 0.5)).connect(reverb);

  const oscillator = (
    type: OscillatorType,
    frequency: number,
    cents: number,
    from: number,
    until: number,
    to: AudioNode,
  ) => {
    const node = ctx.createOscillator();
    node.type = type;
    node.frequency.value = frequency;
    node.detune.value = cents;
    node.connect(to);
    node.start(from);
    node.stop(until);
  };

  const play = (event: NoteEvent, origin: number) => {
    const at = origin + event.time;
    const frequency = midiToHz(event.midi);
    const envelope = gainNode(ctx, 0);

    if (event.voice === 'keys') {
      // a soft bell: quick in, long exponential out, a little upper partial
      const end = at + 7;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(event.velocity, at + 0.014);
      envelope.gain.setTargetAtTime(0, at + 0.014, 1.05);
      envelope.connect(panned(ctx, event.pan, keysBus));
      oscillator('sine', frequency, 0, at, end, envelope);
      const partial = gainNode(ctx, 0.22);
      partial.connect(envelope);
      oscillator('sine', frequency * 2, 3, at, end, partial);
      const air = gainNode(ctx, 0.05);
      air.connect(envelope);
      oscillator('sine', frequency * 3, -4, at, end, air);
      return;
    }

    // pad and bass: a slow swell that overlaps the next chord as it lets go
    const attack = event.voice === 'pad' ? 3.2 : 2.2;
    const release = at + event.duration;
    const end = release + 8;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(event.velocity, at + attack);
    envelope.gain.setTargetAtTime(0, release, 1.5);

    if (event.voice === 'bass') {
      envelope.connect(bassBus);
      oscillator('sine', frequency, 0, at, end, envelope);
      // an octave up, quietly, so small speakers still hear the root
      const upper = gainNode(ctx, 0.3);
      upper.connect(envelope);
      oscillator('triangle', frequency * 2, 0, at, end, upper);
      return;
    }

    envelope.connect(panned(ctx, event.pan, padFilter));
    oscillator('triangle', frequency, -6, at, end, envelope);
    oscillator('triangle', frequency, 6, at, end, envelope);
    const shimmer = gainNode(ctx, 0.12);
    shimmer.connect(envelope);
    oscillator('sine', frequency * 2, 2, at, end, shimmer);
  };

  // The piece starts a moment after the graph is built.
  const origin = ctx.currentTime + 0.25;
  let nextBar = 0;
  const scheduleUntil = (time: number) => {
    while (origin + nextBar * BAR_SECONDS < time) {
      for (const event of barEvents(nextBar)) play(event, origin);
      nextBar += 1;
    }
  };

  return { master, duck, scheduleUntil };
}

/* ----------------------------- offline rendering -------------------------- */

/**
 * Render the ambience to a buffer instead of the speakers — for measuring
 * levels and for tests in a real browser. Not used at runtime.
 */
export async function renderAmbience(
  seconds: number,
  layers: AmbienceLayers = {},
  sampleRate = 44_100,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.floor(seconds * sampleRate), sampleRate);
  const graph = buildAmbience(ctx, ctx.destination, layers);
  graph.master.gain.value = 1;
  graph.scheduleUntil(seconds);
  return ctx.startRendering();
}

/* --------------------------------- engine --------------------------------- */

type AudioContextConstructor = typeof AudioContext;

function audioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

/** How far ahead of the clock notes are scheduled, and how often we check. */
const LOOKAHEAD_S = 4;
const SCHEDULER_MS = 1000;

function fade(param: AudioParam, to: number, seconds: number, now: number): void {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(to, now + seconds);
}

export class AmbienceEngine {
  private ctx: AudioContext | null = null;
  private graph: AmbienceGraph | null = null;
  private playing = false;
  private duckLevel = 1;
  private scheduler: number | null = null;
  private suspendTimer: number | null = null;
  private disposed = false;

  /** True when this browser has no Web Audio at all. */
  readonly unsupported = audioContextConstructor() === null;

  /**
   * Start or stop the sound. Idempotent. The first `setPlaying(true)` creates
   * the audio context, so it must happen during or after a user gesture.
   * Calling it again while the browser still has the context suspended simply
   * asks again — which is how a later gesture gets a second chance.
   */
  setPlaying(on: boolean): void {
    if (this.disposed || this.unsupported) return;
    if (on) this.play();
    else this.pause();
  }

  /** Lower the whole mix (0..1) without muting it. */
  setDuck(level: number): void {
    this.duckLevel = level;
    if (this.ctx && this.graph) {
      fade(this.graph.duck.gain, level, 0.6, this.ctx.currentTime);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.stopScheduler();
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.graph = null;
  }

  private play(): void {
    const first = this.ctx === null;
    if (!this.ctx) {
      const Context = audioContextConstructor();
      if (!Context) return;
      try {
        this.ctx = new Context({ latencyHint: 'playback' });
      } catch {
        return;
      }
      this.graph = buildAmbience(this.ctx, this.ctx.destination);
      this.graph.duck.gain.value = this.duckLevel;
    }
    const { ctx, graph } = this;
    if (!graph) return;

    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
    if (this.playing) return;
    this.playing = true;

    graph.scheduleUntil(ctx.currentTime + LOOKAHEAD_S);
    this.stopScheduler();
    this.scheduler = window.setInterval(() => {
      graph.scheduleUntil(ctx.currentTime + LOOKAHEAD_S);
    }, SCHEDULER_MS);
    fade(graph.master.gain, 1, first ? AUDIO.firstFadeIn : AUDIO.fadeIn, ctx.currentTime);
  }

  private pause(): void {
    const { ctx, graph } = this;
    if (!ctx || !graph || !this.playing) return;
    this.playing = false;
    this.stopScheduler();
    fade(graph.master.gain, 0, AUDIO.fadeOut, ctx.currentTime);
    // Once silent, stop the audio clock entirely: no CPU while muted, and the
    // piece picks up exactly where it left off.
    this.suspendTimer = window.setTimeout(
      () => {
        this.suspendTimer = null;
        if (!this.playing) void ctx.suspend().catch(() => undefined);
      },
      AUDIO.fadeOut * 1000 + 250,
    );
  }

  private stopScheduler(): void {
    if (this.scheduler !== null) {
      window.clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }
}
