'use client';

/**
 * The phone — what the phone on the desk opens (and where the dock's Contact,
 * the terminal's `contact` and `sudo hire shubham` end up).
 *
 * Like the monitor, it is a device you use rather than a card you read: the
 * handset is picked up off the desk, shows the same lock screen the 3D phone
 * was showing — time, and a waiting notification — then unlocks onto a home
 * screen where every connection is an app: LinkedIn, GitHub, Instagram and
 * WhatsApp, then Mail, the résumé, the website and Spotify.
 *
 * Spotify is an app *inside* the phone (the headphones on the desk open the
 * phone straight onto it): a profile screen, plus an embedded Spotify player
 * for every playlist listed in `content/profile.ts`. Spotify does not allow a
 * profile page itself to be framed by another site, so the profile is drawn
 * here and the players are Spotify's own embeds.
 *
 * Everything inside is sized in `em` against a font-size tied to the
 * handset's width (container query units), so the phone is the same phone at
 * any viewport size. Links and handles come from `content/profile.ts`.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  BatteryFull,
  ChevronLeft,
  FileText,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Signal,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react';
import { profile } from '@/content';
import { spotifyEmbed } from '@/lib/spotify';
import { useExperienceStore } from '@/stores/experienceStore';
import { type PhoneView } from '@/types/experience';
import { CAMERA_LEAD_S, PanelShell } from './PanelShell';

const EASE = [0.16, 1, 0.3, 1] as const;
/** How long the lock screen holds before the phone unlocks itself. */
const LOCK_HOLD_MS = 1500;

/** The same wallpaper the 3D phone on the desk is painted with. */
const WALLPAPER =
  'radial-gradient(120% 70% at 85% 105%, #c4567a 0%, rgba(196,86,122,0) 60%), ' +
  'radial-gradient(90% 60% at 0% 0%, #2a3a8c 0%, rgba(42,58,140,0) 65%), ' +
  'linear-gradient(160deg, #14173a 0%, #3b2a6b 55%, #7a3f72 100%)';

interface App {
  id: string;
  name: string;
  /** Shown in the connections list under the grid. */
  handle?: string;
  icon: LucideIcon;
  /** CSS background of the icon tile. */
  tile: string;
  href?: string;
  /** Opens in the same tab (mailto) rather than a new one. */
  sameTab?: boolean;
  action?: 'resume' | 'spotify';
}

const { links } = profile;

/** Row one: where to find me. Row two: mail and everything else worth a tap. */
const APPS: readonly App[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: `in/${links.linkedin.handle}`,
    icon: Linkedin,
    tile: '#0a66c2',
    href: links.linkedin.url,
  },
  {
    id: 'github',
    name: 'GitHub',
    handle: `@${links.github.handle}`,
    icon: Github,
    tile: 'linear-gradient(160deg, #3b4252, #15181e)',
    href: links.github.url,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: `@${links.instagram.handle}`,
    icon: Instagram,
    tile: 'linear-gradient(45deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)',
    href: links.instagram.url,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    handle: links.whatsapp.handle,
    icon: MessageCircle,
    tile: 'linear-gradient(180deg, #5fe07a, #1fae4b)',
    href: links.whatsapp.url,
  },
  {
    id: 'mail',
    name: 'Mail',
    handle: links.email.handle,
    icon: Mail,
    tile: 'linear-gradient(180deg, #5ac8fa, #1d6ff2)',
    href: links.email.url,
    sameTab: true,
  },
  {
    id: 'resume',
    name: 'Résumé',
    icon: FileText,
    tile: 'linear-gradient(180deg, #ffb86b, #d2562f)',
    action: 'resume',
  },
  {
    id: 'website',
    name: 'Website',
    icon: Globe,
    tile: 'linear-gradient(180deg, #9db8ff, #5b5bd6)',
    href: profile.website,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: Music2,
    tile: 'linear-gradient(180deg, #2ee06e, #169c46)',
    action: 'spotify',
  },
];

const CONNECTIONS = APPS.filter((app) => app.handle);

function StatusBar({ time }: { time: string }) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[1.9em] pt-[0.95em] text-white">
      <span className="text-[0.95em] font-semibold tabular-nums">{time}</span>
      <span className="flex items-center gap-[0.35em]">
        <Signal className="size-[1em]" strokeWidth={2.6} />
        <Wifi className="size-[1em]" strokeWidth={2.6} />
        <BatteryFull className="size-[1.4em]" strokeWidth={2} />
      </span>
    </div>
  );
}

function AppTile({
  app,
  index,
  onAction,
}: {
  app: App;
  index: number;
  onAction: (action: NonNullable<App['action']>) => void;
}) {
  const tile = (
    <>
      <span
        className="grid size-[3.85em] place-items-center rounded-[1.05em] shadow-[0_0.4em_0.9em_rgba(0,0,0,0.35),inset_0_0.06em_0_rgba(255,255,255,0.35)] transition-transform duration-200 group-hover:scale-[1.08] group-active:scale-95"
        style={{ background: app.tile }}
      >
        <app.icon className="size-[1.95em] text-white" strokeWidth={2} />
      </span>
      <span className="max-w-full truncate text-[0.72em] font-medium text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
        {app.name}
      </span>
    </>
  );
  const className =
    'group flex cursor-pointer flex-col items-center gap-[0.45em] outline-none';

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.4, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 22,
        delay: 0.18 + index * 0.045,
      }}
    >
      {app.href ? (
        <a
          href={app.href}
          target={app.sameTab ? undefined : '_blank'}
          rel={app.sameTab ? undefined : 'noreferrer'}
          aria-label={app.handle ? `${app.name}: ${app.handle}` : app.name}
          className={className}
        >
          {tile}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => app.action && onAction(app.action)}
          className={`${className} w-full`}
        >
          {tile}
        </button>
      )}
    </motion.li>
  );
}

const SPOTIFY_GREEN = '#1ed760';
/** Bar heights (em) and animation offsets (s) of the profile's equaliser. */
const EQUALISER = [
  [2.0, 0],
  [3.0, 0.22],
  [1.6, 0.48],
  [2.6, 0.1],
  [2.1, 0.36],
] as const;

/**
 * Spotify, as an app on the phone: who to follow, a way out to the real
 * thing, and a live Spotify player for each playlist in the content file.
 */
function SpotifyScreen({ onBack }: { onBack: () => void }) {
  const { displayName, profileUrl, playlists } = profile.spotify;
  const players = playlists.flatMap((playlist) => {
    const embed = spotifyEmbed(playlist);
    return embed ? [embed] : [];
  });

  return (
    <motion.div
      className="absolute inset-0 flex flex-col px-[1.25em] pt-[4em] pb-[2.9em] text-white"
      style={{
        background:
          'radial-gradient(120% 55% at 50% 0%, rgba(30,215,96,0.42) 0%, rgba(30,215,96,0) 70%), #0b0c0d',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="-ml-[0.4em] flex cursor-pointer items-center gap-[0.1em] rounded-full py-[0.3em] pr-[0.7em] pl-[0.2em] text-[0.85em] font-medium text-white/85 transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="size-[1.3em]" />
          Home
        </button>
        <span className="flex items-center gap-[0.45em] text-[0.8em] font-semibold tracking-wide">
          <span
            className="grid size-[1.5em] place-items-center rounded-full text-black"
            style={{ background: SPOTIFY_GREEN }}
          >
            <Music2 className="size-[0.9em]" strokeWidth={2.6} />
          </span>
          Spotify
        </span>
      </div>

      <div
        className={`quiet-scroll -mx-[0.3em] flex min-h-0 flex-1 flex-col overflow-y-auto px-[0.3em] ${
          players.length === 0 ? 'justify-center' : 'pt-[1.4em]'
        }`}
      >
        {/* profile */}
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          <span
            className="grid size-[6.4em] place-items-center rounded-full text-[1.1em] font-bold text-black shadow-[0_0.8em_2em_rgba(30,215,96,0.35)]"
            style={{
              background: `linear-gradient(140deg, #7dffa9, ${SPOTIFY_GREEN} 55%, #128a3e)`,
            }}
          >
            <span className="text-[2.6em] leading-none">{displayName.charAt(0)}</span>
          </span>
          <p className="mt-[1.1em] text-[0.68em] font-semibold tracking-[0.22em] text-white/60 uppercase">
            Profile
          </p>
          <h3 className="mt-[0.15em] text-[2.1em] leading-tight font-bold tracking-[-0.03em]">
            {displayName}
          </h3>

          {/* something is always playing */}
          <div aria-hidden className="mt-[0.9em] flex h-[3em] items-end gap-[0.32em]">
            {EQUALISER.map(([height, delay], i) => (
              <span
                key={i}
                className="equaliser-bar w-[0.38em] rounded-full"
                style={{
                  height: `${height}em`,
                  background: SPOTIFY_GREEN,
                  animationDelay: `-${delay}s`,
                }}
              />
            ))}
          </div>

          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="group mt-[1.3em] flex items-center gap-[0.45em] rounded-full px-[1.5em] py-[0.7em] text-[0.9em] font-bold text-black transition-transform hover:scale-[1.04] active:scale-[0.97]"
            style={{ background: SPOTIFY_GREEN }}
          >
            Follow on Spotify
            <ArrowUpRight className="size-[1.1em] transition-transform group-hover:translate-x-[0.12em] group-hover:-translate-y-[0.12em]" />
          </a>
        </motion.div>

        {/* playlists — Spotify's own players, playable right here */}
        {players.length > 0 && (
          <motion.div
            className="mt-[1.6em] flex flex-col gap-[0.7em]"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
          >
            <p className="text-[0.68em] font-semibold tracking-[0.22em] text-white/55 uppercase">
              On repeat
            </p>
            {players.map((player) => (
              <iframe
                key={player.src}
                title={`Spotify ${player.kind}`}
                src={player.src}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="h-[152px] w-full shrink-0 rounded-[12px] border-0"
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function PhonePanel() {
  const close = useExperienceStore((s) => s.closePanel);
  const openPanel = useExperienceStore((s) => s.openPanel);
  const fromRoom = useExperienceStore((s) => s.panelOrigin !== null);
  const reducedMotion = useReducedMotion();
  const lead = fromRoom && !reducedMotion ? CAMERA_LEAD_S : 0;

  const [now] = useState(() => new Date());
  const [unlocked, setUnlocked] = useState(false);
  // The headphones (and the terminal's `spotify`) open the phone on Spotify.
  const [view, setView] = useState<PhoneView>(
    () => useExperienceStore.getState().panelView ?? 'home',
  );

  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // The lock screen is a beat, not a gate: it unlocks itself.
  useEffect(() => {
    if (reducedMotion) {
      setUnlocked(true);
      return;
    }
    const id = window.setTimeout(() => setUnlocked(true), LOCK_HOLD_MS + lead * 1000);
    return () => window.clearTimeout(id);
  }, [reducedMotion, lead]);

  const onAction = (action: NonNullable<App['action']>) => {
    if (action === 'resume') openPanel('resume', { section: 'summary' });
    else setView('spotify');
  };

  /** 1em = 1/24.4 of the handset's width: 16px on a 390px-wide phone. */
  const scale: CSSProperties = { fontSize: '4.1cqw' };

  return (
    <PanelShell label="Phone — contact and social links" bare>
      <div className="flex flex-col items-center gap-4" style={{ perspective: 1600 }}>
        <motion.div
          className="relative"
          style={{
            height: 'min(84dvh, 820px)',
            aspectRatio: '9 / 19.2',
            containerType: 'inline-size',
            transformOrigin: '50% 100%',
          }}
          // Picked up off the desk: it starts low, small, lying back and
          // turned the way the 3D phone lies, and comes upright in the hand.
          initial={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  x: '-55%',
                  y: '46%',
                  scale: 0.32,
                  rotateX: 62,
                  rotateZ: -24,
                }
          }
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotateX: 0,
            rotateZ: 0,
            transition: {
              type: 'spring',
              stiffness: 150,
              damping: 21,
              mass: 1,
              delay: lead,
              opacity: { duration: 0.25, delay: lead },
            },
          }}
          exit={{
            opacity: 0,
            ...(reducedMotion ? {} : { y: '12%', scale: 0.9, rotateX: 18 }),
            transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
          }}
        >
          <div className="size-full" style={scale}>
            {/* side buttons */}
            <span className="absolute top-[22%] -left-[0.16em] h-[2em] w-[0.22em] rounded-l-sm bg-[#2a2c33]" />
            <span className="absolute top-[30%] -left-[0.16em] h-[3.6em] w-[0.22em] rounded-l-sm bg-[#2a2c33]" />
            <span className="absolute top-[28%] -right-[0.16em] h-[5.4em] w-[0.22em] rounded-r-sm bg-[#2a2c33]" />

            {/* body */}
            <div
              className="relative size-full rounded-[3.5em] p-[0.62em] shadow-[0_3em_6em_-1em_rgba(0,0,0,0.9),0_0_0_0.06em_rgba(255,255,255,0.12)]"
              style={{
                background:
                  'linear-gradient(145deg, #4a4d58 0%, #15161b 28%, #0a0b0e 62%, #33353d 100%)',
              }}
            >
              {/* screen */}
              <div
                className="relative size-full overflow-hidden rounded-[2.95em] bg-black"
                style={{ background: WALLPAPER }}
              >
                <StatusBar time={time} />
                {/* dynamic island */}
                <div className="absolute top-[0.72em] left-1/2 z-30 flex h-[1.95em] w-[6.6em] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[0.55em]">
                  <span className="size-[0.62em] rounded-full bg-[#141b33] shadow-[inset_0_0_0.15em_#4a66c8]" />
                </div>

                {/* ------------------------- home screen ------------------------- */}
                {unlocked && view === 'home' && (
                  <div className="absolute inset-0 flex flex-col px-[1.25em] pt-[4.2em] pb-[2.9em]">
                    {/* contact widget */}
                    <motion.section
                      aria-label="Contact"
                      className="rounded-[1.55em] border border-white/15 bg-white/[0.13] p-[1.1em] shadow-[0_0.6em_1.6em_rgba(0,0,0,0.25)]"
                      initial={{ opacity: 0, y: 18, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
                    >
                      <div className="flex items-center gap-[0.85em]">
                        <span
                          className="grid size-[3.1em] shrink-0 place-items-center rounded-full text-[1.05em] font-semibold text-white"
                          style={{
                            background: 'linear-gradient(140deg, #8fb4ff, #6f66ff)',
                          }}
                        >
                          {profile.initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[1.12em] leading-tight font-semibold text-white">
                            {profile.name}
                          </span>
                          <span className="block truncate text-[0.78em] text-white/70">
                            {profile.role} · {profile.company}
                          </span>
                        </span>
                      </div>
                      <p className="mt-[0.9em] flex items-center gap-[0.55em] text-[0.78em] text-white/85">
                        <span className="relative flex size-[0.6em] shrink-0">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                          <span className="relative inline-flex size-[0.6em] rounded-full bg-emerald-400" />
                        </span>
                        {profile.availability}
                      </p>
                      <p className="mt-[0.4em] flex items-center gap-[0.5em] text-[0.72em] text-white/60">
                        <MapPin className="size-[1em] shrink-0" />
                        {profile.location}
                      </p>
                    </motion.section>

                    {/* apps */}
                    <ul className="mt-[1.5em] grid grid-cols-4 gap-x-[0.5em] gap-y-[1.15em]">
                      {APPS.map((app, i) => (
                        <AppTile key={app.id} app={app} index={i} onAction={onAction} />
                      ))}
                    </ul>

                    {/* connections, spelled out */}
                    <motion.section
                      aria-label="Connections"
                      className="mt-[1.25em] overflow-hidden rounded-[1.4em] border border-white/12 bg-black/30"
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: 0.5, ease: EASE }}
                    >
                      {CONNECTIONS.map((app, i) => (
                        <a
                          key={app.id}
                          href={app.href}
                          target={app.sameTab ? undefined : '_blank'}
                          rel={app.sameTab ? undefined : 'noreferrer'}
                          className={`group flex items-center gap-[0.75em] px-[0.95em] py-[0.52em] transition-colors hover:bg-white/10 ${
                            i > 0 ? 'border-t border-white/10' : ''
                          }`}
                        >
                          <span
                            className="grid size-[1.9em] shrink-0 place-items-center rounded-[0.55em]"
                            style={{ background: app.tile }}
                          >
                            <app.icon className="size-[1.05em] text-white" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[0.62em] leading-tight tracking-wide text-white/55 uppercase">
                              {app.name}
                            </span>
                            <span className="block truncate text-[0.82em] leading-tight font-medium text-white">
                              {app.handle}
                            </span>
                          </span>
                          <ArrowUpRight className="size-[0.95em] shrink-0 text-white/45 transition-transform group-hover:translate-x-[0.1em] group-hover:-translate-y-[0.1em] group-hover:text-white" />
                        </a>
                      ))}
                    </motion.section>

                    {/* the one thing to do if you do nothing else */}
                    <motion.a
                      href={links.email.url}
                      className="group mt-auto flex items-center justify-center gap-[0.5em] rounded-full bg-white py-[0.8em] text-[0.92em] font-semibold text-[#14173a] shadow-[0_0.5em_1.4em_rgba(0,0,0,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, delay: 0.62, ease: EASE }}
                    >
                      Say hello
                      <ArrowUpRight className="size-[1.1em] transition-transform group-hover:translate-x-[0.12em] group-hover:-translate-y-[0.12em]" />
                    </motion.a>
                  </div>
                )}

                {/* -------------------------- spotify app ------------------------ */}
                {unlocked && view === 'spotify' && (
                  <SpotifyScreen onBack={() => setView('home')} />
                )}

                {/* ------------------------- lock screen ------------------------- */}
                <AnimatePresence>
                  {!unlocked && (
                    <motion.button
                      key="lock"
                      type="button"
                      onClick={() => setUnlocked(true)}
                      aria-label="Unlock the phone"
                      className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center px-[1.25em] pt-[6.4em] text-white"
                      style={{ background: WALLPAPER }}
                      exit={{ y: '-100%', opacity: 0.4 }}
                      transition={{ duration: 0.6, ease: EASE }}
                    >
                      <span className="text-[1.05em] font-medium text-white/80">
                        {date}
                      </span>
                      <span className="mt-[0.05em] text-[5.4em] leading-none font-semibold tracking-[-0.04em] tabular-nums">
                        {time}
                      </span>
                      <motion.span
                        className="mt-auto mb-[4.4em] block w-full rounded-[1.45em] border border-white/15 bg-white/[0.18] p-[1em] text-left"
                        initial={{ opacity: 0, y: 26, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, delay: lead + 0.45, ease: EASE }}
                      >
                        <span className="flex items-center justify-between text-[0.68em] tracking-wide text-white/60 uppercase">
                          Messages <span className="normal-case">now</span>
                        </span>
                        <span className="mt-[0.3em] block text-[0.95em] font-semibold">
                          {profile.name}
                        </span>
                        <span className="block text-[0.86em] text-white/85">
                          Got a role or a project in mind? Say hello →
                        </span>
                      </motion.span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* home indicator — also "put the phone down" */}
                <button
                  type="button"
                  onClick={close}
                  aria-label="Put the phone down"
                  className="group absolute inset-x-0 bottom-0 z-20 flex h-[1.9em] cursor-pointer items-center justify-center"
                >
                  <span className="h-[0.32em] w-[8.4em] rounded-full bg-white/75 transition-colors group-hover:bg-white" />
                </button>
              </div>
            </div>
          </div>

          {/* a close button beside the handset, where there is room for one */}
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-2 -right-14 hidden size-10 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/50 text-white/70 transition-colors hover:bg-white/15 hover:text-white sm:grid"
          >
            <X className="size-4" />
          </button>
        </motion.div>

        <motion.p
          className="font-mono text-[11px] tracking-wide text-white/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: lead + 0.9, duration: 0.5 }}
        >
          tap an app · esc to put the phone down
        </motion.p>
      </div>
    </PanelShell>
  );
}
