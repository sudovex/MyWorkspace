'use client';

/**
 * The architect's desk lamp AND the room's warm key light — and a real switch:
 * clicking it turns the room's warmth off and on.
 *
 * Two lights: the shadow-casting key (a spot aimed down the shade), and a
 * dimmer bounce fill standing in for light reflecting off the desk and walls. Both ignite at the start of
 * the intro's push-in (`reveal`) on the model in `boot/lampTimeline.ts` — a
 * brief tungsten flicker, then a ramp that warms ember → amber — so the camera
 * flies into a room that is coming alive. Before that they are off; in every
 * later phase they hold at peak, scaled by the switch.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  DoubleSide,
  MathUtils,
  Object3D,
  type Group,
  type MeshBasicMaterial,
  type PointLight,
  type SpotLight,
} from 'three';
import { AssetSlot } from '../../assets/AssetSlot';
import { useExperienceStore } from '@/stores/experienceStore';
import {
  lampIntensityAt,
  lampColorAt,
  bounceIntensityAt,
  bounceColorAt,
  LAMP_INTENSITY_END,
} from '../../boot/lampTimeline';
import { useHotspot } from '../../interaction/useHotspot';
import { HitArea } from '../HitArea';
import { PLACEMENT, type Vec3 } from '../layout';
import { Rod } from '../Rod';
import { usePainted } from '../usePainted';
import { createGlowTexture } from '../textures/surfaces';

/** The lamp strikes this long after the push-in begins. */
export const LAMP_IGNITE_DELAY_MS = 520;

/**
 * The timeline models the lamp in its own units; these map it onto the two
 * lights. The spot is narrower than the old omni key, so the fill carries a
 * little more of the room's warmth.
 */
const KEY_GAIN = 2.5;
const BOUNCE_GAIN = 1.7;

const JOINT: Vec3 = [-0.02, 0.3, 0.02];
const HEAD: Vec3 = [-0.25, 0.46, 0.09];
const METAL = { color: '#22242c', roughness: 0.35, metalness: 0.85 } as const;

interface LampProps {
  /** 0 disables shadow casting (low-end convention shared with `Scene`). */
  shadowMapSize: number;
}

export function Lamp({ shadowMapSize }: LampProps) {
  const keyRef = useRef<SpotLight>(null);
  // The spot's aim point: straight down the shade's axis.
  const keyTarget = useMemo(() => new Object3D(), []);
  const bounceRef = useRef<PointLight>(null);
  const bulbRef = useRef<MeshBasicMaterial>(null);
  const coneRef = useRef<MeshBasicMaterial>(null);
  const headRef = useRef<Group>(null);
  const igniteStart = useRef<number | null>(null);
  /** 0..1 — the switch, eased so the filament dies down rather than cutting. */
  const switchLevel = useRef(1);
  const nod = useRef(0);

  const phase = useExperienceStore((s) => s.phase);
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);
  const lampOn = useExperienceStore((s) => s.lampOn);
  const invalidate = useThree((s) => s.invalidate);
  const { hoveredRef, handlers } = useHotspot('lamp');
  const coneTexture = usePainted(
    () => createGlowTexture('rgba(255,200,140,0.9)', 'rgba(255,200,140,0)'),
    [],
  );

  useEffect(() => {
    igniteStart.current =
      phase === 'reveal' && !prefersInstant
        ? performance.now() + LAMP_IGNITE_DELAY_MS
        : null;
    invalidate();
  }, [phase, prefersInstant, invalidate]);

  useFrame((_, delta) => {
    const key = keyRef.current;
    const bounce = bounceRef.current;
    if (!key || !bounce) return;

    // Where on the ignition timeline are we?
    let localMs: number;
    if (prefersInstant) localMs = Infinity;
    else if (phase === 'reveal') {
      localMs =
        igniteStart.current === null ? 0 : performance.now() - igniteStart.current;
    } else if (
      phase === 'black' ||
      phase === 'post' ||
      phase === 'booting' ||
      phase === 'monitor_on'
    ) {
      localMs = 0;
    } else localMs = Infinity;

    switchLevel.current = MathUtils.damp(switchLevel.current, lampOn ? 1 : 0, 9, delta);
    const level = switchLevel.current;

    const keyIntensity = lampIntensityAt(localMs) * level;
    key.intensity = keyIntensity * KEY_GAIN;
    const [r, g, b] = lampColorAt(localMs);
    key.color.setRGB(r / 255, g / 255, b / 255);

    bounce.intensity = bounceIntensityAt(localMs) * level * BOUNCE_GAIN;
    const [br, bg, bb] = bounceColorAt(localMs);
    bounce.color.setRGB(br / 255, bg / 255, bb / 255);

    const glow = keyIntensity / LAMP_INTENSITY_END;
    if (bulbRef.current) {
      bulbRef.current.color.setRGB(
        0.08 + glow * 4.2,
        0.06 + glow * 2.4,
        0.05 + glow * 1.0,
      );
    }
    if (coneRef.current) coneRef.current.opacity = glow * 0.035;

    // Hover: the shade nods toward you.
    nod.current = MathUtils.damp(nod.current, hoveredRef.current ? 1 : 0, 7, delta);
    if (headRef.current) headRef.current.rotation.x = nod.current * 0.16;
  });

  return (
    <AssetSlot id="lamp" position={[...PLACEMENT.lamp]}>
      {/* weighted base */}
      <mesh castShadow receiveShadow position={[0, 0.011, 0]}>
        <cylinderGeometry args={[0.085, 0.095, 0.022, 32]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {/* two-segment arm */}
      <Rod from={[0, 0.02, 0]} to={JOINT} radius={0.0075}>
        <meshStandardMaterial {...METAL} />
      </Rod>
      <mesh position={[...JOINT]} castShadow>
        <sphereGeometry args={[0.014, 16, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <Rod from={JOINT} to={HEAD} radius={0.0065}>
        <meshStandardMaterial {...METAL} />
      </Rod>

      {/* head: shade + bulb, tipped toward the middle of the desk */}
      <group position={[...HEAD]} rotation={[-0.22, 0, -0.42]}>
        <group ref={headRef}>
          <mesh castShadow position={[0, -0.03, 0]}>
            <cylinderGeometry args={[0.028, 0.088, 0.1, 32, 1, true]} />
            <meshStandardMaterial {...METAL} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0.021, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.004, 24]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          <mesh position={[0, -0.045, 0]}>
            <sphereGeometry args={[0.026, 20, 14]} />
            <meshBasicMaterial ref={bulbRef} color={[4, 2.4, 1]} toneMapped={false} />
          </mesh>
          {/* the light cone itself, faintly visible in the air */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.17, 0.28, 32, 1, true]} />
            <meshBasicMaterial
              ref={coneRef}
              map={coneTexture}
              transparent
              opacity={0.085}
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
        {/* Warm key light: a spot looking down the shade's own axis, so the
            pool on the desk is where the lamp is actually pointed. A spot
            needs one shadow pass where a point light needs six. */}
        <primitive object={keyTarget} position={[0, -1, 0]} />
        <spotLight
          ref={keyRef}
          target={keyTarget}
          position={[0, -0.05, 0]}
          color="#ffa858"
          intensity={0}
          angle={1.12}
          penumbra={0.85}
          distance={3.6}
          decay={2}
          castShadow={shadowMapSize > 0}
          shadow-mapSize-width={shadowMapSize || undefined}
          shadow-mapSize-height={shadowMapSize || undefined}
          shadow-camera-near={0.08}
          shadow-camera-far={3.2}
          shadow-bias={-0.0006}
          shadow-normalBias={0.012}
        />
      </group>

      {/* Indirect bounce fill — no shadow, broad and dim, out over the desk. */}
      <pointLight
        ref={bounceRef}
        position={[-0.85, 0.55, 0.5]}
        color="#ffa858"
        intensity={0}
        distance={3.8}
        decay={2}
      />

      {/* forgiving pointer target around the head and arm */}
      <HitArea
        size={[0.36, 0.42, 0.22]}
        position={[-0.14, 0.36, 0.05]}
        handlers={handlers}
      />
    </AssetSlot>
  );
}
