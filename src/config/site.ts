/**
 * Central site + product metadata. Single source for SEO, Open Graph, the boot
 * sequence, and OS chrome.
 *
 * Branding model: the PRODUCT is `WorkspaceOS` (an operating system). The person
 * is modelled as the logged-in DEVELOPER PROFILE (`developer`) rather than
 * making the OS itself personal — mirroring "Welcome back, Shubham Mali".
 */
export const siteConfig = {
  /** Product / OS name. */
  osName: 'WorkspaceOS',
  osVersion: '1.0.0',

  /** The logged-in developer profile shown after boot. */
  developer: {
    name: 'Shubham Mali',
    role: 'Software Engineer',
  },

  description:
    'WorkspaceOS — the interactive workspace of Shubham Mali, a software ' +
    'engineer who builds reliable backends, thoughtful frontends, and systems ' +
    'that scale. Boot the machine, explore the room, then step inside.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shubhammali.in',
  links: {
    github: 'https://github.com/sudovex',
    linkedin: 'https://www.linkedin.com/in/shubhammalidev/',
    email: 'mailto:dev.shubham.mali@gmail.com',
  },
} as const;

export type SiteConfig = typeof siteConfig;
