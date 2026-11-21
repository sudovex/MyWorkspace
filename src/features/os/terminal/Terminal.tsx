'use client';

/**
 * The monitor's terminal — real DOM, fully keyboard- and pointer-driven.
 *
 * It opens on a banner and one line — "type /help" — and behaves like a
 * terminal from there. Nobody is locked out by the conceit, though: every
 * command `/help` prints (and every command mentioned in any output) is also
 * a button, and touch devices get a quick-command bar above the keyboard.
 *
 * The interpreter is pure (`commands.ts`); this component only renders the
 * scrollback, owns the input line (history, Tab completion, Ctrl+L) and
 * performs the effects a command asks for through the experience store.
 *
 * `/snake` swaps the input line for a game of snake (`../snake/`) until the
 * player quits, then prints the score and hands the prompt back.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { SCREEN_COLORS, TERMINAL_PROMPT, TERMINAL_TITLE } from '@/config/screenTheme';
import { isSoundAudible, useExperienceStore } from '@/stores/experienceStore';
import {
  useTerminalStore,
  type Segment,
  type StoredEntry,
  type Tone,
} from '@/stores/terminalStore';
import { bootEntries, complete, runCommand, type TerminalEffect } from './commands';
import { SnakeGame, type SnakeResult } from '../snake/SnakeGame';

const TONE_COLOR: Record<Tone, string> = {
  text: SCREEN_COLORS.text,
  dim: SCREEN_COLORS.dim,
  prompt: SCREEN_COLORS.prompt,
  accent: SCREEN_COLORS.accent,
  ok: SCREEN_COLORS.ok,
  error: SCREEN_COLORS.error,
  strong: '#ffffff',
};

const QUICK_COMMANDS = [
  'about',
  'resume',
  'experience',
  'projects',
  'skills',
  'gallery',
  'contact',
  'snake',
];

interface TerminalProps {
  /** False on devices with no 3D room — `exit` has nowhere to go. */
  canExit: boolean;
}

function SegmentView({
  segment,
  onRun,
}: {
  segment: Segment;
  onRun: (c: string) => void;
}) {
  const style: CSSProperties = {
    color: TONE_COLOR[segment.tone ?? 'text'],
    fontWeight: segment.tone === 'strong' ? 600 : undefined,
  };
  if (segment.href) {
    return (
      <a
        href={segment.href}
        target="_blank"
        rel="noreferrer"
        style={style}
        className="underline decoration-white/25 underline-offset-[0.25em] hover:decoration-current"
      >
        {segment.text}
      </a>
    );
  }
  if (segment.command) {
    const command = segment.command;
    return (
      <button
        type="button"
        onClick={() => onRun(command)}
        style={style}
        className="cursor-pointer rounded-[0.2em] underline decoration-white/25 underline-offset-[0.25em] hover:bg-white/10 hover:decoration-current"
      >
        {segment.text}
      </button>
    );
  }
  return <span style={style}>{segment.text}</span>;
}

function EntryView({ entry, onRun }: { entry: StoredEntry; onRun: (c: string) => void }) {
  switch (entry.kind) {
    case 'gap':
      return <div className="h-[0.7em]" />;
    case 'input':
      return (
        <div className="whitespace-pre-wrap">
          <span style={{ color: SCREEN_COLORS.prompt }}>{TERMINAL_PROMPT}</span>
          <span style={{ color: SCREEN_COLORS.text }}>{entry.text}</span>
        </div>
      );
    case 'line':
      return (
        <div className="whitespace-pre-wrap">
          {entry.segments.map((segment, i) => (
            <SegmentView key={i} segment={segment} onRun={onRun} />
          ))}
        </div>
      );
  }
}

export function Terminal({ canExit }: TerminalProps) {
  const entries = useTerminalStore((s) => s.entries);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelOpen = useExperienceStore((s) => s.activePanel !== null);
  const [game, setGame] = useState<'snake' | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  const perform = useCallback(
    (effect: TerminalEffect) => {
      const experience = useExperienceStore.getState();
      switch (effect.type) {
        case 'openPanel':
          experience.openPanel(effect.panel, {
            section: effect.section,
            view: effect.view,
            album: effect.album,
          });
          return;
        case 'openUrl':
          window.open(effect.url, '_blank', 'noopener,noreferrer');
          return;
        case 'clear':
          useTerminalStore.getState().clear();
          return;
        case 'toggleLamp':
          experience.toggleLamp();
          return;
        case 'toggleSound':
          experience.toggleSound();
          return;
        case 'startGame':
          setGame(effect.game);
          return;
        case 'exit':
          if (canExit) experience.exitMonitor();
          else {
            useTerminalStore.getState().print([
              {
                kind: 'line',
                segments: [
                  {
                    text: 'This device is running the lightweight edition — there is no room to go back to.',
                    tone: 'dim',
                  },
                ],
              },
            ]);
          }
          return;
      }
    },
    [canExit],
  );

  const execute = useCallback(
    (raw: string) => {
      // the game has the keyboard; links in the scrollback wait their turn
      if (gameRef.current) return;
      const command = raw.trim();
      const terminal = useTerminalStore.getState();
      terminal.print([{ kind: 'input', text: command }]);
      if (command) terminal.pushHistory(command);
      const result = runCommand(command, {
        history: useTerminalStore.getState().history,
        soundPlaying: isSoundAudible(useExperienceStore.getState()),
      });
      // `clear` must wipe the echo too, so apply effects after printing.
      terminal.print(result.entries);
      result.effects.forEach(perform);
      setInput('');
      setHistoryIndex(null);
    },
    [perform],
  );

  // Session banner, once per page load.
  useEffect(() => {
    const terminal = useTerminalStore.getState();
    if (terminal.booted) return;
    terminal.markBooted();
    terminal.print(bootEntries());
  }, []);

  // Keep the newest output in view — but never scroll the command that
  // produced it off the top: long output (like /help) starts at its first
  // line and is read downward, the way a pager would show it.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.clientHeight;
    const echoes = el.querySelectorAll<HTMLElement>('[data-kind="input"]');
    const lastEcho = echoes[echoes.length - 1];
    const top = lastEcho ? lastEcho.offsetTop - el.offsetTop - 8 : bottom;
    el.scrollTop = Math.max(0, Math.min(bottom, top));
  }, [entries]);

  // Take the keyboard when the terminal opens, again when a panel closes,
  // and when a game hands the prompt back.
  useEffect(() => {
    if (!panelOpen && !game) inputRef.current?.focus({ preventScroll: true });
  }, [panelOpen, game]);

  const endGame = useCallback((result: SnakeResult) => {
    setGame(null);
    useTerminalStore.getState().print([
      {
        kind: 'line',
        segments: [
          { text: 'snake', tone: 'accent' },
          { text: '  score ', tone: 'dim' },
          { text: String(result.score), tone: 'strong' },
          { text: '  ·  best ', tone: 'dim' },
          { text: String(result.best), tone: 'strong' },
          ...(result.newBest ? [{ text: '  new best!', tone: 'ok' as const }] : []),
        ],
      },
    ]);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const { history } = useTerminalStore.getState();
    if (event.key === 'Enter') {
      event.preventDefault();
      execute(input);
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const completed = complete(input);
      if (completed) setInput(`${completed} `);
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (history.length === 0) return;
      event.preventDefault();
      const step = event.key === 'ArrowUp' ? -1 : 1;
      const next =
        historyIndex === null
          ? step < 0
            ? history.length - 1
            : null
          : historyIndex + step;
      if (next === null || next >= history.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        const clamped = Math.max(0, next);
        setHistoryIndex(clamped);
        setInput(history[clamped] ?? '');
      }
      return;
    }
    if (event.key.toLowerCase() === 'l' && event.ctrlKey) {
      event.preventDefault();
      useTerminalStore.getState().clear();
      return;
    }
  };

  return (
    <div
      className="flex h-full w-full flex-col font-mono"
      style={{
        background: `radial-gradient(120% 90% at 50% 40%, ${SCREEN_COLORS.backgroundEdge}, ${SCREEN_COLORS.background})`,
        color: SCREEN_COLORS.text,
      }}
      onClick={(event) => {
        // Clicking empty terminal space focuses the prompt — but never steal a
        // text selection or a click on a link/button.
        const target = event.target as HTMLElement;
        if (target.closest('a,button,input')) return;
        if (window.getSelection()?.toString()) return;
        inputRef.current?.focus({ preventScroll: true });
      }}
    >
      {/* window chrome */}
      <div
        className="flex h-[2.3em] shrink-0 items-center gap-[0.55em] px-[0.9em]"
        style={{ backgroundColor: SCREEN_COLORS.chrome }}
      >
        {canExit ? (
          <button
            type="button"
            aria-label="Close terminal and return to the room"
            title="Back to the room (Esc)"
            onClick={() => useExperienceStore.getState().exitMonitor()}
            className="size-[0.72em] cursor-pointer rounded-full bg-[#ff6b6b] transition-transform hover:scale-125"
          />
        ) : (
          <span className="size-[0.72em] rounded-full bg-[#ff6b6b]" />
        )}
        <span className="size-[0.72em] rounded-full bg-[#ffc857]" />
        <span className="size-[0.72em] rounded-full bg-[#5fd38d]" />
        <span
          className="flex-1 text-center text-[0.82em]"
          style={{ color: SCREEN_COLORS.dim }}
        >
          {TERMINAL_TITLE}
        </span>
        {canExit && (
          <button
            type="button"
            onClick={() => useExperienceStore.getState().exitMonitor()}
            className="cursor-pointer rounded-[0.3em] border border-white/15 px-[0.6em] py-[0.1em] text-[0.74em] transition-colors hover:bg-white/10"
            style={{ color: SCREEN_COLORS.dim }}
          >
            esc · back to room
          </button>
        )}
      </div>

      {/* scrollback + prompt */}
      <div
        ref={scrollRef}
        className="terminal-scroll min-h-0 flex-1 overflow-y-auto px-[1.4em] pt-[1em] pb-[0.6em] leading-[1.55]"
      >
        <div role="log" aria-live="polite">
          {entries.map((entry) => (
            <div
              key={entry.id}
              data-kind={entry.kind}
              className="terminal-entry"
              style={{ animationDelay: `${Math.min(entry.order, 36) * 16}ms` }}
            >
              <EntryView entry={entry} onRun={execute} />
            </div>
          ))}
        </div>
        {game === 'snake' && <SnakeGame onExit={endGame} />}
        <label className={game ? 'hidden' : 'mt-[0.2em] flex items-baseline'}>
          <span
            className="shrink-0 whitespace-pre"
            style={{ color: SCREEN_COLORS.prompt }}
          >
            {TERMINAL_PROMPT}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setHistoryIndex(null);
            }}
            onKeyDown={onKeyDown}
            aria-label="Terminal input"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
            style={{
              color: SCREEN_COLORS.text,
              caretColor: SCREEN_COLORS.accent,
              font: 'inherit',
            }}
          />
        </label>
      </div>

      {/* quick commands — touch devices only (see `globals.css`) */}
      <div
        className="terminal-quickbar shrink-0 flex-wrap items-center gap-[0.5em] border-t border-white/[0.07] px-[1.2em] py-[0.6em] text-[0.8em]"
        style={{ backgroundColor: 'rgba(15,23,43,0.7)' }}
      >
        <span style={{ color: SCREEN_COLORS.dim }}>run</span>
        {QUICK_COMMANDS.map((command) => (
          <button
            key={command}
            type="button"
            onClick={() => execute(command)}
            className="cursor-pointer rounded-full border border-white/12 px-[0.85em] py-[0.15em] transition-colors hover:border-[#8fb4ff]/60 hover:bg-[#8fb4ff]/10"
            style={{ color: SCREEN_COLORS.prompt }}
          >
            {command}
          </button>
        ))}
      </div>

      {/* faint scanlines, matching the WebGL idle screen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(0,0,0,0.1) 0, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 4px)',
        }}
      />
    </div>
  );
}
