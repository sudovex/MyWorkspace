'use client';

/**
 * A full-face motorcycle helmet, kept on the left of the desk — the one object
 * in the room that's about the person rather than the engineer. Clicking it
 * opens the gallery.
 *
 * Modelled on the owner's own helmet, and set down the way he photographed
 * it: three-quarters on, nose toward you and to the left, so the visor, one
 * flank's livery and the crown are all in view from the desk camera.
 *
 *  - **Shell:** one sphere sculpted into a helmet's proportions (`shape`) —
 *    longer than it is wide, a chin bar that juts forward, a nape that tucks
 *    in, a spoiler lip, a flat base — with the eye port actually sunk into
 *    it, so there is depth behind the visor rather than a painted-on window.
 *  - **Visor:** a clear shield standing proud of the shell — a patch of the
 *    same surface, tapering toward round pivots on either side, with a
 *    brighter rim so its edge reads against the dark shell. You look through
 *    it at the liner and cheek pads.
 *  - **Details:** the crown vent, a brow vent and a chin vent, each mounted
 *    on the sculpted surface along its true normal.
 *  - **Livery:** a painted texture (`textures/helmet.ts`).
 *
 * It holds its pose (it is the pose that shows the helmet off); hovering
 * lifts it a touch and brightens the visor's edge.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  DoubleSide,
  MathUtils,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Group,
  type MeshStandardMaterial,
} from 'three';
import { AssetSlot } from '../../assets/AssetSlot';
import { useHotspot } from '../../interaction/useHotspot';
import { HitArea } from '../HitArea';
import { PLACEMENT } from '../layout';
import { useCanvasFonts } from '../useCanvasFonts';
import { usePainted } from '../usePainted';
import { EYE_PORT, createHelmetLiveryTexture } from '../textures/helmet';
import { ContactShadow } from '../effects/ContactShadow';

/** Half the shell's width. Everything else is a proportion of this. */
const R = 0.136;
/** Where the shell is cut flat to sit on the desk, as a fraction of `R`. */
const BASE = -0.8;
/** In three's sphere parametrisation, +Z (the helmet's nose) is phi = π/2. */
const FRONT = Math.PI / 2;
/** Nose toward the camera and ~40° to its left — the angle of the photo. */
const YAW = -0.34;
/** How far the eye port is sunk into the shell, as a fraction of the radius. */
const PORT_DEPTH = 0.1;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Unit direction for three's sphere angles. */
function direction(phi: number, theta: number): Vector3 {
  return new Vector3(
    -Math.cos(phi) * Math.sin(theta),
    Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Where a point on the unit sphere ends up on the helmet (in metres).
 * `inflate` pushes the result outward and skips the eye-port recess — that is
 * the surface the visor and the mounted details live on.
 */
function shape(d: Vector3, inflate = 0): Vector3 {
  const { x, y, z } = d;
  // 0 above the brow line → 1 down at the jaw.
  const jaw = smoothstep(0.08, -0.6, y);
  const front = Math.max(0, z);
  const back = Math.max(0, -z);

  let px = x * (1 + jaw * 0.03);
  let py = y * (y > 0 ? 1.03 : 1);
  let pz = z * 1.24;
  // the chin bar juts forward and squares off
  pz += jaw * front ** 1.5 * 0.26;
  // the nape tucks in under the back of the head
  pz += jaw * back ** 1.3 * 0.14;
  // a spoiler lip trailing off the upper rear of the shell
  pz -= smoothstep(0, 0.35, y) * smoothstep(0.85, 0.45, y) * back ** 2 * 0.08;

  let k = 1 + inflate;
  if (inflate === 0) {
    // Sink the eye port. Same region the livery paints as the opening.
    const a = Math.atan2(Math.abs(x), z) / Math.PI;
    const t = Math.acos(Math.min(1, Math.max(-1, y))) / Math.PI;
    const inside =
      smoothstep(EYE_PORT.halfWidth + 0.01, EYE_PORT.halfWidth - 0.024, a) *
      smoothstep(EYE_PORT.top - 0.006, EYE_PORT.top + 0.024, t) *
      smoothstep(EYE_PORT.bottom + 0.006, EYE_PORT.bottom - 0.024, t);
    k -= PORT_DEPTH * inside;
  }
  px *= k;
  py *= k;
  pz *= k;
  // flat base
  py = Math.max(py, BASE);
  return new Vector3(px * R, py * R, pz * R);
}

/** Reshape a full sphere in place into the shell. */
function sculptShell(geometry: SphereGeometry): BufferGeometry {
  const position = geometry.getAttribute('position');
  const v = new Vector3();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i).normalize();
    const p = shape(v);
    position.setXYZ(i, p.x, p.y, p.z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();

  // A sphere's seam duplicates a column of vertices; after recomputing normals
  // the two copies disagree and the seam shows as a hairline. Average them.
  const { widthSegments, heightSegments } = geometry.parameters;
  const normal = geometry.getAttribute('normal');
  const a = new Vector3();
  const b = new Vector3();
  for (let row = 0; row <= heightSegments; row += 1) {
    const first = row * (widthSegments + 1);
    const last = first + widthSegments;
    a.fromBufferAttribute(normal, first);
    b.fromBufferAttribute(normal, last);
    a.add(b).normalize();
    normal.setXYZ(first, a.x, a.y, a.z);
    normal.setXYZ(last, a.x, a.y, a.z);
  }
  normal.needsUpdate = true;
  return geometry;
}

/* --------------------------------- visor --------------------------------- */

/** The shield's extent: azimuth either side of the nose, and its polar span. */
const VISOR = {
  halfWidth: 1.33,
  top: Math.PI * 0.338,
  bottom: Math.PI * 0.612,
  /** The pivots' height; the shield tapers toward it at the sides. */
  pivot: Math.PI * 0.49,
  inflate: 0.034,
} as const;

/**
 * A strip of the visor between two fractions of its height (0 = top edge,
 * 1 = bottom edge). The full shield is `visorPatch(0, 1)`; its rims are thin
 * strips of the same surface, pushed out a hair further.
 */
function visorPatch(
  from: number,
  to: number,
  inflate: number,
  rows: number,
): BufferGeometry {
  const geometry = new SphereGeometry(
    1,
    56,
    rows,
    FRONT - VISOR.halfWidth,
    VISOR.halfWidth * 2,
    MathUtils.lerp(VISOR.top, VISOR.bottom, from),
    (VISOR.bottom - VISOR.top) * (to - from),
  );
  const position = geometry.getAttribute('position');
  const v = new Vector3();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i).normalize();
    const phi = Math.atan2(v.z, -v.x);
    const theta = Math.acos(Math.min(1, Math.max(-1, v.y)));
    // Toward the pivots the shield narrows into a rounded ear.
    const side = Math.min(1, Math.abs(phi - FRONT) / VISOR.halfWidth);
    const taper = 1 - 0.62 * side ** 2.6;
    const p = shape(direction(phi, VISOR.pivot + (theta - VISOR.pivot) * taper), inflate);
    position.setXYZ(i, p.x, p.y, p.z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/* ------------------------- details on the surface ------------------------ */

/**
 * A frame sitting on the helmet's (un-recessed) surface at the given sphere
 * angles: +Y along the true surface normal, +Z running down the surface.
 */
function mount(azimuth: number, theta: number, inflate: number) {
  const phi = FRONT + azimuth;
  const e = 0.006;
  const p = shape(direction(phi, theta), inflate);
  const down = shape(direction(phi, theta + e), inflate)
    .sub(p)
    .normalize();
  const around = shape(direction(phi + e, theta), inflate)
    .sub(p)
    .normalize();
  const normal = new Vector3().crossVectors(around, down).normalize();
  if (normal.dot(direction(phi, theta)) < 0) normal.negate();
  const across = new Vector3().crossVectors(normal, down).normalize();
  const z = new Vector3().crossVectors(across, normal).normalize();
  return {
    position: p,
    quaternion: new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(across, normal, z),
    ),
  };
}

const PLASTIC = { color: '#0d0e11', roughness: 0.32, metalness: 0.35 } as const;

/** A slotted vent: a low block with dark slats across it. */
function Vent({
  theta,
  size,
  slats,
}: {
  theta: number;
  size: readonly [width: number, height: number, length: number];
  slats: number;
}) {
  const frame = useMemo(() => mount(0, theta, 0.012), [theta]);
  const [width, height, length] = size;
  return (
    <group position={frame.position} quaternion={frame.quaternion}>
      <mesh castShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial {...PLASTIC} />
      </mesh>
      {Array.from({ length: slats }, (_, i) => (
        <mesh
          key={i}
          position={[0, height / 2 + 0.0004, ((i + 0.5) / slats - 0.5) * length * 0.72]}
        >
          <boxGeometry args={[width * 0.72, 0.001, (length * 0.72) / slats / 2.2]} />
          <meshStandardMaterial color="#000000" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** The visor's round pivot cover, with its coin-slot screw. */
function Pivot({ side }: { side: 1 | -1 }) {
  const frame = useMemo(
    () => mount(side * 1.19, VISOR.pivot, VISOR.inflate + 0.012),
    [side],
  );
  return (
    <group position={frame.position} quaternion={frame.quaternion}>
      <mesh castShadow>
        <cylinderGeometry args={[0.026, 0.029, 0.009, 32]} />
        <meshStandardMaterial color="#1a1b20" roughness={0.38} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.0052, 0]}>
        <cylinderGeometry args={[0.0165, 0.0165, 0.003, 24]} />
        <meshStandardMaterial {...PLASTIC} />
      </mesh>
      <mesh position={[0, 0.007, 0]}>
        <boxGeometry args={[0.004, 0.0012, 0.02]} />
        <meshStandardMaterial color="#000000" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* --------------------------------- helmet -------------------------------- */

export function Helmet() {
  const fonts = useCanvasFonts();
  const livery = usePainted(() => createHelmetLiveryTexture(fonts), [fonts.epoch]);
  const groupRef = useRef<Group>(null);
  const rimRef = useRef<MeshStandardMaterial>(null);
  const lift = useRef(0);
  const { hoveredRef, handlers } = useHotspot('helmet');

  const shell = useMemo(() => sculptShell(new SphereGeometry(1, 128, 80)), []);
  const shield = useMemo(() => visorPatch(0, 1, VISOR.inflate, 20), []);
  const rims = useMemo(
    () => [
      visorPatch(0, 0.07, VISOR.inflate + 0.004, 2),
      visorPatch(0.94, 1, VISOR.inflate + 0.004, 2),
    ],
    [],
  );
  useEffect(
    () => () => {
      shell.dispose();
      shield.dispose();
      rims.forEach((rim) => rim.dispose());
    },
    [shell, shield, rims],
  );

  useFrame((_, delta) => {
    lift.current = MathUtils.damp(lift.current, hoveredRef.current ? 1 : 0, 6, delta);
    if (groupRef.current) groupRef.current.position.y = lift.current * 0.012;
    if (rimRef.current) rimRef.current.emissiveIntensity = 0.12 + lift.current * 0.6;
  });

  return (
    <AssetSlot id="helmet" position={[...PLACEMENT.helmet]}>
      <HitArea
        size={[R * 2.5, R * 2.1, R * 3]}
        position={[0, R * 0.95, 0]}
        handlers={handlers}
      />
      <group ref={groupRef} rotation={[0, YAW, 0]}>
        <group position={[0, -BASE * R + 0.001, 0]}>
          {/* shell — matte paint; a little self-illumination keeps the hi-viz
              yellow fluorescing in a room lit mostly in blue and violet */}
          <mesh geometry={shell} castShadow receiveShadow>
            <meshStandardMaterial
              map={livery}
              emissiveMap={livery}
              emissive="#ffffff"
              emissiveIntensity={0.42}
              roughness={0.55}
              metalness={0.04}
            />
          </mesh>

          {/* visor — clear: mostly reflection, a little tint, and you see
              through it into the sunk eye port */}
          <mesh geometry={shield} renderOrder={3}>
            <meshStandardMaterial
              color="#c9d6f2"
              transparent
              opacity={0.24}
              roughness={0.16}
              metalness={1}
              envMapIntensity={2.6}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* its top and bottom edges, catching the light */}
          {rims.map((rim, i) => (
            <mesh key={i} geometry={rim} renderOrder={4}>
              <meshStandardMaterial
                ref={i === 0 ? rimRef : undefined}
                color="#b9c4d8"
                transparent
                opacity={i === 0 ? 0.55 : 0.35}
                roughness={0.18}
                metalness={0.6}
                emissive="#9fb6ff"
                emissiveIntensity={0.12}
                envMapIntensity={3}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
          <Pivot side={1} />
          <Pivot side={-1} />

          {/* crown vent, brow vent, chin vent */}
          <Vent theta={Math.PI * 0.15} size={[0.052, 0.013, 0.082]} slats={4} />
          <Vent theta={Math.PI * 0.305} size={[0.06, 0.007, 0.016]} slats={1} />
          <Vent theta={Math.PI * 0.675} size={[0.05, 0.008, 0.026]} slats={3} />
        </group>
      </group>
      <ContactShadow position={[0, 0.0012, 0]} radius={0.22} opacity={0.55} />
    </AssetSlot>
  );
}
