import { ExperienceRoot } from '@/features/experience/ExperienceRoot';
import { SeoFallback } from '@/features/scene/SeoFallback';

/**
 * Home route.
 *
 * Renders the interactive experience for capable clients and a crawlable,
 * screen-reader-friendly fallback (`SeoFallback`) so the portfolio's substance
 * is never trapped inside a canvas. The full semantic mirror lands in M10; this
 * establishes the pattern from the start.
 */
export default function HomePage() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <SeoFallback />
      <ExperienceRoot />
    </main>
  );
}
