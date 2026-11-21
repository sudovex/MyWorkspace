'use client';

/**
 * Two floating shelves on the back wall — the bookshelf. One spine reads
 * RÉSUMÉ; hovering anywhere on the shelves slides that book out and lights it,
 * and clicking opens the résumé.
 *
 * Everything else is set dressing with a point: the titles a backend/identity
 * engineer actually keeps within reach, a camera, a trailing plant, and an
 * LED strip under the lower board that grazes the wall.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MathUtils, type Group, type MeshStandardMaterial } from 'three';
import { AssetSlot } from '../../assets/AssetSlot';
import { useHotspot } from '../../interaction/useHotspot';
import { HitArea } from '../HitArea';
import { PLACEMENT } from '../layout';
import { seeded } from '../textures/canvas';
import { useCanvasFonts } from '../useCanvasFonts';
import { usePainted } from '../usePainted';
import { Glow } from '../Glow';
import { createSpineTexture } from '../textures/props';

const BOARD = { width: 1.04, depth: 0.2, thickness: 0.026 } as const;
const UPPER_Y = 0.36;
const BOOK_DEPTH = 0.15;
const RESUME_INDEX = 4;
/**
 * The shelves are lit by their LED strips, which are painted rather than real
 * lights — so the books carry a little of their own colour as emission,
 * standing in for the light the strips would put on them.
 */
const BOOK_GLOW = 0.2;

const PALETTE = [
  '#2f4a7a',
  '#7a2f3b',
  '#2f6b5a',
  '#c9b48a',
  '#3a3550',
  '#a8562e',
  '#1f2a44',
  '#5a6b2f',
  '#8a8f9c',
] as const;

interface BookSpec {
  x: number;
  width: number;
  height: number;
  color: string;
  tilt: number;
}

function buildRow(seed: number, start: number, count: number): BookSpec[] {
  const rand = seeded(seed);
  const books: BookSpec[] = [];
  let x = start;
  for (let i = 0; i < count; i += 1) {
    const width = 0.026 + rand() * 0.024;
    const height = 0.185 + rand() * 0.07;
    books.push({
      x: x + width / 2,
      width,
      height,
      color: PALETTE[Math.floor(rand() * PALETTE.length)] ?? PALETTE[0],
      tilt: 0,
    });
    x += width + 0.0015;
  }
  // The last book leans on its neighbours — nothing stands perfectly square.
  const last = books[books.length - 1];
  if (last) {
    last.tilt = -0.16;
    last.x += 0.014;
  }
  return books;
}

export function Shelf() {
  const fonts = useCanvasFonts();
  const resumeSpine = usePainted(
    () => createSpineTexture(fonts, 'RÉSUMÉ', '#f1e4c8', '#1c1a22', '#d2562f'),
    [fonts.epoch],
  );
  const lowerRow = useMemo(() => buildRow(97, -BOARD.width / 2 + 0.05, 12), []);
  const upperRow = useMemo(() => buildRow(53, -BOARD.width / 2 + 0.33, 7), []);

  const resumeRef = useRef<Group>(null);
  const resumeMaterial = useRef<MeshStandardMaterial>(null);
  const pull = useRef(0);
  const { hoveredRef, handlers } = useHotspot('bookshelf');

  useFrame((_, delta) => {
    pull.current = MathUtils.damp(pull.current, hoveredRef.current ? 1 : 0, 6, delta);
    if (resumeRef.current) {
      resumeRef.current.position.z = BOARD.depth / 2 - 0.01 + pull.current * 0.07;
      resumeRef.current.rotation.x = pull.current * 0.1;
    }
    if (resumeMaterial.current) {
      resumeMaterial.current.emissiveIntensity = 0.16 + pull.current * 0.55;
    }
  });

  const boardY = (y: number) => y - BOARD.thickness / 2;

  return (
    <AssetSlot id="bookshelf" position={[...PLACEMENT.shelf]}>
      {[0, UPPER_Y].map((y) => (
        <group key={y}>
          <RoundedBox
            args={[BOARD.width, BOARD.thickness, BOARD.depth]}
            radius={0.006}
            position={[0, boardY(y), BOARD.depth / 2]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#3a271b" roughness={0.55} />
          </RoundedBox>
          {[-0.38, 0.38].map((x) => (
            <mesh key={x} position={[x, y - 0.06, 0.05]} castShadow>
              <boxGeometry args={[0.016, 0.1, 0.1]} />
              <meshStandardMaterial color="#111217" roughness={0.4} metalness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* LED strip under the lower board */}
      <mesh position={[0, -BOARD.thickness - 0.003, BOARD.depth - 0.03]}>
        <boxGeometry args={[BOARD.width - 0.08, 0.004, 0.008]} />
        <meshBasicMaterial color={[3.2, 1.9, 0.9]} toneMapped={false} />
      </mesh>
      <mesh position={[0, UPPER_Y - BOARD.thickness - 0.003, BOARD.depth - 0.03]}>
        <boxGeometry args={[BOARD.width - 0.08, 0.004, 0.008]} />
        <meshBasicMaterial color={[2.6, 1.6, 0.8]} toneMapped={false} />
      </mesh>
      <Glow
        position={[0, UPPER_Y - 0.17, 0.008]}
        size={[BOARD.width + 0.3, 0.42]}
        color={[1.0, 0.56, 0.22]}
        opacity={0.3}
      />
      {/* …and its graze down the wall — painted, not lit (see `Glow`) */}
      <Glow
        position={[0, -0.2, 0.008]}
        size={[BOARD.width + 0.5, 0.62]}
        color={[1.0, 0.56, 0.22]}
        opacity={0.42}
      />

      {/* lower row — the working library, RÉSUMÉ among it */}
      {lowerRow.map((book, i) =>
        i === RESUME_INDEX ? (
          <group
            key={i}
            ref={resumeRef}
            position={[book.x, 0.125, BOARD.depth / 2 - 0.01]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.046, 0.25, BOOK_DEPTH]} />
              <meshStandardMaterial
                ref={resumeMaterial}
                color="#f1e4c8"
                roughness={0.6}
                emissive="#ffb061"
                emissiveIntensity={0.16}
              />
            </mesh>
            <mesh position={[0, 0, BOOK_DEPTH / 2 + 0.0006]}>
              <planeGeometry args={[0.046, 0.25]} />
              <meshBasicMaterial map={resumeSpine} toneMapped={false} />
            </mesh>
          </group>
        ) : (
          <mesh
            key={i}
            castShadow
            position={[book.x, book.height / 2, BOARD.depth / 2 - 0.015]}
            rotation={[0, 0, book.tilt]}
          >
            <boxGeometry args={[book.width, book.height, BOOK_DEPTH]} />
            <meshStandardMaterial
              color={book.color}
              roughness={0.72}
              emissive={book.color}
              emissiveIntensity={BOOK_GLOW}
            />
          </mesh>
        ),
      )}

      {/* upper row: a few more books, a camera, a trailing plant */}
      {upperRow.map((book, i) => (
        <mesh
          key={i}
          castShadow
          position={[book.x, UPPER_Y + book.height / 2, BOARD.depth / 2 - 0.015]}
          rotation={[0, 0, book.tilt]}
        >
          <boxGeometry args={[book.width, book.height, BOOK_DEPTH]} />
          <meshStandardMaterial
            color={book.color}
            roughness={0.72}
            emissive={book.color}
            emissiveIntensity={BOOK_GLOW * 0.6}
          />
        </mesh>
      ))}
      <group position={[-0.36, UPPER_Y, 0.1]} rotation={[0, 0.35, 0]}>
        <RoundedBox
          args={[0.13, 0.085, 0.06]}
          radius={0.01}
          position={[0, 0.0425, 0]}
          castShadow
        >
          <meshStandardMaterial color="#17181d" roughness={0.5} metalness={0.4} />
        </RoundedBox>
        <mesh position={[0.012, 0.042, 0.045]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.033, 0.045, 28]} />
          <meshStandardMaterial color="#0c0d11" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0.012, 0.042, 0.0685]}>
          <circleGeometry args={[0.024, 28]} />
          <meshStandardMaterial
            color="#1a2b5c"
            roughness={0.05}
            metalness={1}
            envMapIntensity={2.5}
          />
        </mesh>
      </group>
      <group position={[0.38, UPPER_Y, 0.1]}>
        <mesh castShadow position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.05, 0.038, 0.08, 24]} />
          <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
        </mesh>
        {(
          [
            [0, 0.1, 0, 0.06],
            [0.04, 0.085, 0.02, 0.045],
            [-0.04, 0.09, 0.01, 0.05],
            [0.07, 0.02, 0.05, 0.04],
            [0.085, -0.06, 0.06, 0.036],
            [0.09, -0.14, 0.055, 0.03],
          ] as const
        ).map(([x, y, z, r], i) => (
          <mesh key={i} castShadow position={[x, y, z]}>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial
              color={i % 2 ? '#3f7a4e' : '#356b45'}
              roughness={0.85}
            />
          </mesh>
        ))}
      </group>

      {/* one generous pointer target for the whole unit */}
      <HitArea
        size={[BOARD.width + 0.06, 0.78, BOARD.depth + 0.12]}
        position={[0, 0.3, BOARD.depth / 2]}
        handlers={handlers}
      />
    </AssetSlot>
  );
}
