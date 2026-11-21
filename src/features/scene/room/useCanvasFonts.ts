'use client';

/**
 * Canvas-painted textures can only use fonts the page has already loaded. This
 * hook resolves the real family names behind the `next/font` CSS variables and
 * bumps an "epoch" once those fonts are ready, so any `useMemo` that paints
 * text can list the epoch as a dependency and repaint with the right typeface.
 */
import { useEffect, useState } from 'react';
import { MONO, SANS } from './textures/canvas';

export interface CanvasFonts {
  mono: string;
  sans: string;
  /** Increments once webfonts are ready; use as a memo dependency. */
  epoch: number;
}

function resolve(variable: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value ? `${value}, ${fallback}` : fallback;
}

export function useCanvasFonts(): CanvasFonts {
  const [fonts, setFonts] = useState<CanvasFonts>({ mono: MONO, sans: SANS, epoch: 0 });

  useEffect(() => {
    let cancelled = false;
    const mono = resolve('--font-geist-mono', MONO);
    const sans = resolve('--font-geist-sans', SANS);
    const ready = async () => {
      try {
        await Promise.all([
          document.fonts.load(`600 24px ${mono}`),
          document.fonts.load(`400 24px ${mono}`),
          document.fonts.load(`600 24px ${sans}`),
          document.fonts.load(`400 24px ${sans}`),
        ]);
        await document.fonts.ready;
      } catch {
        // Fall through — system fallbacks are fine.
      }
      if (!cancelled) setFonts({ mono, sans, epoch: 1 });
    };
    void ready();
    return () => {
      cancelled = true;
    };
  }, []);

  return fonts;
}
