'use client';

import { useEffect, useMemo, type DependencyList } from 'react';
import { type Texture } from 'three';

/**
 * `useMemo` for a procedurally painted texture that also frees the GPU copy
 * when the texture is replaced or the component unmounts.
 */
export function usePainted<T extends Texture>(factory: () => T, deps: DependencyList): T {
  // The factory is intentionally keyed only on the caller's explicit deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const texture = useMemo(factory, deps);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
