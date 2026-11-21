'use client';

/**
 * The first-visit guide: one short message in the middle of the screen and an
 * arrow from it to every clickable object in the room. One button — or Enter,
 * Esc, or a click anywhere — clears it and the visitor is at the desk.
 *
 * It appears once, a beat after the camera first settles at the desk, and is
 * remembered in `localStorage` so it never interrupts a returning visitor.
 * The `?` button in the HUD brings it back on demand.
 *
 * Why it exists: the room is the navigation, and a first-time visitor has a
 * few seconds to learn that. The beacons hint at it; this says it outright,
 * once, and then gets out of the way.
 *
 * The arrows' targets come from the scene through the store (`guidePoints`,
 * published by `scene/interaction/GuideProjector`) — this file knows only
 * page pixels. The geometry is in `arrows.ts`.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useExperienceStore } from '@/stores/experienceStore';
import { type HotspotId } from '@/types/experience';
import { guideArrow, headPath, shaftPath, type Rect } from './arrows';

const GUIDED_KEY = 'workspace-os:guided';
/** Let the camera land and the HUD arrive before speaking. */
const OPEN_DELAY_MS = 900;
const STROKE = '#ffd9a0';

/** Also true once shown this session, so storage being blocked cannot loop it. */
let shownThisSession = false;

function alreadyGuided(): boolean {
  if (shownThisSession) return true;
  try {
    return window.localStorage.getItem(GUIDED_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberGuided(): void {
  shownThisSession = true;
  try {
    window.localStorage.setItem(GUIDED_KEY, '1');
  } catch {
    // Private mode: it will simply be shown again next visit.
  }
}

export function Guide() {
  const open = useExperienceStore((s) => s.guideOpen);
  const points = useExperienceStore((s) => s.guidePoints);
  const closeGuide = useExperienceStore((s) => s.closeGuide);
  const atDesk = useExperienceStore(
    (s) => s.phase === 'room_idle' && s.activePanel === null,
  );

  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [card, setCard] = useState<Rect | null>(null);

  // First visit: open once, shortly after arriving at the desk.
  useEffect(() => {
    if (!atDesk || alreadyGuided()) return;
    const id = window.setTimeout(() => {
      if (!alreadyGuided()) useExperienceStore.getState().openGuide();
    }, OPEN_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [atDesk]);

  // However it ends — the button, a key, or the store closing it — it counts.
  useEffect(() => {
    if (!open) return;
    shownThisSession = true;
    return rememberGuided;
  }, [open]);

  // The card's box in page pixels (layout box, so the entrance animation's
  // transform does not skew it).
  const measure = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    setCard({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCard(null);
      return;
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    buttonRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        closeGuide();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeGuide]);

  const arrows = useMemo(() => {
    if (!card || !points) return [];
    return (Object.keys(points) as HotspotId[])
      .map((id) => {
        const target = points[id];
        return target ? { id, target, arrow: guideArrow(card, target) } : null;
      })
      .filter((entry) => entry !== null)
      .sort((a, b) => a.target.x - b.target.x);
  }, [card, points]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="guide"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-title"
          aria-describedby="guide-body"
          data-guide="open"
          onClick={closeGuide}
          className="fixed inset-0 z-40 flex cursor-pointer items-start justify-center px-4 pt-24 [@media(min-aspect-ratio:6/5)]:items-center [@media(min-aspect-ratio:6/5)]:pt-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* dim the room a little so the arrows carry */}
          <div className="absolute inset-0 bg-[#04050c]/50" />

          <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
            {arrows.map(({ id, target, arrow }, i) => (
              <g key={id} data-guide-arrow={arrow ? id : undefined}>
                {arrow && (
                  <>
                    <motion.path
                      d={shaftPath(arrow)}
                      fill="none"
                      stroke={STROKE}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 5px rgba(255,190,110,0.55))' }}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.95 }}
                      transition={{
                        duration: 0.55,
                        delay: 0.25 + i * 0.07,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                    <motion.path
                      d={headPath(arrow)}
                      fill="none"
                      stroke={STROKE}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.95 }}
                      transition={{ duration: 0.2, delay: 0.7 + i * 0.07 }}
                    />
                  </>
                )}
                {/* a ring on the spot itself, arrow or not */}
                <motion.circle
                  cx={target.x}
                  cy={target.y}
                  fill="none"
                  stroke={STROKE}
                  strokeWidth={1.4}
                  initial={{ r: 7, opacity: 0 }}
                  animate={{ r: [7, 15], opacity: [0.9, 0] }}
                  transition={{
                    duration: 1.6,
                    delay: 0.5 + i * 0.07,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <circle cx={target.x} cy={target.y} r={3} fill={STROKE} opacity={0.9} />
              </g>
            ))}
          </svg>

          <motion.div
            ref={cardRef}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[360px] cursor-default rounded-2xl border border-white/14 bg-[#0c0f1f]/95 px-6 py-5 text-center shadow-2xl shadow-black/60"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[10px] tracking-[0.34em] text-amber-200/70 uppercase">
              welcome
            </p>
            <h2
              id="guide-title"
              className="mt-2 text-[19px] leading-snug font-semibold tracking-[-0.01em] text-white"
            >
              Everything on this desk is clickable.
            </h2>
            <p
              id="guide-body"
              className="mt-2 text-[13.5px] leading-relaxed text-white/65"
            >
              Follow an arrow, click, and see what happens. The monitor is a real terminal
              you can type in.
            </p>
            <button
              ref={buttonRef}
              type="button"
              onClick={closeGuide}
              className="group mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-amber-200 px-5 py-2 text-[13px] font-semibold text-[#1a1408] transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-200/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0f1f] focus-visible:outline-none"
            >
              Start exploring
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
            <p className="mt-3 hidden font-mono text-[10px] text-white/35 sm:block">
              or press Enter
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
