'use client';

/**
 * A tiny procedural environment map — three soft light cards rendered once
 * into a cube map. Nothing is fetched (no HDRI): it exists so glossy surfaces
 * (the helmet's visor, the camera lens, the monitor's stand, the mug's coffee)
 * have something to reflect, in the room's own colours.
 */
import { Environment, Lightformer } from '@react-three/drei';

export function Studio() {
  return (
    <Environment resolution={64} frames={1} environmentIntensity={0.3}>
      <color attach="background" args={['#05060c']} />
      {/* warm card — where the lamp is */}
      <Lightformer
        form="rect"
        intensity={5}
        color="#ffb070"
        position={[4, 2, -1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[4, 3, 1]}
      />
      {/* cool card — where the window is */}
      <Lightformer
        form="rect"
        intensity={3.5}
        color="#7fa4ff"
        position={[-4, 2.5, -2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[4, 4, 1]}
      />
      {/* soft overhead */}
      <Lightformer
        form="circle"
        intensity={1.2}
        color="#b9c4ff"
        position={[0, 5, 1]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={5}
      />
      {/* monitor glow from the front */}
      <Lightformer
        form="rect"
        intensity={2}
        color="#8f9dff"
        position={[0, 1, 5]}
        rotation={[0, Math.PI, 0]}
        scale={[3, 1.6, 1]}
      />
    </Environment>
  );
}
