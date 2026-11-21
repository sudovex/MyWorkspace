/**
 * The terminal's command interpreter — pure and framework-free.
 *
 * `runCommand(input)` returns what to print plus a list of side effects for
 * the caller to perform (open a panel, leave the monitor, open a link…). It
 * never touches a store or the DOM itself, which is what makes every command
 * unit-testable.
 *
 * Commands may be typed bare (`resume`) or with a leading slash (`/resume`);
 * the session opens with a single pointer to `/help`, which lists every
 * command with a one-line description.
 */
import {
  certifications,
  education,
  experience,
  mugFacts,
  profile,
  projects,
  skills,
} from '@/content';
import { siteConfig } from '@/config/site';
import { type Segment, type TerminalEntry } from '@/stores/terminalStore';
import {
  GALLERY_ALBUMS,
  type GalleryAlbum,
  type PanelId,
  type PhoneView,
  type ResumeSectionId,
} from '@/types/experience';

export type TerminalEffect =
  | {
      type: 'openPanel';
      panel: PanelId;
      section?: ResumeSectionId;
      view?: PhoneView;
      album?: GalleryAlbum;
    }
  | { type: 'openUrl'; url: string }
  | { type: 'exit' }
  | { type: 'clear' }
  | { type: 'toggleLamp' }
  | { type: 'toggleSound' }
  | { type: 'startGame'; game: 'snake' };

export interface CommandResult {
  entries: TerminalEntry[];
  effects: TerminalEffect[];
}

/* ------------------------------ print helpers ---------------------------- */

const line = (...segments: (Segment | string)[]): TerminalEntry => ({
  kind: 'line',
  segments: segments.map((s) => (typeof s === 'string' ? { text: s } : s)),
});
const dim = (text: string): Segment => ({ text, tone: 'dim' });
const strong = (text: string): Segment => ({ text, tone: 'strong' });
const accent = (text: string): Segment => ({ text, tone: 'accent' });
const ok = (text: string): Segment => ({ text, tone: 'ok' });
const link = (text: string, href: string): Segment => ({ text, href, tone: 'prompt' });
const run = (text: string, command: string): Segment => ({
  text,
  command,
  tone: 'prompt',
});
const gap: TerminalEntry = { kind: 'gap' };

const heading = (title: string): TerminalEntry[] => [
  line(accent(`▍ ${title.toUpperCase()}`)),
  gap,
];

/* --------------------------------- boot ---------------------------------- */

/** Printed once, when the session opens. */
export function bootEntries(): TerminalEntry[] {
  return [
    line(
      strong(`${siteConfig.osName} ${siteConfig.osVersion}`),
      dim('  —  developer session'),
    ),
    line(dim(`Logged in as ${profile.name} · ${profile.role} · ${profile.location}`)),
    gap,
    line('Type ', run('/help', '/help'), ' to see the available commands.'),
  ];
}

/* ------------------------------- commands -------------------------------- */

/** What a command may know about the session it runs in. */
export interface CommandContext {
  /** Previously entered commands, oldest first. */
  history?: readonly string[];
  /** Whether the room's ambience is currently audible. */
  soundPlaying?: boolean;
}

type Handler = (args: string[], context: CommandContext) => CommandResult;

const print = (
  entries: TerminalEntry[],
  effects: TerminalEffect[] = [],
): CommandResult => ({
  entries,
  effects,
});

function about(): CommandResult {
  return print([
    ...heading('about'),
    line(strong(profile.name), dim(`  ·  ${profile.role} @ ${profile.company}`)),
    line(dim(profile.tagline)),
    gap,
    ...wrap(profile.summary, 78).map((text) => line(text)),
    gap,
    line(ok('● '), profile.availability),
    gap,
    line(
      dim('next: '),
      run('experience', 'experience'),
      dim(' · '),
      run('projects', 'projects'),
      dim(' · '),
      run('contact', 'contact'),
    ),
  ]);
}

function experienceCommand(): CommandResult {
  const entries: TerminalEntry[] = [...heading('experience')];
  for (const job of experience) {
    entries.push(
      line(strong(job.title), dim('  @ '), accent(job.company)),
      line(dim(`${job.start} — ${job.end}  ·  ${job.location}`)),
    );
    for (const bullet of job.bullets) {
      wrap(bullet, 74).forEach((text, i) =>
        entries.push(line(dim(i === 0 ? '  • ' : '    '), text)),
      );
    }
    entries.push(line(dim(`  ${job.tags.join(' · ')}`)), gap);
  }
  entries.push(
    line(dim('see it as a timeline: '), run('resume --open', 'resume --open')),
  );
  return print(entries);
}

function projectsCommand(): CommandResult {
  const entries: TerminalEntry[] = [...heading('projects')];
  projects.forEach((project, i) => {
    entries.push(
      line(dim(`0${i + 1}  `), strong(project.name), dim(`  —  ${project.blurb}`)),
      ...wrap(project.description, 72).map((text) => line(dim('    '), text)),
      line(dim('    '), ok(project.stack.join(' · '))),
      line(
        dim('    '),
        ...project.links.flatMap((l, j) => [
          ...(j > 0 ? [dim('   ')] : []),
          link(`${l.label} ↗`, l.url),
        ]),
      ),
      gap,
    );
  });
  return print(entries);
}

function skillsCommand(): CommandResult {
  const width = Math.max(...skills.map((g) => g.label.length));
  return print([
    ...heading('skills'),
    ...skills.map((group) =>
      line(accent(group.label.padEnd(width + 2)), group.items.join(' · ')),
    ),
  ]);
}

function educationCommand(): CommandResult {
  const entries: TerminalEntry[] = [...heading('education')];
  for (const entry of education) {
    entries.push(
      line(strong(entry.degree)),
      line(dim(`${entry.school}  ·  ${entry.period}`)),
      gap,
    );
  }
  entries.push(...heading('certifications'));
  for (const cert of certifications) {
    entries.push(
      line(
        dim(`${cert.issuer.padEnd(11)}`),
        cert.name,
        dim('  '),
        link('verify ↗', cert.url),
      ),
    );
  }
  return print(entries);
}

function certificatesCommand(): CommandResult {
  return print(
    [
      ...heading('certificates'),
      ...certifications.map((cert) =>
        line(
          dim(cert.issuer.padEnd(11)),
          cert.name,
          dim('  '),
          link('verify ↗', cert.url),
        ),
      ),
      gap,
      line(ok('Opening the certificates…')),
    ],
    [{ type: 'openPanel', panel: 'certificates' }],
  );
}

function contactCommand(): CommandResult {
  const { links } = profile;
  const row = (label: string, value: string, href: string) =>
    line(dim(label.padEnd(10)), link(value, href));
  return print(
    [
      ...heading('contact'),
      row('email', links.email.handle, links.email.url),
      row('linkedin', `in/${links.linkedin.handle}`, links.linkedin.url),
      row('github', links.github.handle, links.github.url),
      row('instagram', `@${links.instagram.handle}`, links.instagram.url),
      row('whatsapp', links.whatsapp.handle, links.whatsapp.url),
      row('web', profile.website.replace('https://', ''), profile.website),
      gap,
      line(ok('● '), profile.availability),
    ],
    [{ type: 'openPanel', panel: 'contact' }],
  );
}

function resumeCommand(args: string[]): CommandResult {
  if (args.includes('--pdf')) {
    return print(
      [line(ok('Opening the PDF in a new tab…'))],
      [{ type: 'openUrl', url: profile.resumeUrl }],
    );
  }
  if (args.includes('--open')) {
    return print(
      [line(ok('Opening the résumé…'))],
      [{ type: 'openPanel', panel: 'resume' }],
    );
  }
  const entries: TerminalEntry[] = [
    ...heading('résumé'),
    line(strong(profile.name), dim(`  ·  ${profile.role}  ·  ${profile.location}`)),
    gap,
  ];
  for (const job of experience) {
    entries.push(
      line(accent(job.period.padEnd(13)), strong(job.title), dim(`  ${job.company}`)),
    );
  }
  for (const entry of education) {
    entries.push(line(accent(entry.period.padEnd(13)), entry.degree));
  }
  entries.push(
    gap,
    line(
      dim('stack   '),
      skills
        .flatMap((g) => g.items.slice(0, 3))
        .slice(0, 9)
        .join(' · '),
    ),
    gap,
    line(
      ok('Opening the full résumé…  '),
      dim('(also: '),
      run('resume --pdf', 'resume --pdf'),
      dim(')'),
    ),
  );
  return print(entries, [{ type: 'openPanel', panel: 'resume' }]);
}

function neofetch(): CommandResult {
  const art = [
    '  ╭──────────╮',
    '  │  ▟█▙ ▟▙▟▙ │',
    '  │  ▜█▛ █▜▛█ │',
    '  ╰──────────╯',
    '     ▔▔▔▔▔▔   ',
  ];
  const info: [string, string][] = [
    ['user', `${profile.name.toLowerCase().replace(' ', '.')}@workspace`],
    ['os', `${siteConfig.osName} ${siteConfig.osVersion}`],
    ['role', `${profile.role} @ ${profile.company}`],
    ['focus', 'backend · identity · security'],
    ['shell', 'zsh (portfolio edition)'],
  ];
  return print([
    ...art.map((row, i) => {
      const pair = info[i];
      return pair
        ? line(accent(row), dim('   '), accent(pair[0].padEnd(7)), pair[1])
        : line(accent(row));
    }),
  ]);
}

let coffeeIndex = 0;

const FILES: Record<string, Handler> = {
  'resume.pdf': () => resumeCommand(['--pdf']),
  'contact.txt': contactCommand,
  'focus.txt': () =>
    print([line('backend · identity & security · OAuth 2.0 / OIDC / SAML / SSO')]),
};

/**
 * Every command `/help` lists, in the order it lists them. Aliases (`cv`,
 * `work`, `stack`, `certs`, `quit`, …) work but are not advertised.
 */
export const HELP: readonly { name: string; description: string }[] = [
  { name: 'about', description: 'who I am, in a paragraph' },
  { name: 'resume', description: 'view the résumé  (--open full view · --pdf download)' },
  { name: 'experience', description: "where I've worked" },
  { name: 'projects', description: "things I've built" },
  { name: 'skills', description: 'the toolbox' },
  { name: 'education', description: 'degrees & certifications' },
  { name: 'certificates', description: 'open all my certificates' },
  { name: 'gallery', description: 'photos — off the clock  (gallery gym)' },
  { name: 'gym', description: 'gym photos' },
  { name: 'contact', description: 'pick up the phone — every way to reach me' },
  { name: 'github', description: 'open my GitHub profile' },
  { name: 'linkedin', description: 'open my LinkedIn profile' },
  { name: 'instagram', description: 'open my Instagram' },
  { name: 'whatsapp', description: 'message me on WhatsApp' },
  { name: 'spotify', description: 'what I listen to' },
  { name: 'email', description: 'start an email to me' },
  { name: 'whoami', description: 'one line about me' },
  { name: 'neofetch', description: 'system info' },
  { name: 'ls', description: 'list files in the workspace' },
  { name: 'cat', description: 'print a file  (cat focus.txt)' },
  { name: 'date', description: 'current date and time' },
  { name: 'echo', description: 'print some text' },
  { name: 'history', description: 'commands you have run' },
  { name: 'lamp', description: 'flip the desk lamp' },
  { name: 'sound', description: 'mute / unmute the rain and music  (sound off)' },
  { name: 'coffee', description: 'take a sip' },
  { name: 'snake', description: 'play snake  (arrows / WASD, esc to quit)' },
  { name: 'sudo', description: 'try: sudo hire shubham' },
  { name: 'clear', description: 'clear the screen' },
  { name: 'help', description: 'show this list' },
  { name: 'exit', description: 'back to the room' },
];

/** `sound` flips the ambience; `sound on` / `sound off` set it. */
function sound(args: string[], context: CommandContext): CommandResult {
  const playing = context.soundPlaying ?? false;
  const wanted = args[0]?.toLowerCase();
  if (wanted !== undefined && wanted !== 'on' && wanted !== 'off') {
    return print([line(dim('usage: '), 'sound', dim(' [on|off]'))]);
  }
  const next = wanted === undefined ? !playing : wanted === 'on';
  if (next === playing) {
    return print([line(dim(playing ? 'Already playing.' : 'Already muted.'))]);
  }
  return print(
    [
      next
        ? line(ok('♪ Sound on.'), dim('  rain on the window, slow keys'))
        : line(ok('Muted.'), dim('  type /sound to bring it back')),
    ],
    [{ type: 'toggleSound' }],
  );
}

function help(): CommandResult {
  const width = Math.max(...HELP.map((item) => item.name.length)) + 4;
  return print([
    ...heading('available commands'),
    ...HELP.map((item) => {
      const name = `/${item.name}`;
      return line(
        run(name, name),
        ' '.repeat(width - name.length),
        dim(item.description),
      );
    }),
    gap,
    line(
      dim(
        'Click a command or type it (the slash is optional). Tab completes · ↑ recalls · Esc leaves.',
      ),
    ),
  ]);
}

const COMMANDS: Record<string, Handler> = {
  help,
  about,
  whoami: () => print([line(`${profile.name} — ${profile.role} @ ${profile.company}`)]),
  resume: resumeCommand,
  cv: resumeCommand,
  experience: experienceCommand,
  work: experienceCommand,
  projects: projectsCommand,
  skills: skillsCommand,
  stack: skillsCommand,
  education: educationCommand,
  certificates: certificatesCommand,
  certifications: certificatesCommand,
  certs: certificatesCommand,
  contact: contactCommand,
  email: () =>
    print(
      [line(ok('Opening your mail client…'))],
      [{ type: 'openUrl', url: profile.links.email.url }],
    ),
  github: () =>
    print(
      [line(ok('Opening GitHub…'))],
      [{ type: 'openUrl', url: profile.links.github.url }],
    ),
  linkedin: () =>
    print(
      [line(ok('Opening LinkedIn…'))],
      [{ type: 'openUrl', url: profile.links.linkedin.url }],
    ),
  instagram: () =>
    print(
      [line(ok('Opening Instagram…'))],
      [{ type: 'openUrl', url: profile.links.instagram.url }],
    ),
  whatsapp: () =>
    print(
      [line(ok('Opening WhatsApp…'))],
      [{ type: 'openUrl', url: profile.links.whatsapp.url }],
    ),
  spotify: () =>
    print(
      [line(ok('Opening Spotify on the phone…'))],
      [{ type: 'openPanel', panel: 'contact', view: 'spotify' }],
    ),
  gallery: (args) => {
    const wanted = args[0]?.toLowerCase();
    if (wanted === undefined) {
      return print(
        [line(ok('Opening the gallery…'))],
        [{ type: 'openPanel', panel: 'gallery' }],
      );
    }
    const album = GALLERY_ALBUMS.find((id) => id === wanted);
    if (!album) {
      return print([
        line(dim('usage: '), 'gallery', dim(` [${GALLERY_ALBUMS.join('|')}]`)),
      ]);
    }
    return print(
      [line(ok(`Opening the ${album} album…`))],
      [{ type: 'openPanel', panel: 'gallery', album }],
    );
  },
  gym: () =>
    print(
      [line(ok('Grabbing the shaker. Opening the gym album…'))],
      [{ type: 'openPanel', panel: 'gallery', album: 'gym' }],
    ),
  ride: () =>
    print(
      [line(ok('Helmet on. Opening the gallery…'))],
      [{ type: 'openPanel', panel: 'gallery', album: 'rides' }],
    ),
  neofetch,
  lamp: () =>
    print(
      [line(ok('Click.'), dim('  (look at the room when you leave)'))],
      [{ type: 'toggleLamp' }],
    ),
  sound,
  mute: (_args, context) => sound(['off'], context),
  unmute: (_args, context) => sound(['on'], context),
  snake: () =>
    print(
      [
        line(
          ok('Starting snake…'),
          dim('  arrows / WASD to steer · space pauses · esc quits'),
        ),
      ],
      [{ type: 'startGame', game: 'snake' }],
    ),
  coffee: () => {
    const fact = mugFacts[coffeeIndex % mugFacts.length] ?? '';
    coffeeIndex += 1;
    return print([line(accent('☕ '), fact)]);
  },
  date: () => print([line(new Date().toString())]),
  pwd: () => print([line('/home/shubham/workspace')]),
  ls: () =>
    print([
      line(
        ok('experience/  projects/  gallery/  '),
        'resume.pdf  contact.txt  focus.txt',
      ),
    ]),
  cat: (args) => {
    const name = args[0];
    if (!name) return print([line({ text: 'usage: cat <file>', tone: 'error' })]);
    const handler = FILES[name];
    if (handler) return handler([], {});
    return print([
      line({ text: `cat: ${name}: No such file or directory`, tone: 'error' }),
    ]);
  },
  cd: (args) => {
    const target = (args[0] ?? '').replace(/\/$/, '');
    const handler = target ? COMMANDS[target] : undefined;
    if (handler && ['experience', 'projects', 'gallery'].includes(target))
      return handler([], {});
    return print([
      line(dim('There is only one room here. Try '), run('ls', 'ls'), dim('.')),
    ]);
  },
  echo: (args) => print([line(args.join(' '))]),
  history: (_args, context) => {
    const entries = context.history ?? [];
    if (entries.length === 0) return print([line(dim('No commands yet.'))]);
    return print(
      entries.map((command, i) => line(dim(`${String(i + 1).padStart(3)}  `), command)),
    );
  },
  clear: () => print([], [{ type: 'clear' }]),
  exit: () => print([line(dim('Leaving the session…'))], [{ type: 'exit' }]),
  quit: () => print([line(dim('Leaving the session…'))], [{ type: 'exit' }]),
  sudo: (args) => {
    if (args.join(' ').toLowerCase() === 'hire shubham') {
      return print(
        [
          line(dim('[sudo] password for recruiter: '), '••••••••'),
          line(ok('✓ '), 'credentials accepted'),
          line(ok('✓ '), 'checking availability… ', accent(profile.availability)),
          line(ok('✓ '), 'drafting offer letter… ', dim('(you finish this part)')),
          gap,
          line('Opening a direct line.'),
        ],
        [{ type: 'openPanel', panel: 'contact' }],
      );
    }
    return print([
      line(
        { text: 'Permission denied.', tone: 'error' },
        dim('  The only sudo that works here is '),
        run('sudo hire shubham', 'sudo hire shubham'),
      ),
    ]);
  },
};

/** Every top-level command name, for Tab completion. */
export const COMMAND_NAMES: readonly string[] = Object.keys(COMMANDS).sort();

/**
 * Split into command + args, collapsing whitespace. A leading slash on the
 * command is optional and ignored: `/help` and `help` are the same command.
 */
export function parse(input: string): { name: string; args: string[] } {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  const name = (parts[0] ?? '').toLowerCase().replace(/^\/+/, '');
  return { name, args: parts.slice(1) };
}

/** Edit distance, for "did you mean". Small inputs only. */
export function distance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table: number[] = Array.from({ length: rows * cols }, () => 0);
  const at = (i: number, j: number) => table[i * cols + j] ?? 0;
  for (let i = 0; i < rows; i += 1) table[i * cols] = i;
  for (let j = 0; j < cols; j += 1) table[j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      table[i * cols + j] = Math.min(
        at(i - 1, j) + 1,
        at(i, j - 1) + 1,
        at(i - 1, j - 1) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return at(rows - 1, cols - 1);
}

export function suggest(name: string): string | null {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of COMMAND_NAMES) {
    const d = distance(name, candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return bestDistance <= 2 ? best : null;
}

/**
 * Complete a partially typed command name, keeping a leading slash if one was
 * typed. Returns `null` if nothing or more than one command matches.
 */
export function complete(partial: string): string | null {
  const typed = partial.trim().toLowerCase();
  const slash = typed.startsWith('/') ? '/' : '';
  const needle = typed.replace(/^\/+/, '');
  if (!needle || needle.includes(' ')) return null;
  const matches = COMMAND_NAMES.filter((name) => name.startsWith(needle));
  return matches.length === 1 ? `${slash}${matches[0] ?? ''}` : null;
}

export function runCommand(input: string, context: CommandContext = {}): CommandResult {
  const { name, args } = parse(input);
  if (!name) return { entries: [], effects: [] };

  const handler = COMMANDS[name];
  if (handler) return handler(args, context);

  const guess = suggest(name);
  return print([
    line(
      { text: `zsh: command not found: ${name}`, tone: 'error' },
      ...(guess
        ? [dim('  — did you mean '), run(`/${guess}`, `/${guess}`), dim('?')]
        : [dim('  — type '), run('/help', '/help'), dim(' to see what is available')]),
    ),
  ]);
}

/* -------------------------------- utilities ------------------------------ */

/** Greedy word wrap to `width` columns. */
export function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    if (current && current.length + 1 + word.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
