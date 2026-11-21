'use client';

import { AdditiveBlending, DoubleSide } from 'three';
import { type Vec3 } from './layout';
import { usePainted } from './usePainted';
import { createGlowTexture } from './textures/surfaces';

interface GlowProps {
  position: Vec3;
  rotation?: Vec3;
  /** Width and height, world units. */
  size: readonly [number, number];
  /** Linear RGB; values above 1 feed the bloom. */
  color: readonly [number, number, number];
  opacity?: number;
}

/**
 * Painted light: a soft additive falloff on a surface, standing in for the
 * light a nearby emitter would throw there (the neon's wash on the wall, the
 * LED strip's graze, the screen's sheen on the desk).
 *
 * A real light costs shading work on every pixel of every surface in the
 * room, every frame; this costs one small transparent quad. The room keeps
 * its real lights for the four sources that shape it and paints the rest.
 */
export function Glow({ position, rotation, size, color, opacity = 1 }: GlowProps) {
  const texture = usePainted(() => createGlowTexture(), []);
  return (
    <mesh
      position={[...position]}
      rotation={rotation ? [...rotation] : undefined}
      renderOrder={2}
    >
      <planeGeometry args={[size[0], size[1]]} />
      <meshBasicMaterial
        map={texture}
        color={[...color]}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
