'use client';

/**
 * A tear-off desk calendar showing today's real date. Clicking it opens the
 * career timeline — dates are what a calendar is for.
 *
 * An easel-backed pad; the top sheet is hinged at the binding and lifts on
 * hover as if a draught caught it.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, MathUtils, type Group } from 'three';
import { AssetSlot } from '../../assets/AssetSlot';
import { useHotspot } from '../../interaction/useHotspot';
import { PLACEMENT } from '../layout';
import { useCanvasFonts } from '../useCanvasFonts';
import { usePainted } from '../usePainted';
import { createCalendarTexture } from '../textures/props';
import { ContactShadow } from '../effects/ContactShadow';
import { HitArea } from '../HitArea';

const WIDTH = 0.15;
const HEIGHT = WIDTH * (600 / 512);
const LEAN = -0.26;

export function Calendar() {
  const fonts = useCanvasFonts();
  const today = useMemo(() => new Date(), []);
  const texture = usePainted(() => createCalendarTexture(fonts, today), [fonts.epoch]);
  const sheetRef = useRef<Group>(null);
  const flutter = useRef(0);
  const { hoveredRef, handlers } = useHotspot('calendar');

  useFrame((state, delta) => {
    flutter.current = MathUtils.damp(
      flutter.current,
      hoveredRef.current ? 1 : 0,
      6,
      delta,
    );
    if (sheetRef.current) {
      sheetRef.current.rotation.x =
        -flutter.current * (0.55 + 0.08 * Math.sin(state.clock.elapsedTime * 7));
    }
  });

  return (
    <AssetSlot
      id="deskCalendar"
      position={[...PLACEMENT.calendar]}
      rotation={[0, -0.3, 0]}
    >
      <HitArea
        size={[WIDTH + 0.05, HEIGHT + 0.05, 0.12]}
        position={[0, HEIGHT / 2, -0.03]}
        handlers={handlers}
      />
      <group>
        <group rotation={[LEAN, 0, 0]}>
          {/* backing board */}
          <mesh position={[0, HEIGHT / 2, -0.004]} castShadow>
            <boxGeometry args={[WIDTH + 0.012, HEIGHT + 0.012, 0.006]} />
            <meshStandardMaterial color="#1b1512" roughness={0.75} />
          </mesh>
          {/* the pad underneath */}
          <mesh position={[0, HEIGHT / 2, 0.0005]}>
            <planeGeometry args={[WIDTH, HEIGHT]} />
            <meshStandardMaterial map={texture} roughness={0.85} />
          </mesh>
          {/* top sheet, hinged at the binding */}
          <group ref={sheetRef} position={[0, HEIGHT, 0.0016]}>
            <mesh position={[0, -HEIGHT / 2, 0]}>
              <planeGeometry args={[WIDTH, HEIGHT]} />
              <meshStandardMaterial map={texture} roughness={0.85} side={DoubleSide} />
            </mesh>
          </group>
          {/* binding rings */}
          {[-0.033, 0.033].map((x) => (
            <mesh
              key={x}
              position={[x, HEIGHT + 0.002, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <torusGeometry args={[0.008, 0.0017, 8, 20]} />
              <meshStandardMaterial color="#c9ccd6" roughness={0.25} metalness={0.9} />
            </mesh>
          ))}
        </group>
        {/* easel leg */}
        <mesh position={[0, HEIGHT * 0.42, -0.06]} rotation={[0.42, 0, 0]} castShadow>
          <boxGeometry args={[WIDTH * 0.5, HEIGHT * 0.92, 0.004]} />
          <meshStandardMaterial color="#1b1512" roughness={0.75} />
        </mesh>
      </group>
      <ContactShadow
        position={[0, 0.0012, -0.03]}
        radius={0.11}
        scale={[1.1, 0.9]}
        opacity={0.4}
      />
    </AssetSlot>
  );
}
