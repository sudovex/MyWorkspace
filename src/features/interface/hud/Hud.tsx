'use client';

/**
 * The heads-up layer over the room at rest: who this is (top-left), where and
 * when — and the sound switch — (top-right), and a dock (bottom) that mirrors the room's doorways for
 * anyone who would rather not hunt for them — every object's action is also a
 * button and a key.
 *
 * Two slim tabs on the screen's edges mirror the "look left" move (cursor to
 * the left edge turns the camera to the left wall): one to turn, one to come
 * back. They are the touch and keyboard (`←` / `→`) way to do it.
 *
 * It gets out of the way whenever the visitor is somewhere else: during the
 * intro, inside the monitor, while a panel is open, or under the first-visit
 * guide (which the `?` button brings back).
 *
 * No `backdrop-filter` anywhere in the HUD, on purpose: it sits over a canvas
 * that redraws every frame, and a live backdrop blur would have to be
 * recomputed every one of those frames.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  Images,
  Mail,
  SquareTerminal,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import { profile } from '@/content';
import { useExperienceStore } from '@/stores/experienceStore';

interface DockItem {
  key: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
}

const store = () => useExperienceStore.getState();

const DOCK: readonly DockItem[] = [
  {
    key: 'T',
    label: 'Terminal',
    icon: SquareTerminal,
    run: () => store().enterMonitor(),
  },
  {
    key: 'R',
    label: 'Résumé',
    icon: FileText,
    run: () => store().openPanel('resume', { section: 'summary', origin: 'bookshelf' }),
  },
  {
    key: 'G',
    label: 'Gallery',
    icon: Images,
    run: () => store().openPanel('gallery', { origin: 'helmet' }),
  },
  {
    key: 'C',
    label: 'Contact',
    icon: Mail,
    run: () => store().openPanel('contact', { origin: 'phone' }),
  },
];

function useClock(timeZone: string): string {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 20_000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return '--:--';
  return now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
}

/**
 * The sound switch. Three looks, because "on" is not always audible: browsers
 * hold audio back until the first click or key press on the page.
 */
function SoundButton() {
  const soundOn = useExperienceStore((s) => s.soundOn);
  const unlocked = useExperienceStore((s) => s.soundUnlocked);
  const toggleSound = useExperienceStore((s) => s.toggleSound);

  const playing = soundOn && unlocked;
  const waiting = soundOn && !unlocked;
  const Icon = soundOn ? Volume2 : VolumeX;
  const label = playing ? 'Mute sound' : waiting ? 'Start sound' : 'Unmute sound';

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={label}
      aria-pressed={playing}
      title={`${label} (M)`}
      data-sound={playing ? 'playing' : waiting ? 'waiting' : 'muted'}
      className={`pointer-events-auto flex h-[30px] cursor-pointer items-center gap-2 rounded-full border px-3 font-mono text-[11px] transition-colors ${
        playing
          ? 'border-indigo-300/30 bg-[#161a36]/85 text-white/90 hover:bg-[#1d2247]'
          : 'border-white/12 bg-[#12152a]/80 text-white/60 hover:bg-[#1a1e3a] hover:text-white/90'
      }`}
    >
      <Icon className="size-3.5" />
      {playing ? (
        <span className="flex h-3 items-end gap-[2px]" aria-hidden>
          {[0, 0.3, 0.15, 0.45].map((delay) => (
            <span
              key={delay}
              className="equaliser-bar h-full w-[2px] rounded-full bg-indigo-300"
              style={{ animationDelay: `${delay}s`, animationDuration: '1.4s' }}
            />
          ))}
        </span>
      ) : (
        <span>
          {waiting ? (
            <>
              <span className="sm:hidden">Tap</span>
              <span className="hidden sm:inline">Click for sound</span>
            </>
          ) : (
            'Muted'
          )}
        </span>
      )}
      <kbd className="hidden rounded border border-white/15 px-1 py-px text-[10px] text-white/45 md:inline">
        M
      </kbd>
    </button>
  );
}

/** The edge tab that turns the camera to the left wall, or back to the desk. */
function LookTab({ side }: { side: 'left' | 'right' }) {
  const setRoomView = useExperienceStore((s) => s.setRoomView);
  const toLeft = side === 'left';
  const Icon = toLeft ? ChevronLeft : ChevronRight;
  const label = toLeft ? 'Look at the left wall' : 'Back to the desk';
  return (
    <motion.button
      type="button"
      onClick={() => setRoomView(toLeft ? 'left' : 'desk')}
      aria-label={label}
      title={`${label} (${toLeft ? '←' : '→'})`}
      data-look={side}
      className={`pointer-events-auto absolute top-1/2 flex h-20 w-6 -translate-y-1/2 cursor-pointer items-center justify-center border border-white/12 bg-[#12152a]/70 text-white/55 transition-colors hover:bg-[#1a1e3a] hover:text-white ${
        toLeft ? 'left-0 rounded-r-xl border-l-0' : 'right-0 rounded-l-xl border-r-0'
      }`}
      initial={{ opacity: 0, x: toLeft ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: toLeft ? -10 : 10 }}
      transition={{ duration: 0.35 }}
    >
      <Icon className="size-4" />
    </motion.button>
  );
}

export function Hud() {
  const visible = useExperienceStore(
    (s) => s.phase === 'room_idle' && s.activePanel === null && !s.guideOpen,
  );
  const roomView = useExperienceStore((s) => s.roomView);
  const time = useClock('Asia/Kolkata');

  // The dock's keys. Ignored while typing anywhere or holding a modifier.
  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable]')) return;
      const key = event.key.toUpperCase();
      if (key === 'L') {
        store().toggleLamp();
        return;
      }
      if (key === 'M') {
        store().toggleSound();
        return;
      }
      if (event.key === '?') {
        store().openGuide();
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        store().setRoomView(event.key === 'ArrowLeft' ? 'left' : 'desk');
        return;
      }
      DOCK.find((item) => item.key === key)?.run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hud"
          className="pointer-events-none fixed inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* a little shade so the corners read over the room */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 to-transparent" />

          {/* identity */}
          <motion.div
            className="absolute top-5 left-5 flex items-center gap-3.5 sm:top-7 sm:left-8"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid size-11 place-items-center rounded-xl border border-white/15 bg-[#12152a]/80 text-sm font-semibold tracking-tight">
              {profile.initials}
            </div>
            <div>
              <p className="text-[15px] leading-tight font-semibold tracking-[-0.01em] text-white">
                {profile.name}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-white/60">
                {profile.role} · {profile.company}
              </p>
            </div>
          </motion.div>

          {/* place & time, and the sound switch */}
          <motion.div
            className="absolute top-5 right-5 flex items-center gap-3 sm:top-7 sm:right-8"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="hidden items-center gap-2 rounded-full border border-white/12 bg-[#12152a]/80 px-3 py-1.5 font-mono text-[11px] text-white/75 sm:flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              Available
            </span>
            <span className="hidden font-mono text-[11px] tracking-wide text-white/55 sm:inline">
              PUNE <span className="text-white/85 tabular-nums">{time}</span> IST
            </span>
            <SoundButton />
            <button
              type="button"
              onClick={() => store().openGuide()}
              aria-label="Show the guide"
              title="Show the guide (?)"
              data-guide-button
              className="pointer-events-auto grid size-[30px] cursor-pointer place-items-center rounded-full border border-white/12 bg-[#12152a]/80 text-white/60 transition-colors hover:bg-[#1a1e3a] hover:text-white/90"
            >
              <CircleHelp className="size-3.5" />
            </button>
          </motion.div>

          {/* turn to the left wall / back to the desk */}
          <AnimatePresence mode="wait">
            <LookTab key={roomView} side={roomView === 'desk' ? 'left' : 'right'} />
          </AnimatePresence>

          {/* dock */}
          <motion.div
            className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 sm:bottom-7"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="px-6 text-center font-mono text-[11px] tracking-wide text-white/50">
              {roomView === 'left' ? (
                <>
                  <span className="sm:hidden">tap › to face the desk</span>
                  <span className="hidden sm:inline">
                    move the cursor back to the right — or press → — to face the desk
                  </span>
                </>
              ) : (
                'click anything on the desk — or use the dock'
              )}
            </p>
            <nav
              aria-label="Workspace shortcuts"
              className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/12 bg-[#0b0d18]/88 p-1.5 shadow-2xl shadow-black/50"
            >
              {DOCK.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.run}
                  className="group flex cursor-pointer flex-col items-center gap-1 rounded-xl px-3 py-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white sm:flex-row sm:gap-2.5 sm:px-4 sm:py-2.5"
                >
                  <item.icon className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <span className="text-[11px] font-medium sm:text-[13px]">
                    {item.label}
                  </span>
                  <kbd className="hidden rounded border border-white/15 px-1.5 py-px font-mono text-[10px] text-white/45 md:inline">
                    {item.key}
                  </kbd>
                </button>
              ))}
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
