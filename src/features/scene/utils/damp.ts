import { MathUtils, type Vector3 } from 'three';

/**
 * Framerate-independent exponential smoothing for a Vector3, mutating `current`
 * toward `target`. `lambda` is the smoothing rate (higher = snappier). Built on
 * `THREE.MathUtils.damp` so no external animation dependency is required.
 */
export function dampVector3(
  current: Vector3,
  target: Vector3,
  lambda: number,
  delta: number,
): void {
  current.set(
    MathUtils.damp(current.x, target.x, lambda, delta),
    MathUtils.damp(current.y, target.y, lambda, delta),
    MathUtils.damp(current.z, target.z, lambda, delta),
  );
}
