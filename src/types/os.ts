/**
 * WorkspaceOS domain types: applications and user settings.
 */

/**
 * Every application that can open as a real window inside WorkspaceOS.
 *
 * External destinations (GitHub, LinkedIn) are deliberately NOT here — they
 * open in a new tab rather than a managed window, so they are handled by the
 * desktop layer, not the window manager.
 */
export const APP_IDS = [
  'projects',
  'experience',
  'resume',
  'gallery',
  'sandbox',
  'terminal',
  'contact',
  'blog',
  'downloads',
  'notebook',
] as const;

export type AppId = (typeof APP_IDS)[number];

/** Day = warm/bright, Night = the default cool late-night workspace. */
export type Theme = 'day' | 'night';

/** Persisted, user-controllable environment settings. */
export interface OSSettings {
  theme: Theme;
  wallpaperId: string;
  rainEnabled: boolean;
  /** Unlocks developer-mode easter eggs (extra terminal commands, overlays). */
  devMode: boolean;
}
