'use client';

/**
 * The monitor's body: everything that is not the picture.
 *
 * Modelled on a modern slim display rather than a box with a screen in it:
 *
 *  - **Panel.** A thin graphite slab whose metal edge shows as a fine rim
 *    around a glossy black bezel — narrow at the sides and top, a little
 *    deeper at the chin — and a rounded hump on the back where the
 *    electronics live, so from the side it tapers like the real thing.
 *  - **Cover glass.** A faint sheen across the whole front, picture and
 *    bezel (a diagonal band, the top edge, the lamp's warm reflection), so it
 *    reads as one sheet of glass with light on it instead of a flat sticker.
 *  - **Details.** A webcam lens in the top bezel, a small monogram on the
 *    chin, a power LED.
 *  - **Stand.** A low-profile foot with a softened edge and a curved arm,
 *    lighter metal than the panel, rising to a hinge at the back of the panel.
 *  - **Cable.** One black lead from the back of the panel, down behind the
 *    arm and off the back of the desk.
 *
 * Everything is procedural and static; materials do the work (metal and a
 * glossy bezel pick up the studio environment and the lamp). The screen,
 * its lights and its hover response stay in `Monitor.tsx`.
 */
import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  ExtrudeGeometry,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';
import { SCREEN } from '../layout';
import { usePainted } from '../usePainted';
import { createChinMarkTexture, createGlassSheenTexture } from '../textures/props';
import { useCanvasFonts } from '../useCanvasFonts';
import { ContactShadow } from '../effects/ContactShadow';

const SCREEN_Y = SCREEN.center[1];
/** The glass sits a hair in front of the panel's face (local z). */
const GLASS_Z = 0.016;

/** Black bezel around the picture, and the metal rim around the bezel. */
const BEZEL = { side: 0.012, top: 0.012, chin: 0.026 } as const;
const RIM = 0.0032;

export const PANEL = {
  width: SCREEN.width + 2 * (BEZEL.side + RIM),
  height: SCREEN.height + BEZEL.top + BEZEL.chin + 2 * RIM,
  centerY: SCREEN_Y + (BEZEL.top - BEZEL.chin) / 2,
  depth: 0.014,
  /** Panel slab centre, local z — its face is just behind the glass. */
  z: GLASS_Z - 0.008,
} as const;

/** Where the arm meets the back of the panel. */
const HINGE = { y: SCREEN_Y - 0.08, z: -0.037, radius: 0.011 } as const;
const ARM_WIDTH = 0.058;
const FOOT = { width: 0.27, depth: 0.17, height: 0.008, z: -0.02 } as const;

/** The panel's shell: dark anodised metal, light enough that its edge reads as a rim. */
const GRAPHITE = { color: '#30333d', roughness: 0.3, metalness: 0.82 } as const;
/** The stand: brushed silver, so it separates from the dark panel behind it. */
const ALUMINIUM = {
  color: '#b0b6c1',
  roughness: 0.3,
  metalness: 0.92,
  envMapIntensity: 1.9,
} as const;

/**
 * The arm's side profile, extruded across its width. Drawn with u = -z
 * (toward the back of the desk) and v = height, then turned so the extrusion
 * runs along x: a slab that leans gently forward as it rises, wider where it
 * plants on the foot.
 */
function armGeometry(): ExtrudeGeometry {
  const top = HINGE.y + 0.006;
  const front = (z: number) => -z;
  const shape = new Shape();
  shape.moveTo(front(-0.06), FOOT.height);
  shape.quadraticCurveTo(front(-0.058), top * 0.55, front(HINGE.z - 0.002), top);
  shape.lineTo(front(HINGE.z - 0.02), top);
  shape.quadraticCurveTo(front(-0.082), top * 0.45, front(-0.104), FOOT.height);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: ARM_WIDTH - 0.006,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -(ARM_WIDTH - 0.006) / 2);
  geometry.rotateY(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** The power lead: out of the back of the panel, behind the arm, off the desk. */
function cableGeometry(): TubeGeometry {
  const curve = new CatmullRomCurve3(
    [
      [0.03, HINGE.y + 0.05, -0.028],
      [0.034, HINGE.y - 0.02, -0.07],
      [0.036, 0.12, -0.112],
      [0.04, 0.03, -0.12],
      [0.05, 0.0045, -0.14],
      [0.1, 0.0045, -0.19],
      [0.13, 0.0045, -0.228],
      [0.14, -0.06, -0.24],
    ].map(([x, y, z]) => new Vector3(x, y, z)),
  );
  return new TubeGeometry(curve, 64, 0.0032, 8, false);
}

export function MonitorBody() {
  const fonts = useCanvasFonts();
  const sheen = usePainted(createGlassSheenTexture, []);
  const mark = usePainted(() => createChinMarkTexture(fonts), [fonts.epoch]);
  const arm = useMemo(armGeometry, []);
  const cable = useMemo(cableGeometry, []);
  useEffect(
    () => () => {
      arm.dispose();
      cable.dispose();
    },
    [arm, cable],
  );

  const backZ = PANEL.z - PANEL.depth / 2;

  return (
    <group>
      {/* ---- stand ---- */}
      <RoundedBox
        args={[FOOT.width, FOOT.height, FOOT.depth]}
        radius={0.0038}
        smoothness={4}
        position={[0, FOOT.height / 2, FOOT.z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...ALUMINIUM} />
      </RoundedBox>
      {/* a rubber ring under the foot, just visible as a dark seam */}
      <mesh position={[0, 0.0006, FOOT.z]}>
        <boxGeometry args={[FOOT.width - 0.012, 0.0012, FOOT.depth - 0.012]} />
        <meshStandardMaterial color="#050506" roughness={0.95} />
      </mesh>
      <mesh geometry={arm} castShadow receiveShadow>
        <meshStandardMaterial {...ALUMINIUM} />
      </mesh>
      {/* hinge: a barrel across the top of the arm, into the panel's back */}
      <mesh position={[0, HINGE.y, HINGE.z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[HINGE.radius, HINGE.radius, ARM_WIDTH + 0.02, 24]} />
        <meshStandardMaterial {...GRAPHITE} />
      </mesh>
      <mesh position={[0, HINGE.y, (HINGE.z + backZ) / 2 - 0.004]} castShadow>
        <boxGeometry args={[ARM_WIDTH * 0.8, 0.05, HINGE.z * -1 + backZ - 0.004]} />
        <meshStandardMaterial {...GRAPHITE} />
      </mesh>

      {/* ---- panel ---- */}
      <RoundedBox
        args={[PANEL.width, PANEL.height, PANEL.depth]}
        radius={0.006}
        smoothness={4}
        position={[0, PANEL.centerY, PANEL.z]}
        castShadow
      >
        <meshStandardMaterial {...GRAPHITE} />
      </RoundedBox>
      {/* the back: a rounded hump where the electronics live */}
      <RoundedBox
        args={[PANEL.width * 0.66, PANEL.height * 0.62, 0.026]}
        radius={0.012}
        smoothness={5}
        position={[0, PANEL.centerY - PANEL.height * 0.06, backZ - 0.008]}
        castShadow
      >
        <meshStandardMaterial {...GRAPHITE} />
      </RoundedBox>
      {/* vents along the top of the hump, seen from the wide shot */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (i - 6.5) * 0.022,
            PANEL.centerY - PANEL.height * 0.06 + PANEL.height * 0.31 - 0.001,
            backZ - 0.012,
          ]}
        >
          <boxGeometry args={[0.012, 0.002, 0.012]} />
          <meshStandardMaterial color="#050507" roughness={0.9} />
        </mesh>
      ))}

      {/* glossy black bezel, framed by the metal rim */}
      <mesh position={[0, PANEL.centerY, GLASS_Z - 0.0006]}>
        <planeGeometry args={[PANEL.width - 2 * RIM, PANEL.height - 2 * RIM]} />
        <meshStandardMaterial
          color="#040507"
          roughness={0.16}
          metalness={0.2}
          envMapIntensity={0.9}
        />
      </mesh>

      {/* the cover glass, edge to edge over picture and bezel: reflections */}
      <mesh position={[0, PANEL.centerY, GLASS_Z + 0.0009]} renderOrder={3}>
        <planeGeometry args={[PANEL.width - 2 * RIM, PANEL.height - 2 * RIM]} />
        <meshBasicMaterial
          map={sheen}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* webcam in the top bezel: a dark lens with a glint */}
      <mesh
        position={[0, SCREEN_Y + SCREEN.height / 2 + BEZEL.top / 2, GLASS_Z - 0.0003]}
      >
        <circleGeometry args={[0.0034, 20]} />
        <meshStandardMaterial color="#0d1424" roughness={0.1} metalness={0.6} />
      </mesh>
      <mesh
        position={[
          0.0011,
          SCREEN_Y + SCREEN.height / 2 + BEZEL.top / 2 + 0.001,
          GLASS_Z - 0.0001,
        ]}
      >
        <circleGeometry args={[0.0008, 10]} />
        <meshBasicMaterial color={[0.7, 0.85, 1.4]} toneMapped={false} />
      </mesh>

      {/* the owner's monogram, small and quiet, centred on the chin */}
      <mesh
        position={[0, SCREEN_Y - SCREEN.height / 2 - BEZEL.chin / 2, GLASS_Z - 0.0002]}
      >
        <planeGeometry args={[0.032, 0.012]} />
        <meshBasicMaterial map={mark} transparent opacity={0.42} depthWrite={false} />
      </mesh>

      {/* power LED in the chin */}
      <mesh
        position={[
          SCREEN.width / 2 - 0.006,
          SCREEN_Y - SCREEN.height / 2 - BEZEL.chin / 2,
          GLASS_Z - 0.0002,
        ]}
      >
        <circleGeometry args={[0.0022, 12]} />
        <meshBasicMaterial color={[0.6, 2.2, 1.2]} toneMapped={false} />
      </mesh>

      <mesh geometry={cable} castShadow>
        <meshStandardMaterial color="#0b0b0e" roughness={0.6} />
      </mesh>

      <ContactShadow
        position={[0, 0.0011, FOOT.z]}
        radius={0.1}
        scale={[1.45, 0.95]}
        opacity={0.55}
      />
    </group>
  );
}
