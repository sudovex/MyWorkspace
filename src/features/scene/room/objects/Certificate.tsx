'use client';

/**
 * One framed certificate on the back wall, under the shelves — standing in
 * for all of them. Clicking it opens the certificates panel.
 *
 * It hangs from a single nail, so it responds the way a hung frame does: on
 * hover it swings a few degrees and settles, and the paper catches a little
 * more light.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group, type MeshStandardMaterial } from 'three';
import { certifications } from '@/content/resume';
import { profile } from '@/content/profile';
import { useHotspot } from '../../interaction/useHotspot';
import { HitArea } from '../HitArea';
import { PLACEMENT } from '../layout';
import { useCanvasFonts } from '../useCanvasFonts';
import { usePainted } from '../usePainted';
import { createCertificateTexture } from '../textures/props';

const PAPER = { width: 0.3, height: 0.225 } as const;
const MAT = 0.022;
const FRAME = 0.016;
const OUTER = {
  width: PAPER.width + (MAT + FRAME) * 2,
  height: PAPER.height + (MAT + FRAME) * 2,
} as const;
/** The nail sits this far above the frame's centre; the frame pivots on it. */
const NAIL_Y = OUTER.height / 2 + 0.03;

export function Certificate() {
  const fonts = useCanvasFonts();
  const texture = usePainted(
    () => createCertificateTexture(fonts, profile.name, certifications.length),
    [fonts.epoch],
  );
  const swingRef = useRef<Group>(null);
  const paperRef = useRef<MeshStandardMaterial>(null);
  const attention = useRef(0);
  const { hoveredRef, handlers } = useHotspot('certificate');

  useFrame((state, delta) => {
    attention.current = MathUtils.damp(
      attention.current,
      hoveredRef.current ? 1 : 0,
      5,
      delta,
    );
    const a = attention.current;
    if (swingRef.current) {
      swingRef.current.rotation.z =
        a * (0.035 + 0.02 * Math.sin(state.clock.elapsedTime * 5));
    }
    if (paperRef.current) paperRef.current.emissiveIntensity = 0.3 + a * 0.4;
  });

  const [x, y, z] = PLACEMENT.certificate;

  return (
    <group position={[x, y + NAIL_Y, z]}>
      {/* nail and wire */}
      <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.02, 8]} />
        <meshStandardMaterial color="#c9ccd6" roughness={0.3} metalness={0.9} />
      </mesh>
      <group ref={swingRef}>
        <group position={[0, -NAIL_Y, 0]}>
          {/* frame */}
          <mesh position={[0, 0, 0.012]} castShadow>
            <boxGeometry args={[OUTER.width, OUTER.height, 0.024]} />
            <meshStandardMaterial color="#17120e" roughness={0.45} metalness={0.15} />
          </mesh>
          {/* mat */}
          <mesh position={[0, 0, 0.0246]}>
            <planeGeometry args={[PAPER.width + MAT * 2, PAPER.height + MAT * 2]} />
            <meshStandardMaterial color="#e6dfd0" roughness={0.9} />
          </mesh>
          {/* the certificate — lightly self-lit, as if under a picture light */}
          <mesh position={[0, 0, 0.0252]}>
            <planeGeometry args={[PAPER.width, PAPER.height]} />
            <meshStandardMaterial
              ref={paperRef}
              map={texture}
              emissiveMap={texture}
              emissive="#ffffff"
              emissiveIntensity={0.3}
              roughness={0.8}
            />
          </mesh>
        </group>
      </group>
      <HitArea
        size={[OUTER.width + 0.06, OUTER.height + 0.08, 0.1]}
        position={[0, -NAIL_Y, 0.04]}
        handlers={handlers}
      />
    </group>
  );
}
