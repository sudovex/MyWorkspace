'use client';

/**
 * The label that rides beside the cursor when it is over a room object: the
 * object's name and what clicking it does. Positioned by writing a transform
 * straight to the element on pointer move — no React render per mouse event.
 */
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useExperienceStore } from '@/stores/experienceStore';

const OFFSET = { x: 18, y: 20 } as const;

export function HoverLabel() {
  const hovered = useExperienceStore((s) => s.hovered);
  const anchorRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      // Flip to the left of the cursor near the right edge.
      const flip = pointer.current.x > window.innerWidth - 240;
      el.style.transform = `translate3d(${pointer.current.x + (flip ? -OFFSET.x : OFFSET.x)}px, ${
        pointer.current.y + OFFSET.y
      }px, 0) translateX(${flip ? '-100%' : '0'})`;
    };
    const onMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      place();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    place();
    return () => window.removeEventListener('pointermove', onMove);
  }, [hovered]);

  return (
    <div ref={anchorRef} className="pointer-events-none fixed top-0 left-0 z-30">
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered.id}
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="flex items-center gap-2.5 rounded-full border border-white/15 bg-[#0b0d18]/92 py-1.5 pr-3.5 pl-2.5 whitespace-nowrap shadow-xl shadow-black/40"
          >
            <span className="bg-warm size-1.5 rounded-full shadow-[0_0_10px_2px] shadow-amber-300/60" />
            <span className="text-[13px] font-semibold text-white">{hovered.label}</span>
            <span className="font-mono text-[11px] text-white/55">{hovered.hint}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
