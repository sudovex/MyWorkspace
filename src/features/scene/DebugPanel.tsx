'use client';

/**
 * Development-only overlay for walking the experience FSM by hand (invaluable
 * for previewing the camera pullback before the M2 boot choreography exists).
 * Rendered only in development or when dev mode is toggled on (M9).
 */
import {
  EXPERIENCE_PHASES,
  PHASE_TRANSITIONS,
  useExperienceStore,
} from '@/stores/experienceStore';
import { type DeviceTier } from '@/hooks/useDeviceTier';
import { cn } from '@/lib/utils';

export function DebugPanel({ tier }: { tier: DeviceTier | null }) {
  const phase = useExperienceStore((s) => s.phase);
  const transition = useExperienceStore((s) => s.transition);
  const reset = useExperienceStore((s) => s.reset);
  const next = PHASE_TRANSITIONS[phase];

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-50 w-64 rounded-lg border border-glass-border bg-card/70 p-3 font-mono text-[11px] backdrop-blur-xl">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="uppercase tracking-[0.2em]">debug</span>
        <span>tier: {tier ?? '…'}</span>
      </div>
      <div className="mt-2 text-primary">phase: {phase}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXPERIENCE_PHASES.map((target) => {
          const allowed = next.includes(target);
          return (
            <button
              key={target}
              type="button"
              disabled={!allowed}
              onClick={() => transition(target)}
              className={cn(
                'rounded border px-1.5 py-0.5 transition-colors',
                allowed
                  ? 'border-primary/40 text-primary hover:bg-primary/10'
                  : 'cursor-not-allowed border-border/40 text-muted-foreground/30',
              )}
            >
              {target}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-2 w-full rounded border border-border py-1 text-muted-foreground hover:text-foreground"
      >
        reset
      </button>
    </div>
  );
}
