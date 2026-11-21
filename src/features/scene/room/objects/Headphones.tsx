'use client';

/**
 * On-ear headphones hanging on a stand at the front-left of the desk.
 * Clicking them opens the owner's Spotify.
 *
 * A padded headband over two round, pale ear cups on short yokes — pale so
 * they read against the dim left side of the desk. Hover and they
 * come alive the way headphones do when something is playing: they rock on
 * the stand's hook and a ring on each cup lights up green, pulsing to a beat.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group, type MeshBasicMaterial } from 'three';
import { useHotspot } from '../../interaction/useHotspot';
import { HitArea } from '../HitArea';
import { PLACEMENT } from '../layout';
import { ContactShadow } from '../effects/ContactShadow';

/** Half the distance between the ear cups. */
const SPAN = 0.074;
/** Height of the stand's hook — where the headband rests. */
const HOOK_Y = 0.235;
const CUP = { radius: 0.037, depth: 0.022 } as const;

const SHELL = { color: '#d5d8de', roughness: 0.38, metalness: 0.15 } as const;
const PAD = { color: '#0a0a0c', roughness: 0.95 } as const;
const STEEL = { color: '#9aa0ab', roughness: 0.28, metalness: 0.9 } as const;

function EarCup({
  side,
  ringRef,
}: {
  side: 1 | -1;
  ringRef: (material: MeshBasicMaterial | null) => void;
}) {
  return (
    <group position={[side * SPAN, 0, 0]}>
      {/* yoke */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.006, 0.05, 0.012]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* housing */}
        <mesh castShadow>
          <cylinderGeometry args={[CUP.radius, CUP.radius * 0.94, CUP.depth, 36]} />
          <meshStandardMaterial {...SHELL} />
        </mesh>
        {/* cushion, on the inside face */}
        <mesh
          position={[0, side * (CUP.depth / 2 + 0.005), 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[CUP.radius * 0.7, 0.011, 12, 32]} />
          <meshStandardMaterial {...PAD} />
        </mesh>
        {/* the ring on the outside face that lights up */}
        <mesh
          position={[0, -side * (CUP.depth / 2 + 0.0008), 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[CUP.radius * 0.5, CUP.radius * 0.64, 40]} />
          <meshBasicMaterial ref={ringRef} color="#0c0d10" toneMapped={false} side={2} />
        </mesh>
      </group>
    </group>
  );
}

export function Headphones() {
  const { hoveredRef, handlers } = useHotspot('headphones');
  const hangRef = useRef<Group>(null);
  const rings = useRef<(MeshBasicMaterial | null)[]>([]);
  const playing = useRef(0);

  useFrame((state, delta) => {
    playing.current = MathUtils.damp(
      playing.current,
      hoveredRef.current ? 1 : 0,
      5,
      delta,
    );
    const p = playing.current;
    const t = state.clock.elapsedTime;
    if (hangRef.current) hangRef.current.rotation.z = p * 0.09 * Math.sin(t * 4.2);
    // ~120 bpm: a sharp pulse on each beat that decays before the next
    const beat = Math.exp(-((t * 2) % 1) * 5);
    const level = p * (1.1 + beat * 1.9);
    for (const ring of rings.current) {
      ring?.color.setRGB(0.05 + level * 0.14, 0.05 + level * 1.0, 0.06 + level * 0.36);
    }
  });

  return (
    <group position={[...PLACEMENT.headphones]} rotation={[0, 0.5, 0]}>
      {/* stand: weighted base, post, hook */}
      <mesh castShadow receiveShadow position={[0, 0.006, 0]}>
        <cylinderGeometry args={[0.052, 0.056, 0.012, 32]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh castShadow position={[0, HOOK_Y / 2, -0.012]}>
        <cylinderGeometry args={[0.006, 0.006, HOOK_Y, 12]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh castShadow position={[0, HOOK_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.04, 16]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>

      {/* the headphones hang from the hook and pivot on it */}
      <group ref={hangRef} position={[0, HOOK_Y + 0.012, 0.004]}>
        <group position={[0, -SPAN, 0]}>
          {/* headband: a steel arc, padded over the top */}
          <mesh castShadow>
            <torusGeometry args={[SPAN, 0.0055, 10, 40, Math.PI]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh castShadow rotation={[0, 0, Math.PI * 0.2]}>
            <torusGeometry args={[SPAN + 0.001, 0.0105, 12, 28, Math.PI * 0.6]} />
            <meshStandardMaterial {...PAD} />
          </mesh>
          <group position={[0, -0.05, 0]}>
            <EarCup
              side={1}
              ringRef={(material) => {
                rings.current[0] = material;
              }}
            />
            <EarCup
              side={-1}
              ringRef={(material) => {
                rings.current[1] = material;
              }}
            />
          </group>
        </group>
      </group>

      <HitArea size={[0.24, 0.3, 0.14]} position={[0, 0.14, 0]} handlers={handlers} />
      <ContactShadow position={[0, 0.0012, 0]} radius={0.085} opacity={0.5} />
    </group>
  );
}
