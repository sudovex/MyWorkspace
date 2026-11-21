'use client';

/**
 * The frame every panel opens in: a dimmed, blurred backdrop over the room and
 * a glass sheet that swings in with a little perspective — as if the object
 * you clicked had been lifted toward you.
 *
 * Owns the behaviour all panels share: Esc and backdrop-click close, focus
 * moves into the dialog on open and back to where it was on close, and the
 * entrance waits a beat when a room object opened it so the camera's lean is
 * seen first.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useExperienceStore } from '@/stores/experienceStore';
import { cn } from '@/lib/utils';

interface PanelShellProps {
  label: string;
  children: ReactNode;
  className?: string;
  /** Rendered inside the sheet but outside its scroll area (e.g. a lightbox). */
  overlay?: ReactNode;
  /** Return true to swallow Esc (e.g. to close an inner lightbox first). */
  onEscape?: () => boolean;
  /**
   * Drop the glass sheet entirely — fill, border, close button and the swing-in
   * — and only fade. The child draws and animates its own body: the phone is a
   * device you pick up, not a card.
   */
  bare?: boolean;
}

/** How long the sheet waits for the camera when a room object opened it. */
export const CAMERA_LEAD_S = 0.3;

export function PanelShell({
  label,
  children,
  className,
  overlay,
  onEscape,
  bare = false,
}: PanelShellProps) {
  const close = useExperienceStore((s) => s.closePanel);
  const fromRoom = useExperienceStore((s) => s.panelOrigin !== null);
  const reducedMotion = useReducedMotion();
  // While the exit animation plays the panel is already "closed": it must not
  // swallow clicks meant for the room behind it.
  const isPresent = useIsPresent();
  const sheetRef = useRef<HTMLDivElement>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;
  const isPresentRef = useRef(isPresent);
  isPresentRef.current = isPresent;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      // Once closing, Esc belongs to whatever is underneath (e.g. the terminal).
      if (event.key !== 'Escape' || !isPresentRef.current) return;
      event.stopPropagation();
      if (onEscapeRef.current?.()) return;
      close();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [close]);

  const delay = fromRoom && !reducedMotion ? CAMERA_LEAD_S : 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ perspective: 1800, pointerEvents: isPresent ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] },
      }}
      exit={{ opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
    >
      <div
        className="absolute inset-0 bg-[#04050b]/78 backdrop-blur-[6px]"
        onClick={close}
        aria-hidden
      />
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-full flex-col outline-none',
          !bare &&
            'border-glass-border bg-card w-full overflow-hidden rounded-2xl border shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]',
          className,
        )}
        style={bare ? { transformStyle: 'preserve-3d' } : undefined}
        initial={
          reducedMotion || bare
            ? { opacity: 0 }
            : { opacity: 0, y: 46, scale: 0.9, rotateX: 9, rotateY: -7 }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          rotateY: 0,
          transition: {
            type: 'spring',
            stiffness: 210,
            damping: 26,
            mass: 0.9,
            delay,
            opacity: { duration: 0.25, delay },
          },
        }}
        exit={{
          opacity: 0,
          ...(reducedMotion || bare ? {} : { y: 20, scale: 0.97 }),
          transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        }}
      >
        {/* a hairline of light along the top edge */}
        {!bare && (
          <div
            aria-hidden
            className="via-primary/70 pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
          />
        )}
        {children}
        {!bare && (
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground absolute top-3.5 right-3.5 z-20 grid size-9 cursor-pointer place-items-center rounded-full border border-white/10 bg-black/30 transition-colors hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        )}
        {overlay}
      </motion.div>
    </motion.div>
  );
}
