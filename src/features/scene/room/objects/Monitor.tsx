'use client';

/**
 * The monitor — the room's focal point and the doorway into the terminal.
 *
 * The glass (`monitor-screen`) shows a live, canvas-painted terminal that
 * types its own tour of the workspace (`textures/screen.ts`). Clicking the
 * monitor sends the camera in; once it lands, the DOM terminal in
 * `features/os/` is laid exactly over this mesh and takes over — same colours,
 * same chrome, so it reads as one machine.
 *
 * The housing, stand and cover glass are in `MonitorBody.tsx`.
 *
 * Around it: a bias light washing the wall behind the panel, and a cool key
 * that makes the keyboard and desk read as lit by the screen. Hovering
 * brightens both — the monitor leans toward you a little before you click.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  CanvasTexture,
  LinearFilter,
  MathUtils,
  SRGBColorSpace,
  type MeshBasicMaterial,
  type PointLight,
} from 'three';
import { AssetSlot } from '../../assets/AssetSlot';
import { MonitorBody } from './MonitorBody';
import { useExperienceStore } from '@/stores/experienceStore';
import { useHotspot } from '../../interaction/useHotspot';
import { HitArea } from '../HitArea';
import { PLACEMENT, SCREEN } from '../layout';
import { useCanvasFonts } from '../useCanvasFonts';
import { usePainted } from '../usePainted';
import { Glow } from '../Glow';
import { createGlowTexture } from '../textures/surfaces';
import { createStickyTexture } from '../textures/props';
import { SCREEN_TEXTURE_SIZE, paintIdleScreen } from '../textures/screen';

const SCREEN_Y = SCREEN.center[1];
const SCREEN_LOCAL_Z = SCREEN.center[2] - PLACEMENT.monitor[2];
const REPAINT_MS = 80;

export function Monitor() {
  const fonts = useCanvasFonts();
  const { hoveredRef, handlers } = useHotspot('monitor');
  const phase = useExperienceStore((s) => s.phase);

  const screenMaterial = useRef<MeshBasicMaterial>(null);
  const glowMaterial = useRef<MeshBasicMaterial>(null);
  const keyLight = useRef<PointLight>(null);
  const biasLight = useRef<PointLight>(null);
  const highlight = useRef(0);
  const lastPaint = useRef(-Infinity);

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = SCREEN_TEXTURE_SIZE.width;
    c.height = SCREEN_TEXTURE_SIZE.height;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    // Re-uploaded several times a second: skip the mip chain entirely.
    t.generateMipmaps = false;
    t.minFilter = LinearFilter;
    return { canvas: c, texture: t };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const glowTexture = usePainted(
    () => createGlowTexture('rgba(120,120,255,0.9)', 'rgba(120,120,255,0)'),
    [],
  );
  const stickyTexture = usePainted(() => createStickyTexture(fonts), [fonts.epoch]);

  useFrame((state, delta) => {
    highlight.current = MathUtils.damp(
      highlight.current,
      hoveredRef.current ? 1 : 0,
      6,
      delta,
    );
    const h = highlight.current;
    const breathe = 0.03 * Math.sin(state.clock.elapsedTime * 1.2);

    if (screenMaterial.current) {
      screenMaterial.current.color.setScalar(1.08 + h * 0.3 + breathe);
    }
    if (glowMaterial.current) glowMaterial.current.opacity = 0.34 + h * 0.3 + breathe;
    if (keyLight.current) keyLight.current.intensity = 0.55 + h * 0.5;
    if (biasLight.current) biasLight.current.intensity = 1.5 + h * 0.9;

    // Repaint the idle terminal at ~12fps — plenty for typed text and a
    // blinking cursor, and it keeps a 1024×576 upload off most frames.
    const nowMs = state.clock.elapsedTime * 1000;
    if (phase !== 'os_active' && nowMs - lastPaint.current >= REPAINT_MS) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        paintIdleScreen(ctx, fonts, nowMs, h);
        texture.needsUpdate = true;
        lastPaint.current = nowMs;
      }
    }
  });

  return (
    <AssetSlot id="monitor" position={[...PLACEMENT.monitor]}>
      <MonitorBody />

      {/* the glass — self-lit, never tone-mapped, so text stays crisp */}
      <mesh name="monitor-screen" position={[0, SCREEN_Y, SCREEN_LOCAL_Z]}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
        <meshBasicMaterial ref={screenMaterial} map={texture} toneMapped={false} />
      </mesh>

      {/* sticky note on the bezel's corner */}
      <mesh
        position={[SCREEN.width / 2 - 0.02, SCREEN_Y - SCREEN.height / 2 + 0.01, 0.0162]}
        rotation={[0, 0, -0.09]}
      >
        <planeGeometry args={[0.062, 0.062]} />
        <meshStandardMaterial map={stickyTexture} roughness={0.9} />
      </mesh>

      {/* bias light: a soft indigo wash on the wall behind the panel */}
      <mesh position={[0, SCREEN_Y + 0.02, -0.3]}>
        <planeGeometry args={[2.3, 1.5]} />
        <meshBasicMaterial
          ref={glowMaterial}
          map={glowTexture}
          transparent
          opacity={0.34}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={biasLight}
        position={[0, SCREEN_Y, -0.16]}
        color="#6f66ff"
        intensity={1.5}
        distance={1.7}
        decay={2}
      />
      {/* the screen's own light on the desk and keyboard */}
      <pointLight
        ref={keyLight}
        position={[0, SCREEN_Y - 0.05, 0.3]}
        color="#9bbcff"
        intensity={0.55}
        distance={1.5}
        decay={2}
      />

      {/* the screen's sheen on the desk in front of it — painted (see `Glow`) */}
      <Glow
        position={[0, 0.0022, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[1.15, 0.6]}
        color={[0.35, 0.5, 1.0]}
        opacity={0.2}
      />
      {/* an LED strip along the desk's back edge, grazing up the wall */}
      <mesh position={[0, 0.006, -0.215]}>
        <boxGeometry args={[1.5, 0.006, 0.008]} />
        <meshBasicMaterial color={[1.3, 0.9, 3.0]} toneMapped={false} />
      </mesh>
      <Glow
        position={[0, 0.2, -0.312]}
        size={[2.5, 0.62]}
        color={[0.42, 0.3, 1.0]}
        opacity={0.34}
      />

      {/* forgiving pointer target */}
      <HitArea
        size={[SCREEN.width + 0.1, SCREEN.height + 0.1, 0.12]}
        position={[0, SCREEN_Y, 0.04]}
        handlers={handlers}
      />
    </AssetSlot>
  );
}
