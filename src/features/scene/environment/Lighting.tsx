'use client';

/**
 * Ambient room lighting — the cool half of the room's warm/cool tension.
 *
 * Every *motivated* light lives with the thing that emits it: the warm key
 * with the lamp, the indigo bias and screen light with the monitor, the
 * moonlight with the window, the pink with the neon, the amber strip with the
 * shelf. What is left here is only the fill that keeps the shadows from going
 * to pure black: a low cool ambient and a sky/ground hemisphere.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.22} color="#8fa0d8" />
      <hemisphereLight args={['#3b4780', '#120d0a', 0.5]} />
    </>
  );
}
