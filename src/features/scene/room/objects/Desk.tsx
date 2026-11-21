'use client';

import { RoundedBox } from '@react-three/drei';
import { AssetSlot } from '../../assets/AssetSlot';
import { DESK, FLOOR_Y } from '../layout';
import { usePainted } from '../usePainted';
import { createDeskMatTexture, createDeskWoodTexture } from '../textures/surfaces';

const TOP_THICKNESS = 0.04;
const LEG_INSET = 0.07;

/**
 * The desk: a walnut slab on a black steel frame, with a felt mat where the
 * keyboard and mouse live. Desk surface sits at y = 0.
 */
export function Desk() {
  const wood = usePainted(createDeskWoodTexture, []);
  const mat = usePainted(createDeskMatTexture, []);
  const { width, depth } = DESK;
  const legHeight = -FLOOR_Y - TOP_THICKNESS;
  const legY = -TOP_THICKNESS - legHeight / 2;
  const x = width / 2 - LEG_INSET;
  const z = depth / 2 - LEG_INSET;

  return (
    <AssetSlot id="desk" position={[...DESK.center]}>
      <RoundedBox
        args={[width, TOP_THICKNESS, depth]}
        radius={0.012}
        smoothness={3}
        position={[0, -TOP_THICKNESS / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial map={wood} roughness={0.48} metalness={0.02} />
      </RoundedBox>

      {/* steel frame: four legs + a rear stretcher */}
      {(
        [
          [-x, -z],
          [x, -z],
          [-x, z],
          [x, z],
        ] as const
      ).map(([lx, lz], i) => (
        <mesh key={i} castShadow position={[lx, legY, lz]}>
          <boxGeometry args={[0.045, legHeight, 0.045]} />
          <meshStandardMaterial color="#111217" roughness={0.45} metalness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, -0.12, -z]}>
        <boxGeometry args={[width - LEG_INSET * 2, 0.04, 0.02]} />
        <meshStandardMaterial color="#111217" roughness={0.45} metalness={0.7} />
      </mesh>

      {/* felt desk mat */}
      <mesh
        receiveShadow
        position={[0.07, 0.0015, 0.235]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.94, 0.34]} />
        <meshStandardMaterial map={mat} roughness={0.95} />
      </mesh>
    </AssetSlot>
  );
}
