'use client';

/**
 * "This is clickable" — a small pulsing ring floating at each doorway object.
 * They fade in shortly after the camera settles at the desk, and disappear
 * the moment a panel opens or the camera leaves for the monitor. The ring for
 * whatever the pointer is over holds still and brightens instead of pulsing.
 *
 * Sprites, so they always face the camera; drawn without depth testing so a
 * beacon is never hidden behind the object it is pointing at.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, MathUtils, type Sprite } from 'three';
import { useExperienceStore } from '@/stores/experienceStore';
import { BEACON_HOTSPOTS, HOTSPOTS } from '../../interaction/hotspots';
import { usePainted } from '../usePainted';
import { createGlowTexture, createRingTexture } from '../textures/surfaces';

const PERIOD_S = 2.4;
const DOT_SIZE = 0.016;
const RING_MIN = 0.022;
const RING_MAX = 0.075;
/** Beacons wait this long after arriving at the desk before fading in. */
const APPEAR_DELAY_S = 0.9;
const COLOR: [number, number, number] = [2.6, 1.9, 1.1];

export function Beacons() {
  const ring = usePainted(createRingTexture, []);
  const dot = usePainted(() => createGlowTexture(), []);
  const rings = useRef<(Sprite | null)[]>([]);
  const dots = useRef<(Sprite | null)[]>([]);
  const visibility = useRef(0);
  const idleFor = useRef(0);

  const interactive = useExperienceStore(
    (s) => s.phase === 'room_idle' && s.activePanel === null,
  );
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);

  useFrame((state, delta) => {
    idleFor.current = interactive ? idleFor.current + delta : 0;
    const shouldShow = interactive && idleFor.current > APPEAR_DELAY_S;
    visibility.current = MathUtils.damp(visibility.current, shouldShow ? 1 : 0, 4, delta);
    const visible = visibility.current;
    const hoveredId = useExperienceStore.getState().hovered?.id;
    const t = state.clock.elapsedTime;

    BEACON_HOTSPOTS.forEach((id, i) => {
      const ringSprite = rings.current[i];
      const dotSprite = dots.current[i];
      if (!ringSprite || !dotSprite) return;
      const hovered = hoveredId === id;
      const life = prefersInstant ? 0.4 : (t / PERIOD_S + i * 0.23) % 1;
      const size = hovered ? RING_MAX * 0.8 : MathUtils.lerp(RING_MIN, RING_MAX, life);
      ringSprite.scale.set(size, size, 1);
      ringSprite.material.opacity = visible * (hovered ? 0.9 : (1 - life) * 0.75);
      const dotSize = DOT_SIZE * (hovered ? 1.5 : 1);
      dotSprite.scale.set(dotSize, dotSize, 1);
      dotSprite.material.opacity = visible * 0.95;
      ringSprite.visible = visible > 0.01;
      dotSprite.visible = visible > 0.01;
    });
  });

  return (
    <group renderOrder={10}>
      {BEACON_HOTSPOTS.map((id, i) => (
        <group key={id} position={[...HOTSPOTS[id].beacon]}>
          <sprite
            ref={(sprite) => {
              rings.current[i] = sprite;
            }}
            visible={false}
          >
            <spriteMaterial
              map={ring}
              color={COLOR}
              transparent
              opacity={0}
              depthTest={false}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
          <sprite
            ref={(sprite) => {
              dots.current[i] = sprite;
            }}
            visible={false}
          >
            <spriteMaterial
              map={dot}
              color={COLOR}
              transparent
              opacity={0}
              depthTest={false}
              depthWrite={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}
    </group>
  );
}
