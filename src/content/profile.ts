/**
 * Who the workspace belongs to. Single source for the HUD, the résumé panel,
 * the terminal (`whoami`, `contact`) and the SEO fallback.
 *
 * Edit freely — nothing else needs to change when these values do.
 */
export const profile = {
  name: 'Shubham Mali',
  initials: 'SM',
  role: 'Software Engineer',
  company: 'miniOrange',
  tagline: 'Backend · Identity & Security · Full-stack',
  location: 'Pune, Maharashtra, India',
  availability: 'Open to freelance projects & collaborations',
  summary:
    'Software engineer with two years of experience building secure, scalable ' +
    'software end-to-end. I work mostly on the backend and on identity — ' +
    'OAuth 2.0, OpenID Connect, SAML and single sign-on — and I ship SDKs ' +
    'that other developers install from Composer, npm, Maven and JitPack. ' +
    'Comfortable across the stack: React and Next.js up front, Node.js and ' +
    'Java behind, REST APIs and cloud integrations in between.',
  /** The PDF served by the current portfolio site. */
  resumeUrl: 'https://shubhammali.in/resume.pdf',
  website: 'https://shubhammali.in',
  links: {
    github: {
      label: 'GitHub',
      handle: 'sudovex',
      url: 'https://github.com/sudovex',
    },
    linkedin: {
      label: 'LinkedIn',
      handle: 'shubhammalidev',
      url: 'https://www.linkedin.com/in/shubhammalidev/',
    },
    email: {
      label: 'Email',
      handle: 'dev.shubham.mali@gmail.com',
      url: 'mailto:dev.shubham.mali@gmail.com',
    },
    instagram: {
      label: 'Instagram',
      handle: 'shubx404',
      url: 'https://www.instagram.com/shubx404/',
    },
    whatsapp: {
      label: 'WhatsApp',
      handle: '+91 84210 75337',
      url: 'https://wa.me/918421075337',
    },
    hackerrank: {
      label: 'HackerRank',
      handle: 'shubhammali929',
      url: 'https://www.hackerrank.com/profile/shubhammali929',
    },
    coffee: {
      label: 'Buy me a coffee',
      handle: 'shubhammali',
      url: 'https://buymeacoffee.com/shubhammali',
    },
  },
  /**
   * The Spotify app inside the phone (what the headphones open).
   *
   * Spotify does not allow a profile page to be shown inside another site, so
   * the phone shows a profile screen built from these values. To have music
   * play inside the phone, paste public playlist (or album / artist / track)
   * links into `playlists` — each becomes an embedded Spotify player, e.g.
   *   playlists: ['https://open.spotify.com/playlist/XXXXXXXXXXXXXXXXXXXXXX'],
   */
  spotify: {
    displayName: 'Shubham',
    profileUrl: 'https://open.spotify.com/user/31ath5gizh7mab46rhs533uxuv5y',
    playlists: [] as readonly string[],
  },
  /** Headline numbers for the résumé's animated counters. */
  stats: [
    { value: 2, suffix: '+', label: 'years shipping production code' },
    { value: 4, suffix: '', label: 'package registries published to' },
    { value: 18, suffix: '', label: 'technologies in the toolbox' },
    { value: 6, suffix: '', label: 'certifications' },
  ],
} as const;

export type Profile = typeof profile;
