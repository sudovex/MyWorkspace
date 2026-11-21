/**
 * Terminal state: the scrollback buffer and command history of the monitor's
 * terminal. The command interpreter itself is pure and lives in
 * `features/os/terminal/commands.ts`; this store only holds what it printed.
 */
import { create } from 'zustand';

export type Tone = 'text' | 'dim' | 'prompt' | 'accent' | 'ok' | 'error' | 'strong';

/** A run of same-styled text within a line. */
export interface Segment {
  text: string;
  tone?: Tone;
  /** Makes the segment a link (opens in a new tab). */
  href?: string;
  /** Makes the segment a button that runs this command. */
  command?: string;
}

export type TerminalEntry =
  /** The echoed prompt + what the visitor typed. */
  | { kind: 'input'; text: string }
  /** One line of output, as styled segments. */
  | { kind: 'line'; segments: readonly Segment[] }
  /** Vertical breathing room. */
  | { kind: 'gap' };

/** `order` is the entry's position within the batch it was printed in. */
export type StoredEntry = TerminalEntry & { id: number; order: number };

interface TerminalState {
  entries: StoredEntry[];
  history: string[];
  /** True once the session banner has been printed. */
  booted: boolean;
}

interface TerminalActions {
  print: (entries: readonly TerminalEntry[]) => void;
  pushHistory: (command: string) => void;
  clear: () => void;
  markBooted: () => void;
  reset: () => void;
}

const INITIAL_STATE: TerminalState = {
  entries: [],
  history: [],
  booted: false,
};

/** Scrollback is capped so a long session can't grow the DOM without bound. */
const MAX_ENTRIES = 600;

let nextId = 1;

export const useTerminalStore = create<TerminalState & TerminalActions>((set) => ({
  ...INITIAL_STATE,

  print: (entries) =>
    set((state) => {
      const stamped = entries.map((entry, order) => {
        const id = nextId;
        nextId += 1;
        return { ...entry, id, order } as StoredEntry;
      });
      const merged = [...state.entries, ...stamped];
      return { entries: merged.slice(Math.max(0, merged.length - MAX_ENTRIES)) };
    }),

  pushHistory: (command) =>
    set((state) =>
      state.history[state.history.length - 1] === command
        ? state
        : { history: [...state.history, command] },
    ),

  clear: () => set({ entries: [] }),

  markBooted: () => set({ booted: true }),

  reset: () => set(INITIAL_STATE),
}));
