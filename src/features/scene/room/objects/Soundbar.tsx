'use client';

/**
 * A small soundbar under the monitor — the room's speaker, and its mute
 * switch. Click it and the rain and music stop; click again and they return.
 *
 * A low cloth-fronted bar on two rubber feet. It shows its own state, so it
 * needs no beacon: while the room is audible a row of five lights behind the
 * cloth rolls like a level meter and a soft wash breathes on the desk in
 * front of it; muted, a single amber light is left on. Hovering lifts the
 * lights and nudges the bar forward a touch.
 *
 * The audio itself lives in `features/audio/` — this object only flips and
 * reflects `soundOn` in the store.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { AdditiveBlending, MathUtils, type Group, type MeshBasicMaterial } from 'three';
import { isSoundAudible, useExperienceStore } from '@/stores/experienceStore';
import { useHotspot } from '../../interaction/useHotspot';
import { HitArea } from '../HitArea';
import { PLACEMENT } from '../layout';
import { usePainted } from '../usePainted';
import { createGlowTexture } from '../textures/surfaces';
import { createGrilleTexture } from '../textures/props';
import { ContactShadow } from '../effects/ContactShadow';

const WIDTH = 0.46;
const HEIGHT = 0.05;
const DEPTH = 0.062;
const FOOT = 0.004;

const LIGHTS = 5;
const LIGHT_PITCH = 0.017;

const BODY = { color: '#23252f', roughness: 0.36, metalness: 0.75 } as const;

export function Soundbar() {
  const { hoveredRef, handlers } = useHotspot('soundbar');
  const audible = useExperienceStore(isSoundAudible);

  const barRef = useRef<Group>(null);
  const lights = useRef<(MeshBasicMaterial | null)[]>([]);
  const washMaterial = useRef<MeshBasicMaterial>(null);
  const level = useRef(0);
  const lift = useRef(0);

  const grille = usePainted(() => createGrilleTexture(), []);
  const wash = usePainted(() => createGlowTexture(), []);

  useFrame((state, delta) => {
    level.current = MathUtils.damp(level.current, audible ? 1 : 0, 4, delta);
    lift.current = MathUtils.damp(lift.current, hoveredRef.current ? 1 : 0, 7, delta);
    const on = level.current;
    const hover = lift.current;
    const t = state.clock.elapsedTime;

    if (barRef.current) barRef.current.position.z = hover * 0.006;

    lights.current.forEach((light, i) => {
      if (!light) return;
      // a slow wave rolling outward from the middle light
      const reach = Math.abs(i - (LIGHTS - 1) / 2);
      const wave = 0.5 + 0.5 * Math.sin(t * 1.7 - reach * 1.15);
      const playing = on * (0.35 + wave * 1.5 + hover * 0.7);
      // muted: only the first light stays on, amber
      const standby = (1 - on) * (i === 0 ? 0.9 + hover * 0.8 : 0);
      light.color.setRGB(
        0.02 + playing * 0.55 + standby * 1.5,
        0.02 + playing * 0.7 + standby * 0.62,
        0.03 + playing * 1.6 + standby * 0.08,
      );
    });

    if (washMaterial.current) {
      const breathe = 0.5 + 0.5 * Math.sin(t * 0.85);
      washMaterial.current.opacity = on * (0.1 + breathe * 0.1 + hover * 0.12);
    }
  });

  return (
    <group position={[...PLACEMENT.soundbar]}>
      <group ref={barRef}>
        {/* rubber feet */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (WIDTH / 2 - 0.05), FOOT / 2, 0]}>
            <boxGeometry args={[0.05, FOOT, DEPTH * 0.7]} />
            <meshStandardMaterial color="#08080a" roughness={0.95} />
          </mesh>
        ))}

        {/* cabinet */}
        <RoundedBox
          args={[WIDTH, HEIGHT, DEPTH]}
          radius={0.012}
          smoothness={4}
          position={[0, FOOT + HEIGHT / 2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...BODY} />
        </RoundedBox>

        {/* cloth front, set between two bare end caps */}
        <mesh position={[0, FOOT + HEIGHT / 2, DEPTH / 2 + 0.0006]}>
          <planeGeometry args={[WIDTH - 0.05, HEIGHT - 0.012]} />
          <meshStandardMaterial
            map={grille}
            emissive="#ffffff"
            emissiveMap={grille}
            emissiveIntensity={0.22}
            roughness={0.92}
            metalness={0.05}
          />
        </mesh>

        {/* a slim bright line where cloth meets cabinet, top edge */}
        <mesh position={[0, FOOT + HEIGHT - 0.0052, DEPTH / 2 + 0.0008]}>
          <planeGeometry args={[WIDTH - 0.05, 0.0012]} />
          <meshStandardMaterial color="#8d93a3" roughness={0.3} metalness={0.9} />
        </mesh>

        {/* the lights behind the cloth */}
        {Array.from({ length: LIGHTS }, (_, i) => (
          <mesh
            key={i}
            position={[
              (i - (LIGHTS - 1) / 2) * LIGHT_PITCH,
              FOOT + 0.014,
              DEPTH / 2 + 0.0012,
            ]}
          >
            <circleGeometry args={[0.0034, 16]} />
            <meshBasicMaterial
              ref={(material) => {
                lights.current[i] = material;
              }}
              color="#050507"
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* sound, drawn as light: a soft wash on the desk in front of the bar */}
      <mesh position={[0, 0.0026, DEPTH / 2 + 0.07]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WIDTH * 1.25, 0.2]} />
        <meshBasicMaterial
          ref={washMaterial}
          map={wash}
          color={[0.45, 0.42, 1.2]}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <HitArea
        size={[WIDTH + 0.06, HEIGHT + 0.05, DEPTH + 0.05]}
        position={[0, HEIGHT / 2 + 0.01, 0.005]}
        handlers={handlers}
      />
      <ContactShadow
        position={[0, 0.0012, 0]}
        radius={0.06}
        scale={[WIDTH / 0.1, 1]}
        opacity={0.5}
      />
    </group>
  );
}
