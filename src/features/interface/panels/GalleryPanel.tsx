'use client';

/**
 * The gallery — what the helmet and the shaker open. The part of the room about the
 * person rather than the engineer.
 *
 * Two albums — Rides (the helmet opens it) and Gym (the shaker bottle) —
 * switched with tabs under the title. A bento wall of frames that deal
 * themselves onto the sheet; clicking one lifts it into a lightbox (a shared-layout transition, so the frame itself
 * travels) with captions, a filmstrip and ←/→ navigation.
 *
 * Entries come from `content/gallery.ts`. An entry with a `src` shows that
 * photo; one without shows generated placeholder art and a small "sample" tag,
 * so the wall always looks finished while real photos are pending.
 *
 * Two layouts. An album of portrait photos (phone shots, `aspect < 1`) is a
 * masonry of tall frames in a few different heights, so the photos keep
 * their shape instead of being cropped into landscape tiles; the lightbox
 * then shows each one at its own aspect ratio. Anything else gets the bento.
 */
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { ALBUMS, albumItems, type GalleryItem } from '@/content';
import { useExperienceStore } from '@/stores/experienceStore';
import { GALLERY_ALBUMS, type GalleryAlbum } from '@/types/experience';
import { cn } from '@/lib/utils';
import { PanelShell } from './PanelShell';
import { PlaceholderArt } from './PlaceholderArt';
import { balancedMasonry } from './masonry';

/** Bento rhythm: which cells take two columns / two rows (repeats every 8). */
const SPANS = [
  'col-span-2 row-span-2',
  '',
  'row-span-2',
  '',
  'col-span-2',
  '',
  '',
  'col-span-2',
] as const;

const isPortrait = (item: GalleryItem) => item.aspect !== undefined && item.aspect < 1;

/** Masonry columns for the panel's width: 2 on phones, 3 on tablets, 4 wider. */
function useColumnCount(): number {
  const [count, setCount] = useState(2);
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const medium = window.matchMedia('(min-width: 640px)');
    const update = () => setCount(wide.matches ? 4 : medium.matches ? 3 : 2);
    update();
    wide.addEventListener('change', update);
    medium.addEventListener('change', update);
    return () => {
      wide.removeEventListener('change', update);
      medium.removeEventListener('change', update);
    };
  }, []);
  return count;
}

function Frame({
  item,
  sizes,
  priority = false,
}: {
  item: GalleryItem;
  sizes: string;
  priority?: boolean;
}) {
  if (item.src) {
    return (
      <Image
        src={item.src}
        alt={item.title}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={item.focus ? { objectPosition: item.focus } : undefined}
      />
    );
  }
  return <PlaceholderArt scene={item.placeholder} />;
}

export function GalleryPanel() {
  const [album, setAlbum] = useState<GalleryAlbum>(
    () => useExperienceStore.getState().panelAlbum ?? 'rides',
  );
  const gallery = albumItems(album);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const total = gallery.length;
  const open = openIndex === null ? null : (gallery[openIndex] ?? null);
  const portrait = gallery.length > 0 && gallery.every(isPortrait);
  const columnCount = useColumnCount();
  const columns = balancedMasonry(gallery.length, columnCount);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? current : (current + delta + total) % total,
      ),
    [total],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, step]);

  const lightbox = (
    <AnimatePresence>
      {open && openIndex !== null && (
        <motion.div
          key="lightbox"
          className="absolute inset-0 z-30 flex flex-col bg-[#05060c]/97"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <p className="text-muted-foreground font-mono text-xs tabular-nums">
              {String(openIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </p>
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              aria-label="Close photo"
              className="text-muted-foreground hover:text-foreground grid size-9 cursor-pointer place-items-center rounded-full border border-white/10 transition-colors hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-4 sm:px-16">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 z-10 grid size-11 cursor-pointer place-items-center rounded-full border border-white/10 bg-black/40 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="size-5" />
            </button>
            <motion.div
              layoutId={reducedMotion ? undefined : `frame-${open.id}`}
              className={cn(
                'relative max-h-full overflow-hidden rounded-xl shadow-2xl shadow-black/60',
                isPortrait(open) ? 'h-full max-w-full' : 'aspect-[4/3] w-full max-w-4xl',
              )}
              style={isPortrait(open) ? { aspectRatio: open.aspect } : undefined}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <Frame
                item={open}
                sizes={
                  isPortrait(open)
                    ? '(min-width: 1024px) 28rem, 60vw'
                    : '(min-width: 1024px) 56rem, 92vw'
                }
                priority
              />
            </motion.div>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 z-10 grid size-11 cursor-pointer place-items-center rounded-full border border-white/10 bg-black/40 transition-colors hover:bg-white/10"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <motion.div
            key={open.id}
            className="px-6 pb-3 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-xl font-semibold tracking-tight">{open.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{open.caption}</p>
            <p className="text-muted-foreground/80 mt-1.5 inline-flex items-center gap-1.5 font-mono text-[11px]">
              <MapPin className="size-3" />
              {open.place}
            </p>
          </motion.div>

          {/* filmstrip */}
          <div className="quiet-scroll flex justify-start gap-2 overflow-x-auto px-5 pb-5 sm:justify-center">
            {gallery.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`Show ${item.title}`}
                aria-current={i === openIndex}
                className={cn(
                  'relative shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all',
                  isPortrait(item) ? 'h-14 w-9' : 'h-12 w-16',
                  i === openIndex
                    ? 'border-warm opacity-100'
                    : 'border-transparent opacity-45 hover:opacity-90',
                )}
              >
                <Frame item={item} sizes="4rem" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderTile = (item: GalleryItem, i: number, shape?: number) => (
    <motion.li
      key={item.id}
      className={cn('relative', !shape && SPANS[i % SPANS.length])}
      style={shape ? { aspectRatio: shape } : undefined}
      initial={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 40, scale: 0.86, rotate: i % 2 ? 3.5 : -3.5 }
      }
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 190,
        damping: 21,
        delay: 0.38 + i * 0.07,
      }}
    >
      <button
        type="button"
        onClick={() => setOpenIndex(i)}
        className="group focus-visible:ring-primary relative block size-full cursor-pointer overflow-hidden rounded-xl text-left outline-none focus-visible:ring-2"
      >
        <motion.div
          layoutId={reducedMotion ? undefined : `frame-${item.id}`}
          className="absolute inset-0 overflow-hidden rounded-xl"
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
          <div className="relative size-full transition-transform duration-700 ease-out group-hover:scale-[1.07]">
            <Frame
              item={item}
              sizes={
                portrait
                  ? '(min-width: 1024px) 18rem, (min-width: 640px) 33vw, 50vw'
                  : '(min-width: 768px) 36rem, 50vw'
              }
              priority={i < 4}
            />
          </div>
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        {!item.src && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-black/45 px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] text-white/75 uppercase">
            sample
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-1.5 p-3.5 transition-transform duration-300 group-hover:translate-y-0">
          <p className="text-sm leading-tight font-semibold text-white">{item.title}</p>
          <p className="mt-0.5 font-mono text-[10px] text-white/65">{item.place}</p>
        </div>
      </button>
    </motion.li>
  );

  return (
    <PanelShell
      label="Gallery"
      className="h-full max-w-[72rem] lg:h-[min(50rem,100%)]"
      overlay={lightbox}
      onEscape={() => {
        if (openIndex === null) return false;
        setOpenIndex(null);
        return true;
      }}
    >
      <div className="quiet-scroll min-h-0 flex-1 overflow-y-auto p-6 sm:p-9">
        <header className="flex flex-wrap items-end justify-between gap-4 pr-10">
          <div>
            <p className="text-warm font-mono text-[11px] tracking-[0.28em] uppercase">
              Gallery
            </p>
            <h2 className="mt-2.5 text-[clamp(2rem,4vw,3rem)] leading-none font-semibold tracking-[-0.04em]">
              Off the clock.
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
              {ALBUMS[album].intro}
            </p>
          </div>
          <p className="text-muted-foreground font-mono text-xs tabular-nums">
            {String(total).padStart(2, '0')} frames
          </p>
        </header>

        <div role="tablist" aria-label="Albums" className="mt-6 flex gap-2">
          {GALLERY_ALBUMS.map((id) => {
            const selected = id === album;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                data-album={id}
                onClick={() => {
                  setOpenIndex(null);
                  setAlbum(id);
                }}
                className={cn(
                  'cursor-pointer rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
                  selected
                    ? 'border-warm/50 bg-warm/15 text-warm'
                    : 'text-muted-foreground border-white/10 hover:border-white/25 hover:text-white',
                )}
              >
                {ALBUMS[id].label}
                <span className="ml-2 font-mono text-[10px] opacity-70">
                  {albumItems(id).length}
                </span>
              </button>
            );
          })}
        </div>

        {portrait ? (
          <div key={album} className="mt-6 flex items-start gap-3">
            {columns.map((column, c) => (
              <ul key={c} className="flex min-w-0 flex-1 flex-col gap-3">
                {column.map(({ index, aspect }) => {
                  const item = gallery[index];
                  return item ? renderTile(item, index, aspect) : null;
                })}
              </ul>
            ))}
          </div>
        ) : (
          <ul
            key={album}
            className="mt-6 grid auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[10.5rem] md:grid-cols-4"
          >
            {gallery.map((item, i) => renderTile(item, i))}
          </ul>
        )}
      </div>
    </PanelShell>
  );
}
