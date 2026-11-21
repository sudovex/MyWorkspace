'use client';

/**
 * Dust motes suspended in the lamp's light cone. Visible only once the camera
 * has arrived at the desk, and only while the lamp is switched on — the
 * literal enforcement of the core inversion (`DESIGN_PHILOSOPHY.md` §2): dust
 * can only be evidence of light that's already there.
 *
 * A small, bounded sprite system (no shader, no extra dependency): a soft
 * radial dot baked into a canvas texture once, reused across all instances.
 * Motion is a gentle bounded sine bob per axis, not unidirectional drift —
 * simpler than a wrap-around scheme and reads as "suspended," which is what
 * dust in still air actually looks like.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  type Points,
} from 'three';
import { useExperienceStore } from '@/stores/experienceStore';

const COUNT = 48;
/** Roughly the lamp's light cone — see `Lamp.tsx`'s head position. */
const CENTER: readonly [number, number, number] = [0.5, 0.26, -0.42];
const SPREAD: readonly [number, number, number] = [0.2, 0.2, 0.18];

function createSoftDotTexture(): CanvasTexture {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255,238,214,0.9)');
    gradient.addColorStop(1, 'rgba(255,238,214,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function Dust() {
  const pointsRef = useRef<Points>(null);
  const phase = useExperienceStore((s) => s.phase);
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);
  const invalidate = useThree((s) => s.invalidate);

  const lampOn = useExperienceStore((s) => s.lampOn);
  const visible = lampOn && (phase === 'room_idle' || phase === 'zooming');

  const { geometry, positionAttr, basePositions, freqs, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const base = new Float32Array(COUNT * 3);
    const f = new Float32Array(COUNT * 3);
    const p = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      const x = CENTER[0] + (Math.random() * 2 - 1) * SPREAD[0];
      const y = CENTER[1] + (Math.random() * 2 - 1) * SPREAD[1];
      const z = CENTER[2] + (Math.random() * 2 - 1) * SPREAD[2];
      positions.set([x, y, z], i * 3);
      base.set([x, y, z], i * 3);
      f.set(
        [
          0.15 + Math.random() * 0.2,
          0.1 + Math.random() * 0.15,
          0.15 + Math.random() * 0.2,
        ],
        i * 3,
      );
      p.set(
        [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ],
        i * 3,
      );
    }
    const geom = new BufferGeometry();
    const attr = new Float32BufferAttribute(positions, 3);
    geom.setAttribute('position', attr);
    return {
      geometry: geom,
      positionAttr: attr,
      basePositions: base,
      freqs: f,
      phases: p,
    };
  }, []);

  const texture = useMemo(() => createSoftDotTexture(), []);

  useEffect(() => {
    if (pointsRef.current) pointsRef.current.visible = visible;
    invalidate();
  }, [visible, invalidate]);

  useFrame((state) => {
    if (!visible || prefersInstant) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < COUNT; i += 1) {
      const ix = i * 3;
      const amp: readonly [number, number, number] = [0.02, 0.015, 0.02];
      positionAttr.setXYZ(
        i,
        basePositions[ix]! + Math.sin(t * freqs[ix]! + phases[ix]!) * amp[0],
        basePositions[ix + 1]! + Math.sin(t * freqs[ix + 1]! + phases[ix + 1]!) * amp[1],
        basePositions[ix + 2]! + Math.sin(t * freqs[ix + 2]! + phases[ix + 2]!) * amp[2],
      );
    }
    positionAttr.needsUpdate = true;
    invalidate();
  });

  return (
    <points ref={pointsRef} geometry={geometry} visible={false}>
      <pointsMaterial
        map={texture}
        size={0.012}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
