'use client';

/**
 * What hangs on the walls: a neon `> hello, world_` above the monitor (the one
 * place the room allows itself to glow pink) and two framed prints on the left
 * wall — passed by the wide establishing shot on its way in, and looked at
 * properly when the visitor turns left (cursor to the left edge).
 *
 * Each print has a small brass picture light over it. They are what makes the
 * left wall read: a warm pool around the frames, and the wall falling away
 * into the dark beyond them. The pools are painted (`Glow`), not real lights.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type MeshBasicMaterial } from 'three';
import { useExperienceStore } from '@/stores/experienceStore';
import { LEFT_WALL_X, PLACEMENT } from '../layout';
import { useCanvasFonts } from '../useCanvasFonts';
import { usePainted } from '../usePainted';
import { Glow } from '../Glow';
import {
  createNeonTexture,
  createRoadPosterTexture,
  createTypePosterTexture,
} from '../textures/props';

const NEON_BASE = 1.55;

function NeonSign() {
  const fonts = useCanvasFonts();
  const texture = usePainted(() => createNeonTexture(fonts), [fonts.epoch]);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);

  // A tube with a bad contact: a slow hum, and every few seconds a short
  // stutter. Two triggers on unrelated periods (≈4.5s and ≈7.4s) so the
  // stutters never settle into a rhythm; the second one is a harder drop-out.
  useFrame((state) => {
    const material = materialRef.current;
    if (!material || prefersInstant) return;
    const t = state.clock.elapsedTime;
    const hum = 0.04 * Math.sin(t * 2.1);
    const stutter = Math.sin(t * 1.4) > 0.955 ? -0.45 * Math.abs(Math.sin(t * 40)) : 0;
    const dropOut =
      Math.sin(t * 0.85 + 1.9) > 0.975 ? -0.7 * Math.abs(Math.sin(t * 27 + 0.6)) : 0;
    const level = 1 + hum + Math.min(stutter, dropOut);
    material.color.setScalar(NEON_BASE * level);
  });

  return (
    <group position={[...PLACEMENT.neon]}>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[0.92, 0.23]} />
        <meshBasicMaterial
          ref={materialRef}
          map={texture}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
          color={[NEON_BASE, NEON_BASE, NEON_BASE]}
        />
      </mesh>
      {/* the tube's wash on the wall — painted, not lit (see `Glow`) */}
      <Glow
        position={[0, -0.03, 0.006]}
        size={[1.9, 0.95]}
        color={[1.0, 0.22, 0.6]}
        opacity={0.3}
      />
    </group>
  );
}

const FRAME_SIZE = { width: 0.56, height: 0.74 } as const;
const BRASS = { color: '#8a6a3a', roughness: 0.32, metalness: 0.9 } as const;
/** The picture lights' colour: warm white, a touch amber. */
const PICTURE_LIGHT = [1.0, 0.74, 0.46] as const;

/** A brass arm off the wall, a shade, and the lit slot under it. */
function PictureLight() {
  const top = FRAME_SIZE.height / 2;
  return (
    <group position={[0, top + 0.075, 0]}>
      {/* wall plate + arm */}
      <mesh position={[0, 0.012, -0.012]}>
        <boxGeometry args={[0.07, 0.05, 0.008]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.02, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.085, 10]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      {/* shade */}
      <mesh position={[0, 0.012, 0.075]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.32, 16]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      {/* the lamp itself, seen as a bright slot under the shade */}
      <mesh position={[0, -0.003, 0.073]}>
        <boxGeometry args={[0.29, 0.005, 0.014]} />
        <meshBasicMaterial color={[2.6, 1.9, 1.15]} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Frame({ z, y, children }: { z: number; y: number; children: React.ReactNode }) {
  return (
    <group position={[LEFT_WALL_X + 0.02, y, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow>
        <boxGeometry args={[FRAME_SIZE.width, FRAME_SIZE.height, 0.03]} />
        <meshStandardMaterial color="#101117" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[0.5, 0.667]} />
        {children}
      </mesh>
      <PictureLight />
      {/* its pool on the wall: brightest just under the shade, fading down */}
      <Glow
        position={[0, 0.2, -0.012]}
        size={[1.2, 1.3]}
        color={PICTURE_LIGHT}
        opacity={0.4}
      />
      <Glow
        position={[0, FRAME_SIZE.height / 2 + 0.03, -0.011]}
        size={[0.62, 0.3]}
        color={PICTURE_LIGHT}
        opacity={0.5}
      />
    </group>
  );
}

export function WallDecor() {
  const fonts = useCanvasFonts();
  const typePoster = usePainted(() => createTypePosterTexture(fonts), [fonts.epoch]);
  const roadPoster = usePainted(createRoadPosterTexture, []);

  return (
    <>
      <NeonSign />
      <Frame z={0.05} y={0.98}>
        <meshStandardMaterial
          map={roadPoster}
          emissive="#ffd9b0"
          emissiveMap={roadPoster}
          emissiveIntensity={0.42}
          roughness={0.7}
        />
      </Frame>
      <Frame z={0.78} y={0.98}>
        <meshStandardMaterial
          map={typePoster}
          emissive="#ffd9b0"
          emissiveMap={typePoster}
          emissiveIntensity={0.16}
          roughness={0.8}
        />
      </Frame>
    </>
  );
}
