import type { NextConfig } from 'next';

/**
 * The site is a static export (`out/`) so it can be hosted anywhere — GitHub
 * Pages today (`.github/workflows/deploy.yml`).
 *
 * `NEXT_PUBLIC_BASE_PATH` is the sub-path the site lives under: `/MyWorkspace`
 * on `https://sudovex.github.io/MyWorkspace/`, empty on a custom domain or in
 * development. The deploy workflow sets it from GitHub Pages' own settings,
 * so adding a custom domain later needs no code change.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  // GitHub Pages serves `about/index.html` for `/about/`; keep URLs in that shape.
  trailingSlash: true,
  // There is no image server on a static host: photos are pre-sized in
  // `public/gallery/` (900 px wide) and served as they are.
  images: { unoptimized: true },
  // Three.js ships modern ESM; Next 15 handles it, but we keep the door open
  // for worker/GLSL loaders introduced in later milestones (M2+).
  experimental: {
    optimizePackageImports: ['lucide-react', '@react-three/drei'],
  },
};

export default nextConfig;
