'use client';

import { type ThreeEvent } from '@react-three/fiber';
import { type Vec3 } from './layout';

interface HitAreaProps {
  size: Vec3;
  position: Vec3;
  handlers: {
    onPointerOver: (event: ThreeEvent<PointerEvent>) => void;
    onPointerOut: (event: ThreeEvent<PointerEvent>) => void;
    onClick: (event: ThreeEvent<MouseEvent>) => void;
  };
}

/**
 * An invisible, generously sized pointer target. Room objects are small on
 * screen — some only a few dozen pixels — so each one is hit-tested against a
 * padded box rather than its literal silhouette: "near it" counts.
 *
 * `visible={false}` keeps it out of the render entirely (no draw call, no
 * shadow); three's raycaster still tests it.
 */
export function HitArea({ size, position, handlers }: HitAreaProps) {
  return (
    <mesh position={[...position]} visible={false} {...handlers}>
      <boxGeometry args={[...size]} />
    </mesh>
  );
}
