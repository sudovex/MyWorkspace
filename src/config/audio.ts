/**
 * The room's sound. Everything is generated in the browser with the Web Audio
 * API (`features/audio/`): no audio files, no network.
 */
export const AUDIO = {
  /** Overall loudness, 0..1. The mix is quiet on purpose — it is a backdrop. */
  volume: 0.85,
  /** Relative level of the two layers. */
  rain: 1,
  music: 1,
  /** Seconds to fade in when the sound first starts / when it is un-muted. */
  firstFadeIn: 3.5,
  fadeIn: 0.9,
  fadeOut: 0.45,
  /** Where the mute preference is remembered between visits. */
  storageKey: 'workspace-os:sound',
} as const;
