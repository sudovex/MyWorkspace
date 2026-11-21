import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Three.js ships modern ESM; Next 15 handles it, but we keep the door open
  // for worker/GLSL loaders introduced in later milestones (M2+).
  experimental: {
    optimizePackageImports: ['lucide-react', '@react-three/drei'],
  },
};

export default nextConfig;
