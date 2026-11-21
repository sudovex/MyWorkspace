'use client';

/** A short transient message — what the coffee mug says when clicked. */
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coffee } from 'lucide-react';
import { useExperienceStore } from '@/stores/experienceStore';

const VISIBLE_MS = 4600;

export function Toast() {
  const toast = useExperienceStore((s) => s.toast);
  const clearToast = useExperienceStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(clearToast, VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [toast, clearToast]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="flex max-w-md items-start gap-3 rounded-2xl border border-white/12 bg-[#0b0d18]/94 px-4 py-3 shadow-2xl shadow-black/50"
          >
            <Coffee className="text-warm mt-0.5 size-4 shrink-0" />
            <p className="text-sm leading-snug text-white/90">{toast.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
