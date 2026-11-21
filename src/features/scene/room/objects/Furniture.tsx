'use client';

/**
 * Floor-standing furniture: the task chair (pushed back from the desk, low in
 * the frame as foreground depth) and a tall snake plant by the shelves whose
 * blades sway almost imperceptibly — air moving, nothing more.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { type Group } from 'three';
import { AssetSlot } from '../../assets/AssetSlot';
import { useExperienceStore } from '@/stores/experienceStore';
import { FLOOR_Y, PLACEMENT } from '../layout';
import { Rod } from '../Rod';
import { ContactShadow } from '../effects/ContactShadow';

const FABRIC = { color: '#22252f', roughness: 0.9 } as const;
const STEEL = { color: '#14151a', roughness: 0.4, metalness: 0.8 } as const;

function Chair() {
  const [x, seatY, z] = PLACEMENT.chair;
  const floorOffset = FLOOR_Y - seatY;
  return (
    <AssetSlot id="chair" position={[x, seatY, z]} rotation={[0, 0.32, 0]}>
      <RoundedBox args={[0.5, 0.07, 0.48]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial {...FABRIC} />
      </RoundedBox>
      {/* backrest — faces the desk, so the camera sees its back */}
      <RoundedBox
        args={[0.46, 0.5, 0.06]}
        radius={0.028}
        position={[0, 0.33, 0.24]}
        rotation={[0.1, 0, 0]}
        castShadow
      >
        <meshStandardMaterial {...FABRIC} />
      </RoundedBox>
      <mesh position={[0, 0.07, 0.235]} castShadow>
        <boxGeometry args={[0.07, 0.16, 0.03]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      {/* gas lift + five-star base */}
      <mesh position={[0, floorOffset / 2, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, -floorOffset, 16]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const tipX = Math.cos(angle) * 0.3;
        const tipZ = Math.sin(angle) * 0.3;
        return (
          <group key={i}>
            <Rod
              from={[0, floorOffset + 0.07, 0]}
              to={[tipX, floorOffset + 0.045, tipZ]}
              radius={0.014}
            >
              <meshStandardMaterial {...STEEL} />
            </Rod>
            <mesh position={[tipX, floorOffset + 0.024, tipZ]}>
              <sphereGeometry args={[0.024, 12, 10]} />
              <meshStandardMaterial color="#0b0c10" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
      <ContactShadow position={[0, floorOffset + 0.006, 0]} radius={0.42} opacity={0.5} />
    </AssetSlot>
  );
}

const BLADES = [
  { angle: 0.0, lean: 0.1, height: 0.62 },
  { angle: 1.1, lean: 0.2, height: 0.5 },
  { angle: 2.3, lean: 0.14, height: 0.7 },
  { angle: 3.4, lean: 0.24, height: 0.46 },
  { angle: 4.4, lean: 0.12, height: 0.58 },
  { angle: 5.5, lean: 0.26, height: 0.42 },
  { angle: 0.6, lean: 0.05, height: 0.76 },
] as const;

function Plant() {
  const foliageRef = useRef<Group>(null);
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);

  useFrame((state) => {
    if (prefersInstant || !foliageRef.current) return;
    const t = state.clock.elapsedTime;
    foliageRef.current.rotation.z = Math.sin(t * 0.7) * 0.018;
    foliageRef.current.rotation.x = Math.sin(t * 0.45 + 1) * 0.012;
  });

  return (
    <AssetSlot id="plant" position={[...PLACEMENT.plant]}>
      <mesh castShadow receiveShadow position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.16, 0.12, 0.34, 32]} />
        <meshStandardMaterial color="#c8beae" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.335, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshStandardMaterial color="#2a1c14" roughness={1} />
      </mesh>
      <group ref={foliageRef} position={[0, 0.33, 0]}>
        {BLADES.map(({ angle, lean, height }, i) => (
          <group key={i} rotation={[0, angle, lean]}>
            <mesh castShadow position={[0.03, height / 2, 0]} scale={[1, 1, 0.22]}>
              <coneGeometry args={[0.05, height, 8]} />
              <meshStandardMaterial
                color={i % 2 ? '#3f7d4f' : '#2f6540'}
                roughness={0.7}
              />
            </mesh>
          </group>
        ))}
      </group>
      <ContactShadow position={[0, 0.006, 0]} radius={0.24} opacity={0.5} />
    </AssetSlot>
  );
}

export function Furniture() {
  return (
    <>
      <Chair />
      <Plant />
    </>
  );
}
