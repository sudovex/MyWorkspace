'use client';

/**
 * Tracks the user's `prefers-reduced-motion` setting reactively.
 *
 * Foundational for accessibility: the cinematic intro is skipped and heavy
 * ambient motion disabled when this returns true. Defaults to `false` on the
 * server / first paint to avoid hydration mismatch, then corrects on mount.
 */
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setPrefersReduced(mql.matches);

    const onChange = (event: MediaQueryListEvent) =>
      setPrefersReduced(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}
