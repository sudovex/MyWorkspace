/**
 * The monitor's colours. Shared by the two things that draw on the screen —
 * the WebGL idle terminal (`features/scene`) and the real DOM terminal
 * (`features/os`) — so the hand-off between them is invisible. Lives in
 * `config/` because neither runtime may import from the other.
 */
export const SCREEN_COLORS = {
  background: '#070b16',
  backgroundEdge: '#0c1326',
  chrome: '#0f172b',
  text: '#d7e0f2',
  dim: '#7f8db0',
  prompt: '#8fb4ff',
  accent: '#ffb86b',
  ok: '#7de2a8',
  error: '#ff8f8f',
} as const;

export const TERMINAL_PROMPT = 'shubham@workspace ~ % ';
export const TERMINAL_TITLE = 'shubham@workspace — zsh';
