'use client';

/**
 * The DOM half of the intro: black hold → POST → warm-up → Welcome, played on
 * a boot screen that covers the WebGL canvas, then lifted off the room as the
 * camera begins its push-in. Owns FSM phases `black`, `post`, `booting` and
 * `monitor_on`, and the hand-off into `reveal`.
 *
 * Three edits of the same intro:
 *  - first visit: the full sequence (~4.6s of boot, then the push-in);
 *  - returning visitor (remembered in localStorage): a short black hold, then
 *    straight to the push-in — the boot text is a first-time revelation;
 *  - skip: a click or any key during the intro cuts to the desk. It never
 *    fast-forwards — cutting looks decisive, fast-forwarding looks broken.
 *
 * Timing is driven independently of the WebGL render loop by the pure
 * functions in `bootTimeline.ts` / `welcomeTimeline.ts`. Text appears and
 * clears in hard cuts (terminals don't fade); only the cover itself fades,
 * because that is light, not text.
 */
import { useEffect, useRef, useState } from 'react';
import { INTRO_PHASES, useExperienceStore } from '@/stores/experienceStore';
import {
  BLACK_HOLD_MS,
  POST_PHASE_MS,
  POST_LINES,
  panelColorAt,
  postLinesVisibleAt,
} from './bootTimeline';
import { BOOTING_DURATION_MS } from './lampTimeline';
import {
  WELCOME_LINES,
  PROMPT_TEXT,
  isCursorMounted,
  isCursorVisible,
  isMonitorOnComplete,
} from './welcomeTimeline';
import { RETURNING_BLACK_MS } from '../camera/introTimeline';

const BACKDROP = '#05060a';
const VISITED_KEY = 'workspace-os:visited';
/** The skip hint stays out of the way for the first beat. */
const SKIP_HINT_DELAY_MS = 1500;
/** How long the cover takes to lift off the room once `reveal` begins. */
const LIFT_MS = 1300;
/** …and when the intro is skipped. */
const CUT_MS = 320;
/** Longest the black hold will wait for the scene to warm up. */
const SCENE_WAIT_MAX_MS = 5000;

function hasVisited(): boolean {
  try {
    return window.localStorage.getItem(VISITED_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberVisit(): void {
  try {
    window.localStorage.setItem(VISITED_KEY, '1');
  } catch {
    // Private mode / blocked storage — the long cut simply plays again.
  }
}

export function BootOverlay() {
  const phase = useExperienceStore((s) => s.phase);
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);

  const glowRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [visibleLines, setVisibleLines] = useState(0);
  const [cursorMounted, setCursorMounted] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [skipHint, setSkipHint] = useState(false);
  const [unmounted, setUnmounted] = useState(false);
  const rafRef = useRef<number | null>(null);

  const inIntro = INTRO_PHASES.has(phase);
  const covering =
    phase === 'black' ||
    phase === 'post' ||
    phase === 'booting' ||
    phase === 'monitor_on';

  // Black hold. First visit → POST; returning visitor → straight to the
  // push-in. It also waits for the scene to finish warming up (shaders
  // compiled, first frames drawn) so nothing after it starts on a stutter —
  // but never longer than `SCENE_WAIT_MAX_MS`. Guarded at fire time against a
  // phase change that happened for another reason (reduced motion, skip).
  const sceneReady = useExperienceStore((s) => s.sceneReady);
  const [holdElapsed, setHoldElapsed] = useState(false);
  const [waitExpired, setWaitExpired] = useState(false);

  useEffect(() => {
    if (phase !== 'black' || prefersInstant) return;
    const hold = window.setTimeout(
      () => setHoldElapsed(true),
      hasVisited() ? RETURNING_BLACK_MS : BLACK_HOLD_MS,
    );
    const limit = window.setTimeout(() => setWaitExpired(true), SCENE_WAIT_MAX_MS);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(limit);
    };
  }, [phase, prefersInstant]);

  useEffect(() => {
    if (phase !== 'black' || prefersInstant) return;
    if (!holdElapsed || !(sceneReady || waitExpired)) return;
    const store = useExperienceStore.getState();
    if (store.phase === 'black') store.transition(hasVisited() ? 'reveal' : 'post');
  }, [phase, prefersInstant, holdElapsed, sceneReady, waitExpired]);

  // POST: panel wake → three lines → clear, then hand off to `booting`.
  useEffect(() => {
    if (phase !== 'post') {
      setVisibleLines(0);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const localMs = now - start;
      if (glowRef.current) {
        // The panel model is a colour; the overlay spends it as *light* — the
        // brighter the modelled backlight, the stronger the halo.
        const [r, g, b] = panelColorAt(localMs);
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        glowRef.current.style.opacity = String(Math.min(0.75, 0.12 + luminance * 0.75));
      }
      setVisibleLines((prev) => {
        const next = postLinesVisibleAt(localMs);
        return next === prev ? prev : next;
      });
      if (localMs >= POST_PHASE_MS) {
        const store = useExperienceStore.getState();
        if (store.phase === 'post') store.transition('booting');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  // `booting`: a single hairline of progress while the session comes up.
  useEffect(() => {
    if (phase !== 'booting') return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / BOOTING_DURATION_MS);
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${t})`;
      if (t >= 1) {
        const store = useExperienceStore.getState();
        if (store.phase === 'booting') store.transition('monitor_on');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  // `monitor_on`: Welcome (single frame, no fade) → dead air → cursor prompt,
  // two 530ms blink segments, then hand off to `reveal`.
  useEffect(() => {
    if (phase !== 'monitor_on') {
      setCursorMounted(false);
      setCursorVisible(false);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const localMs = now - start;
      setCursorMounted(isCursorMounted(localMs));
      setCursorVisible(isCursorVisible(localMs));
      if (isMonitorOnComplete(localMs)) {
        const store = useExperienceStore.getState();
        if (store.phase === 'monitor_on') store.transition('reveal');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  // Skip: a click or any key during the intro cuts to the desk.
  useEffect(() => {
    if (!inIntro) {
      setSkipHint(false);
      return;
    }
    const skip = () => useExperienceStore.getState().skipIntro();
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      skip();
    };
    const hintTimer = window.setTimeout(() => setSkipHint(true), SKIP_HINT_DELAY_MS);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', skip);
    return () => {
      window.clearTimeout(hintTimer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', skip);
    };
  }, [inIntro]);

  // Once the visitor has reached the desk, remember it and retire the cover.
  useEffect(() => {
    if (phase !== 'room_idle') return;
    rememberVisit();
    const id = window.setTimeout(() => setUnmounted(true), LIFT_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  if (unmounted || (!inIntro && phase !== 'room_idle')) return null;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
        style={{
          backgroundColor: BACKDROP,
          opacity: covering ? 1 : 0,
          transition: covering
            ? 'none'
            : `opacity ${phase === 'reveal' ? LIFT_MS : CUT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <div
          className="relative overflow-hidden rounded-md border border-white/[0.06]"
          style={{
            aspectRatio: '16 / 9',
            width: 'min(88vw, calc(80vh * 1.7778))',
            backgroundColor: '#070b16',
            visibility: phase === 'black' ? 'hidden' : 'visible',
          }}
        >
          {/* the backlight — `bootTimeline`'s wake overshoot, as a halo */}
          <div
            ref={glowRef}
            className="absolute inset-0"
            style={{
              opacity: 0.75,
              background:
                'radial-gradient(70% 90% at 30% 50%, rgba(86,128,255,0.34), rgba(86,128,255,0) 70%)',
            }}
          />
          {/* faint scanlines, like the monitor it will become */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(0,0,0,0.14) 0, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 4px)',
            }}
          />

          {phase === 'post' && (
            <div className="absolute inset-0 flex flex-col justify-center gap-2 px-[7%] font-mono text-[clamp(0.8rem,1.5vw,1.15rem)] tracking-wide text-[#d7e0f2]">
              {POST_LINES.slice(0, visibleLines).map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}

          {phase === 'booting' && (
            <div className="absolute inset-x-[7%] top-1/2 h-px -translate-y-1/2 bg-white/10">
              <div
                ref={progressRef}
                className="h-full origin-left bg-[#8fb4ff]"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          )}

          {phase === 'monitor_on' && (
            <div className="absolute inset-0 flex flex-col justify-center gap-4 px-[7%]">
              <div className="flex flex-col gap-1">
                <div className="text-[clamp(0.8rem,1.3vw,1rem)] tracking-[0.02em] text-[#7f8db0]">
                  {WELCOME_LINES[0]}
                </div>
                <div className="text-[clamp(1.5rem,3.4vw,2.6rem)] font-semibold tracking-[-0.02em] text-[#eef3ff]">
                  {WELCOME_LINES[1]}
                </div>
              </div>
              {cursorMounted && (
                <div className="font-mono text-[clamp(0.72rem,1.35vw,1rem)] tracking-wide text-[#8fb4ff]">
                  {PROMPT_TEXT}{' '}
                  <span
                    className="text-[#ffb86b]"
                    style={{ visibility: cursorVisible ? 'visible' : 'hidden' }}
                  >
                    █
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {inIntro && skipHint && (
        <div className="pointer-events-none fixed right-5 bottom-5 z-50 font-mono text-[11px] tracking-wide text-white/40">
          click or press any key to skip
        </div>
      )}
    </>
  );
}
