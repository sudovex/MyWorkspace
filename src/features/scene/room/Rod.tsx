'use client';

import { useMemo, type ReactNode } from 'react';
import { Quaternion, Vector3 } from 'three';
import { type Vec3 } from './layout';

const UP = new Vector3(0, 1, 0);

interface RodProps {
  from: Vec3;
  to: Vec3;
  radius: number;
  children: ReactNode;
  radialSegments?: number;
  castShadow?: boolean;
}

/** A cylinder spanning two points — lamp arms, chair legs, cables. */
export function Rod({
  from,
  to,
  radius,
  children,
  radialSegments = 12,
  castShadow = true,
}: RodProps) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const direction = b.clone().sub(a);
    const len = direction.length();
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(UP, direction.normalize()),
      length: len,
    };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion} castShadow={castShadow}>
      <cylinderGeometry args={[radius, radius, length, radialSegments]} />
      {children}
    </mesh>
  );
}
