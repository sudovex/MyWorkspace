'use client';

/**
 * A protein shaker on the desk, right of the calendar. Clicking it opens the
 * gallery on the Gym album.
 *
 * Smoky translucent body with a chocolate shake inside and a printed scale,
 * a black screw lid with a carry loop, and a hi-viz yellow flip cap — the
 * same yellow as the helmet, so the two "life outside work" objects belong
 * together. Hover gives it a quick shake, the way you would before drinking.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MathUtils, type Group } from 'three';
import { useHotspot } from '../../interaction/useHotspot';
import { HitArea } from '../HitArea';
import { PLACEMENT } from '../layout';
import { useCanvasFonts } from '../useCanvasFonts';
import { usePainted } from '../usePainted';
import { createShakerTexture } from '../textures/props';
import { ContactShadow } from '../effects/ContactShadow';

const BODY = { radiusTop: 0.037, radiusBottom: 0.033, height: 0.13, y0: 0.006 } as const;
const LID = { radius: 0.0385, height: 0.027 } as const;
const LID_Y = BODY.y0 + BODY.height;
const HI_VIZ = '#d6f03c';
const BLACK = { color: '#121318', roughness: 0.55, metalness: 0.1 } as const;
/** Turns the printed side toward the desk camera. */
const FACING = 2.95;

export function Shaker() {
  const fonts = useCanvasFonts();
  const label = usePainted(() => createShakerTexture(fonts), [fonts.epoch]);
  const { hoveredRef, handlers } = useHotspot('shaker');
  const bottle = useRef<Group>(null);
  const shake = useRef(0);

  useFrame((state, delta) => {
    shake.current = MathUtils.damp(shake.current, hoveredRef.current ? 1 : 0, 6, delta);
    const g = bottle.current;
    if (!g) return;
    const s = shake.current;
    const t = state.clock.elapsedTime;
    g.position.y = s * 0.012;
    g.rotation.z = s * 0.09 * Math.sin(t * 14);
    g.rotation.x = s * 0.04 * Math.sin(t * 14 + 1.3);
  });

  return (
    <group position={[...PLACEMENT.shaker]} rotation={[0, FACING, 0]}>
      <group ref={bottle}>
        {/* base ring */}
        <mesh position={[0, BODY.y0 / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry
            args={[BODY.radiusBottom, BODY.radiusBottom + 0.001, BODY.y0, 32]}
          />
          <meshStandardMaterial {...BLACK} />
        </mesh>
        {/* the shake inside — drawn first, seen through the body */}
        <mesh position={[0, BODY.y0 + 0.04, 0]}>
          <cylinderGeometry args={[0.0325, 0.0305, 0.078, 28]} />
          <meshStandardMaterial color="#6a4632" roughness={0.6} />
        </mesh>
        <mesh position={[0, BODY.y0 + 0.0795, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.0325, 28]} />
          <meshStandardMaterial color="#8a6146" roughness={0.45} />
        </mesh>
        {/* translucent body with the printed scale */}
        <mesh position={[0, BODY.y0 + BODY.height / 2, 0]} castShadow renderOrder={2}>
          <cylinderGeometry
            args={[BODY.radiusTop, BODY.radiusBottom, BODY.height, 40, 1, true]}
          />
          <meshStandardMaterial
            map={label}
            transparent
            depthWrite={false}
            roughness={0.25}
            metalness={0.05}
            side={2}
          />
        </mesh>

        {/* screw lid: a ridged band and the dome */}
        <mesh position={[0, LID_Y + LID.height / 2, 0]} castShadow>
          <cylinderGeometry args={[LID.radius - 0.002, LID.radius, LID.height, 36]} />
          <meshStandardMaterial {...BLACK} />
        </mesh>
        <mesh position={[0, LID_Y + 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[LID.radius + 0.0004, 0.0018, 8, 40]} />
          <meshStandardMaterial {...BLACK} roughness={0.4} />
        </mesh>
        {/* flip cap, hi-viz like the helmet */}
        <RoundedBox
          args={[0.024, 0.011, 0.03]}
          radius={0.004}
          smoothness={3}
          position={[0, LID_Y + LID.height + 0.005, -0.012]}
          castShadow
        >
          <meshStandardMaterial color={HI_VIZ} roughness={0.45} />
        </RoundedBox>
        {/* carry loop at the back of the lid */}
        <mesh
          position={[0, LID_Y + LID.height, 0.017]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
        >
          <torusGeometry args={[0.013, 0.0032, 8, 20, Math.PI]} />
          <meshStandardMaterial {...BLACK} />
        </mesh>
      </group>

      <HitArea size={[0.12, 0.22, 0.12]} position={[0, 0.1, 0]} handlers={handlers} />
      <ContactShadow position={[0, 0.0012, 0]} radius={0.055} opacity={0.55} />
    </group>
  );
}
