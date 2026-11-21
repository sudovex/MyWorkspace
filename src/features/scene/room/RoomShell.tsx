'use client';

/**
 * The room envelope: plank floor, two painted walls, skirting, a rug, and the
 * window — its frame here, the rainy city behind the glass in
 * `objects/WindowView.tsx` — with its light pooling across the floor. An open diorama (no right wall, no ceiling) so the wide establishing
 * shot can see in.
 */
import { AdditiveBlending, DoubleSide } from 'three';
import { AssetSlot } from '../assets/AssetSlot';
import { BACK_WALL_Z, FLOOR_Y, LEFT_WALL_X, PLACEMENT, WINDOW_SIZE } from './layout';
import { usePainted } from './usePainted';
import {
  createFalloffTexture,
  createFloorTexture,
  createRugTexture,
  createWallTexture,
  createWindowLightTexture,
} from './textures/surfaces';
import { WindowView } from './objects/WindowView';

const WALL_HEIGHT = 3.4;
const WALL_CENTER_Y = FLOOR_Y + WALL_HEIGHT / 2;
const FRAME = '#14151c';
/** Matches the scene's backdrop / fog — what the room dissolves into. */
const DARK = '#06070d';
/** Where the left wall starts to go dark, and where it is fully gone. */
const FALLOFF = { from: 1.25, to: 3.1 } as const;

function Window() {
  const { width, height } = WINDOW_SIZE;
  const bar = 0.035;

  return (
    <AssetSlot id="window" position={[...PLACEMENT.window]}>
      {/* the view: the city in the rain, behind wet glass */}
      <WindowView />
      {/* frame + mullions */}
      {(
        [
          [0, height / 2 + bar / 2, width + bar * 2, bar],
          [0, -height / 2 - bar / 2, width + bar * 2, bar],
          [-width / 2 - bar / 2, 0, bar, height],
          [width / 2 + bar / 2, 0, bar, height],
          [0, 0, 0.022, height],
          [0, 0.02, width, 0.022],
        ] as const
      ).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.03]} castShadow>
          <boxGeometry args={[w, h, 0.06]} />
          <meshStandardMaterial color={FRAME} roughness={0.55} metalness={0.3} />
        </mesh>
      ))}
      {/* sill */}
      <mesh position={[0, -height / 2 - bar - 0.012, 0.07]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.16, 0.026, 0.15]} />
        <meshStandardMaterial color="#1b1c25" roughness={0.6} />
      </mesh>
      {/* the window's own light, spilling into the room */}
      <pointLight
        position={[0, 0.05, 0.45]}
        color="#7aa2ff"
        intensity={1.5}
        distance={3.4}
        decay={2}
      />
    </AssetSlot>
  );
}

export function RoomShell() {
  const floorTexture = usePainted(createFloorTexture, []);
  const wallTexture = usePainted(createWallTexture, []);
  const rugTexture = usePainted(createRugTexture, []);
  const windowLight = usePainted(createWindowLightTexture, []);
  const falloff = usePainted(createFalloffTexture, []);

  return (
    <>
      {/* floor */}
      <mesh receiveShadow position={[0.4, FLOOR_Y, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial map={floorTexture} roughness={0.62} metalness={0.05} />
      </mesh>

      {/* back wall */}
      <mesh receiveShadow position={[0.6, WALL_CENTER_Y, BACK_WALL_Z]}>
        <planeGeometry args={[7.5, WALL_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.92} />
      </mesh>
      {/* left wall */}
      <mesh
        receiveShadow
        position={[LEFT_WALL_X, WALL_CENTER_Y, 1.6]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[6, WALL_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.92} />
      </mesh>

      {/* the left wall runs off into the dark: lit by the window and the
          picture lights at the corner, gone by the time it reaches the viewer.
          Painted (a gradient decal + a solid cap), so it costs no light. */}
      <mesh
        position={[LEFT_WALL_X + 0.004, WALL_CENTER_Y, (FALLOFF.from + FALLOFF.to) / 2]}
        rotation={[0, Math.PI / 2, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[FALLOFF.to - FALLOFF.from, WALL_HEIGHT]} />
        <meshBasicMaterial
          color={DARK}
          alphaMap={falloff}
          transparent
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <mesh
        position={[LEFT_WALL_X + 0.004, WALL_CENTER_Y, (FALLOFF.to + 4.6) / 2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[4.6 - FALLOFF.to, WALL_HEIGHT]} />
        <meshBasicMaterial color={DARK} fog={false} />
      </mesh>

      {/* skirting boards */}
      <mesh position={[0.6, FLOOR_Y + 0.045, BACK_WALL_Z + 0.012]}>
        <boxGeometry args={[7.5, 0.09, 0.024]} />
        <meshStandardMaterial color="#12131b" roughness={0.6} />
      </mesh>
      <mesh position={[LEFT_WALL_X + 0.012, FLOOR_Y + 0.045, 1.6]}>
        <boxGeometry args={[0.024, 0.09, 6]} />
        <meshStandardMaterial color="#12131b" roughness={0.6} />
      </mesh>

      {/* rug */}
      <mesh
        receiveShadow
        position={[-0.05, FLOOR_Y + 0.004, 0.55]}
        rotation={[-Math.PI / 2, 0, 0.04]}
      >
        <planeGeometry args={[2.9, 1.9]} />
        <meshStandardMaterial map={rugTexture} roughness={0.98} />
      </mesh>

      {/* moonlight through the panes, raking across the floor */}
      <mesh
        position={[-0.95, FLOOR_Y + 0.008, 0.75]}
        rotation={[-Math.PI / 2, 0, -0.32]}
        scale={[1.25, 2.3, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={windowLight}
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <Window />
    </>
  );
}
