'use client';

/**
 * A cheap "blob shadow" — a soft radial-gradient decal laid flat on whatever
 * surface an object rests on. Stands in for real ambient occlusion (no
 * postprocessing pipeline in this project, and adding one would be an
 * architecture change, not atmosphere polish): grounds objects visually so
 * they read as resting on the desk/floor rather than floating a fraction
 * above it.
 *
 * One canvas texture, generated once and shared by every instance — dozens
 * of these across the room cost one draw call's worth of texture memory,
 * not dozens. `depthWrite={false}` so overlapping decals don't fight each
 * other or the shadow map; real shadow-casting lights still do the actual
 * directional shadow work, this only darkens the contact point itself.
 */
import { useMemo } from 'react';
import { CanvasTexture, DoubleSide } from 'three';

let sharedTexture: CanvasTexture | null = null;

function getBlobTexture(): CanvasTexture {
  if (sharedTexture) return sharedTexture;
  const size = 64;
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
    gradient.addColorStop(0, 'rgba(0,0,0,0.9)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0.4)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  sharedTexture = new CanvasTexture(canvas);
  sharedTexture.needsUpdate = true;
  return sharedTexture;
}

interface ContactShadowProps {
  /** World position, sitting just above the resting surface (avoid z-fighting). */
  position: [number, number, number];
  /** Radius in world units. */
  radius?: number;
  opacity?: number;
  /** Non-uniform footprint (e.g. an elongated object) — [x, z] scale multipliers. */
  scale?: [number, number];
}

export function ContactShadow({
  position,
  radius = 0.08,
  opacity = 0.32,
  scale = [1, 1],
}: ContactShadowProps) {
  const texture = useMemo(() => getBlobTexture(), []);

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[scale[0], scale[1], 1]}
    >
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
