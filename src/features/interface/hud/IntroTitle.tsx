'use client';

/**
 * The title card that plays over the camera's push-in: the name rises into
 * the lower third letter by letter as the room approaches, holds, and clears
 * as the camera settles — a film's opening title, not a splash screen.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { profile } from '@/content';
import { useExperienceStore } from '@/stores/experienceStore';

const LETTER_STAGGER_S = 0.045;
const START_DELAY_S = 0.7;

export function IntroTitle() {
  const playing = useExperienceStore((s) => s.phase === 'reveal');
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  const letters = [...profile.name];

  return (
    <AnimatePresence>
      {playing && (
        <motion.div
          key="intro-title"
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-[14%] z-20 flex flex-col items-center px-6 text-center"
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.p
            className="font-mono text-[11px] tracking-[0.5em] text-white/60 uppercase"
            initial={{ opacity: 0, letterSpacing: '0.9em' }}
            animate={{ opacity: 1, letterSpacing: '0.5em' }}
            transition={{ duration: 1.4, delay: START_DELAY_S, ease: [0.16, 1, 0.3, 1] }}
          >
            the workspace of
          </motion.p>
          <h1 className="mt-3 flex overflow-hidden text-[clamp(2.6rem,8vw,6.5rem)] leading-none font-semibold tracking-[-0.05em] text-white [text-shadow:0_4px_40px_rgba(0,0,0,0.7)]">
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block whitespace-pre"
                initial={{ y: '105%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.9,
                  delay: START_DELAY_S + 0.25 + i * LETTER_STAGGER_S,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="text-warm mt-4 font-mono text-xs tracking-[0.2em] uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: START_DELAY_S + 1.1 }}
          >
            {profile.tagline}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
