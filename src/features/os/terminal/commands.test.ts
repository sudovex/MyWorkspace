import { describe, expect, it } from 'vitest';
import {
  COMMAND_NAMES,
  HELP,
  bootEntries,
  complete,
  distance,
  parse,
  runCommand,
  suggest,
  wrap,
} from './commands';
import { type TerminalEntry } from '@/stores/terminalStore';

function text(entries: readonly TerminalEntry[]): string {
  return entries
    .map((entry) => {
      if (entry.kind === 'line') return entry.segments.map((s) => s.text).join('');
      return '';
    })
    .join('\n');
}

describe('parse', () => {
  it('splits a command from its arguments and normalises case/whitespace', () => {
    expect(parse('  Resume   --open ')).toEqual({ name: 'resume', args: ['--open'] });
    expect(parse('')).toEqual({ name: '', args: [] });
  });

  it('treats a leading slash as optional', () => {
    expect(parse('/help')).toEqual({ name: 'help', args: [] });
    expect(parse('/Resume --pdf')).toEqual({ name: 'resume', args: ['--pdf'] });
  });
});

describe('runCommand', () => {
  it('prints nothing for empty input', () => {
    expect(runCommand('   ')).toEqual({ entries: [], effects: [] });
  });

  it('runs the same command with or without the slash', () => {
    for (const name of ['help', 'about', 'skills', 'gallery', 'exit']) {
      expect(runCommand(`/${name}`)).toEqual(runCommand(name));
    }
  });

  it('`/help` lists every advertised command with a description, as a button', () => {
    const { entries, effects } = runCommand('/help');
    expect(effects).toEqual([]);
    const output = text(entries);
    for (const item of HELP) {
      // Everything help advertises must actually exist…
      expect(COMMAND_NAMES).toContain(item.name);
      expect(item.description.length).toBeGreaterThan(3);
      // …and appear as a clickable `/name` that runs itself.
      const row = entries.find(
        (entry) =>
          entry.kind === 'line' && entry.segments[0]?.command === `/${item.name}`,
      );
      expect(row).toBeDefined();
      expect(output).toContain(item.description);
    }
  });

  it('`history` prints what the session has run', () => {
    expect(text(runCommand('history').entries)).toContain('No commands yet');
    const output = text(runCommand('history', { history: ['/help', 'about'] }).entries);
    expect(output).toContain('/help');
    expect(output).toContain('about');
  });

  it('`resume` prints a summary and opens the résumé panel', () => {
    const result = runCommand('resume');
    expect(text(result.entries)).toContain('Shubham Mali');
    expect(result.effects).toEqual([{ type: 'openPanel', panel: 'resume' }]);
  });

  it('`resume --pdf` opens the PDF instead of the panel', () => {
    const [effect] = runCommand('resume --pdf').effects;
    expect(effect?.type).toBe('openUrl');
  });

  it('`gallery` and `contact` open their panels', () => {
    expect(runCommand('gallery').effects).toEqual([
      { type: 'openPanel', panel: 'gallery' },
    ]);
    expect(runCommand('contact').effects).toEqual([
      { type: 'openPanel', panel: 'contact' },
    ]);
  });

  it('`gallery <album>`, `gym` and `ride` open the gallery on an album', () => {
    expect(runCommand('gallery gym').effects).toEqual([
      { type: 'openPanel', panel: 'gallery', album: 'gym' },
    ]);
    expect(runCommand('/gym').effects).toEqual([
      { type: 'openPanel', panel: 'gallery', album: 'gym' },
    ]);
    expect(runCommand('ride').effects).toEqual([
      { type: 'openPanel', panel: 'gallery', album: 'rides' },
    ]);
    const usage = runCommand('gallery cats');
    expect(usage.effects).toEqual([]);
    expect(text(usage.entries)).toContain('usage');
  });

  it('`certificates` lists them and opens the panel; `spotify` opens the phone', () => {
    const certs = runCommand('/certificates');
    expect(text(certs.entries)).toContain('HackerRank');
    expect(certs.effects).toEqual([{ type: 'openPanel', panel: 'certificates' }]);
    expect(runCommand('certs')).toEqual(certs);
    expect(runCommand('spotify').effects).toEqual([
      { type: 'openPanel', panel: 'contact', view: 'spotify' },
    ]);
  });

  it('`sound` flips the ambience and knows which way it is going', () => {
    const toggle = [{ type: 'toggleSound' }];
    const on = runCommand('sound', { soundPlaying: false });
    expect(on.effects).toEqual(toggle);
    expect(text(on.entries)).toContain('Sound on');
    const off = runCommand('/sound', { soundPlaying: true });
    expect(off.effects).toEqual(toggle);
    expect(text(off.entries)).toContain('Muted');
  });

  it('`sound on|off`, `mute` and `unmute` only act when something changes', () => {
    expect(runCommand('sound off', { soundPlaying: true }).effects).toHaveLength(1);
    expect(runCommand('sound off', { soundPlaying: false }).effects).toEqual([]);
    expect(runCommand('sound on', { soundPlaying: true }).effects).toEqual([]);
    expect(runCommand('mute', { soundPlaying: true }).effects).toHaveLength(1);
    expect(runCommand('unmute', { soundPlaying: true }).effects).toEqual([]);
    expect(runCommand('unmute', { soundPlaying: false }).effects).toHaveLength(1);
    const usage = runCommand('sound loud', { soundPlaying: true });
    expect(usage.effects).toEqual([]);
    expect(text(usage.entries)).toContain('usage');
  });

  it('`snake` starts the game', () => {
    const result = runCommand('/snake');
    expect(result.effects).toEqual([{ type: 'startGame', game: 'snake' }]);
    expect(text(result.entries)).toContain('esc');
  });

  it('`exit` and `clear` are pure effects', () => {
    expect(runCommand('exit').effects).toEqual([{ type: 'exit' }]);
    expect(runCommand('clear')).toEqual({ entries: [], effects: [{ type: 'clear' }] });
  });

  it('content commands print without side effects', () => {
    for (const name of [
      'about',
      'experience',
      'projects',
      'skills',
      'education',
      'help',
    ]) {
      const result = runCommand(name);
      expect(result.entries.length).toBeGreaterThan(2);
      expect(result.effects).toEqual([]);
    }
    expect(text(runCommand('experience').entries)).toContain('miniOrange');
    expect(text(runCommand('projects').entries)).toContain('FixMyCode');
  });

  it('only one sudo works', () => {
    expect(runCommand('sudo hire shubham').effects).toEqual([
      { type: 'openPanel', panel: 'contact' },
    ]);
    const denied = runCommand('sudo rm -rf /');
    expect(text(denied.entries)).toContain('Permission denied');
    expect(denied.effects).toEqual([]);
  });

  it('reads the files `ls` advertises', () => {
    expect(text(runCommand('cat focus.txt').entries)).toContain('identity');
    expect(text(runCommand('cat nope.txt').entries)).toContain('No such file');
    expect(text(runCommand('cat').entries)).toContain('usage');
  });

  it('reports unknown commands and suggests a near miss', () => {
    const typo = runCommand('reusme');
    expect(text(typo.entries)).toContain('command not found: reusme');
    expect(text(typo.entries)).toContain('resume');
    expect(text(runCommand('xyzzy-nothing').entries)).toContain('/help');
    expect(text(runCommand('/reusme').entries)).toContain('command not found: reusme');
  });
});

describe('completion helpers', () => {
  it('completes an unambiguous prefix only', () => {
    expect(complete('gal')).toBe('gallery');
    expect(complete('/gal')).toBe('/gallery');
    expect(complete('/')).toBeNull();
    expect(complete('e')).toBeNull(); // echo / education / email / exit / experience
    expect(complete('')).toBeNull();
    expect(complete('resume --o')).toBeNull();
  });

  it('measures edit distance', () => {
    expect(distance('kitten', 'sitting')).toBe(3);
    expect(distance('same', 'same')).toBe(0);
  });

  it('suggests within two edits and not beyond', () => {
    expect(suggest('abuot')).toBe('about');
    expect(suggest('qwertyuiop')).toBeNull();
  });
});

describe('wrap', () => {
  it('never exceeds the width and loses no words', () => {
    const source = 'one two three four five six seven eight nine ten eleven twelve';
    const lines = wrap(source, 16);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(16);
    expect(lines.join(' ')).toBe(source);
  });
});

describe('bootEntries', () => {
  it('opens with the session banner and a single pointer to /help — no menu', () => {
    const entries = bootEntries();
    const output = text(entries);
    expect(output).toContain('WorkspaceOS');
    expect(output).toContain('Type /help to see the available commands.');
    expect(entries.filter((entry) => entry.kind === 'line')).toHaveLength(3);
  });
});
