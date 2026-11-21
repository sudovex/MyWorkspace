'use client';

/**
 * A low-profile mechanical keyboard and a mouse. The keycaps are one instanced
 * mesh; a warm strip underneath shows through the gaps as backlight (single
 * amber, never RGB — the room's one warm accent on the machine side).
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Matrix4, type InstancedMesh } from 'three';
import { AssetSlot } from '../../assets/AssetSlot';
import { PLACEMENT } from '../layout';

const COLS = 15;
const ROWS = 5;
const PITCH = 0.0272;
const KEY = 0.0232;
const KEY_HEIGHT = 0.009;

interface KeySpec {
  x: number;
  z: number;
  width: number;
}

function buildKeys(): KeySpec[] {
  const keys: KeySpec[] = [];
  const originX = -((COLS - 1) * PITCH) / 2;
  const originZ = -((ROWS - 1) * PITCH) / 2;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      // Bottom row: a 6-unit space bar in the middle.
      if (row === ROWS - 1 && col >= 4 && col <= 9) {
        if (col === 4) {
          keys.push({
            x: originX + 6.5 * PITCH,
            z: originZ + row * PITCH,
            width: PITCH * 6 - (PITCH - KEY),
          });
        }
        continue;
      }
      keys.push({ x: originX + col * PITCH, z: originZ + row * PITCH, width: KEY });
    }
  }
  return keys;
}

export function Keyboard() {
  const meshRef = useRef<InstancedMesh>(null);
  const keys = useMemo(buildKeys, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    keys.forEach((key, i) => {
      matrix.makeScale(key.width / KEY, 1, 1);
      matrix.setPosition(key.x, 0, key.z);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [keys]);

  return (
    <>
      <AssetSlot
        id="keyboard"
        position={[...PLACEMENT.keyboard]}
        rotation={[0, -0.03, 0]}
      >
        <group rotation={[0.045, 0, 0]}>
          <RoundedBox
            args={[COLS * PITCH + 0.02, 0.016, ROWS * PITCH + 0.02]}
            radius={0.006}
            position={[0, 0.011, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#1a1c24" roughness={0.42} metalness={0.6} />
          </RoundedBox>
          {/* backlight plate */}
          <mesh position={[0, 0.0195, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[COLS * PITCH + 0.004, ROWS * PITCH + 0.004]} />
            <meshBasicMaterial color={[2.4, 1.25, 0.45]} toneMapped={false} />
          </mesh>
          <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, keys.length]}
            position={[0, 0.0195 + KEY_HEIGHT / 2, 0]}
            castShadow
          >
            <boxGeometry args={[KEY, KEY_HEIGHT, KEY]} />
            <meshStandardMaterial color="#23262f" roughness={0.6} metalness={0.1} />
          </instancedMesh>
        </group>
      </AssetSlot>

      <AssetSlot id="mouse" position={[...PLACEMENT.mouse]} rotation={[0, 0.22, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.014, 0]} scale={[1, 0.52, 1.7]}>
          <sphereGeometry args={[0.03, 24, 16]} />
          <meshStandardMaterial color="#1b1d25" roughness={0.35} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.0285, -0.016]} rotation={[-Math.PI / 2 + 0.25, 0, 0]}>
          <planeGeometry args={[0.004, 0.014]} />
          <meshBasicMaterial color={[2.2, 1.2, 0.5]} toneMapped={false} />
        </mesh>
      </AssetSlot>
    </>
  );
}
