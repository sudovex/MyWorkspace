'use client';

/**
 * The small things on the desk. Three of them are doorways:
 *  - the phone lights up and tilts toward you → picked up, it becomes a
 *    usable handset with every social link as an app;
 *  - the notebook's page lifts → projects;
 *  - the coffee mug steams, and tells you something when you click it.
 * The rest (bike keys, pens) are evidence that someone works here.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import {
  AdditiveBlending,
  MathUtils,
  type Group,
  type MeshBasicMaterial,
  type Sprite,
} from 'three';
import { AssetSlot } from '../../assets/AssetSlot';
import { useExperienceStore } from '@/stores/experienceStore';
import { useHotspot } from '../../interaction/useHotspot';
import { PLACEMENT } from '../layout';
import { useCanvasFonts } from '../useCanvasFonts';
import { usePainted } from '../usePainted';
import { createGlowTexture } from '../textures/surfaces';
import { createNotebookTexture, createPhoneTexture } from '../textures/props';
import { ContactShadow } from '../effects/ContactShadow';
import { HitArea } from '../HitArea';

const STEAM_PUFFS = 4;
const STEAM_PERIOD_S = 3.4;

function Mug() {
  const { hoveredRef, handlers } = useHotspot('mug');
  const steamTexture = usePainted(
    () => createGlowTexture('rgba(255,255,255,0.55)', 'rgba(255,255,255,0)', 64),
    [],
  );
  const puffs = useRef<(Sprite | null)[]>([]);
  const bodyRef = useRef<Group>(null);
  const warmth = useRef(0);
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);

  useFrame((state, delta) => {
    warmth.current = MathUtils.damp(warmth.current, hoveredRef.current ? 1 : 0, 6, delta);
    if (bodyRef.current) bodyRef.current.rotation.z = warmth.current * 0.07;
    const t = prefersInstant ? 1.2 : state.clock.elapsedTime;
    puffs.current.forEach((puff, i) => {
      if (!puff) return;
      const life = (t / STEAM_PERIOD_S + i / STEAM_PUFFS) % 1;
      puff.position.set(
        Math.sin(life * 5 + i * 2.1) * 0.012,
        0.11 + life * 0.15,
        Math.cos(life * 4 + i) * 0.008,
      );
      const size = 0.03 + life * 0.05;
      puff.scale.set(size, size, 1);
      puff.material.opacity = Math.sin(life * Math.PI) * (0.16 + warmth.current * 0.2);
    });
  });

  return (
    <AssetSlot id="mug" position={[...PLACEMENT.mug]}>
      <HitArea size={[0.14, 0.16, 0.12]} position={[0.01, 0.07, 0]} handlers={handlers} />
      <group ref={bodyRef}>
        <mesh castShadow receiveShadow position={[0, 0.047, 0]}>
          <cylinderGeometry args={[0.042, 0.037, 0.094, 32]} />
          <meshStandardMaterial color="#e9e4d8" roughness={0.35} />
        </mesh>
        {/* coffee */}
        <mesh position={[0, 0.088, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.038, 32]} />
          <meshStandardMaterial color="#2a1608" roughness={0.15} metalness={0.2} />
        </mesh>
        {/* handle */}
        <mesh castShadow position={[0.04, 0.047, 0]} rotation={[0, 0, -Math.PI * 0.6]}>
          <torusGeometry args={[0.024, 0.0065, 10, 24, Math.PI * 1.2]} />
          <meshStandardMaterial color="#e9e4d8" roughness={0.35} />
        </mesh>
        {Array.from({ length: STEAM_PUFFS }, (_, i) => (
          <sprite
            key={i}
            ref={(sprite) => {
              puffs.current[i] = sprite;
            }}
          >
            <spriteMaterial
              map={steamTexture}
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </sprite>
        ))}
      </group>
      <ContactShadow position={[0, 0.0012, 0]} radius={0.07} opacity={0.45} />
    </AssetSlot>
  );
}

function Phone() {
  const fonts = useCanvasFonts();
  const now = useMemo(() => new Date(), []);
  const screen = usePainted(() => createPhoneTexture(fonts, now), [fonts.epoch]);
  const { hoveredRef, handlers } = useHotspot('phone');
  const bodyRef = useRef<Group>(null);
  const screenRef = useRef<MeshBasicMaterial>(null);
  const wake = useRef(0);

  useFrame((state, delta) => {
    wake.current = MathUtils.damp(wake.current, hoveredRef.current ? 1 : 0, 6, delta);
    if (bodyRef.current) {
      bodyRef.current.rotation.x = -wake.current * 0.5;
      bodyRef.current.position.y = wake.current * 0.03;
    }
    // A notification glow that pulses every few seconds, brighter on hover.
    const ping = Math.max(0, Math.sin(state.clock.elapsedTime * 1.4)) ** 6;
    if (screenRef.current) {
      screenRef.current.color.setScalar(0.5 + ping * 0.35 + wake.current * 0.7);
    }
  });

  return (
    <AssetSlot id="phone" position={[...PLACEMENT.phone]} rotation={[0, 0.3, 0]}>
      <HitArea size={[0.13, 0.07, 0.21]} position={[0, 0.03, 0]} handlers={handlers} />
      <group ref={bodyRef}>
        <RoundedBox
          args={[0.072, 0.008, 0.15]}
          radius={0.0035}
          position={[0, 0.005, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#0c0d12" roughness={0.3} metalness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.0094, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.066, 0.143]} />
          <meshBasicMaterial ref={screenRef} map={screen} toneMapped={false} />
        </mesh>
      </group>
      <ContactShadow
        position={[0, 0.0012, 0]}
        radius={0.09}
        scale={[0.7, 1.2]}
        opacity={0.4}
      />
    </AssetSlot>
  );
}

function Notebook() {
  const fonts = useCanvasFonts();
  const page = usePainted(() => createNotebookTexture(fonts), [fonts.epoch]);
  const { hoveredRef, handlers } = useHotspot('notebook');
  const groupRef = useRef<Group>(null);
  const lift = useRef(0);

  useFrame((_, delta) => {
    lift.current = MathUtils.damp(lift.current, hoveredRef.current ? 1 : 0, 6, delta);
    if (groupRef.current) {
      groupRef.current.position.y = lift.current * 0.03;
      groupRef.current.rotation.x = -lift.current * 0.35;
    }
  });

  return (
    <AssetSlot id="notebook" position={[...PLACEMENT.notebook]} rotation={[0, -0.22, 0]}>
      <HitArea size={[0.33, 0.07, 0.24]} position={[0, 0.03, 0]} handlers={handlers} />
      <group ref={groupRef}>
        {/* cover, open flat */}
        <RoundedBox
          args={[0.3, 0.008, 0.21]}
          radius={0.003}
          position={[0, 0.004, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#1f2a44" roughness={0.7} />
        </RoundedBox>
        {/* page block */}
        <mesh position={[0, 0.011, 0]} receiveShadow>
          <boxGeometry args={[0.285, 0.006, 0.198]} />
          <meshStandardMaterial color="#ded8c8" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.0143, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.285, 0.198]} />
          <meshStandardMaterial map={page} roughness={0.9} />
        </mesh>
        {/* pen resting in the gutter */}
        <mesh position={[0.02, 0.02, 0.01]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.0045, 0.0045, 0.14, 10]} />
          <meshStandardMaterial color="#d2562f" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>
      <ContactShadow
        position={[0, 0.0012, 0]}
        radius={0.19}
        scale={[1, 0.75]}
        opacity={0.4}
      />
    </AssetSlot>
  );
}

/** Motorcycle keys tossed down beside the helmet. */
function BikeKeys() {
  return (
    <AssetSlot id="bikeKeys" position={[...PLACEMENT.bikeKeys]} rotation={[0, 0.9, 0]}>
      <mesh position={[0, 0.003, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.016, 0.0018, 8, 24]} />
        <meshStandardMaterial color="#c9ccd6" roughness={0.25} metalness={0.95} />
      </mesh>
      <mesh position={[0.036, 0.003, 0.006]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.046, 0.003, 0.009]} />
        <meshStandardMaterial color="#c9ccd6" roughness={0.25} metalness={0.95} />
      </mesh>
      <RoundedBox
        args={[0.03, 0.009, 0.042]}
        radius={0.004}
        position={[-0.03, 0.005, -0.014]}
        rotation={[0, -0.5, 0]}
        castShadow
      >
        <meshStandardMaterial color="#ff7a2f" roughness={0.45} />
      </RoundedBox>
      <ContactShadow position={[0, 0.0012, 0]} radius={0.06} opacity={0.3} />
    </AssetSlot>
  );
}

export function DeskProps() {
  return (
    <>
      <Mug />
      <Phone />
      <Notebook />
      <BikeKeys />
    </>
  );
}
