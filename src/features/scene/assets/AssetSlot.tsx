'use client';

/**
 * A swap point for a single room object.
 *
 * Renders the production GLTF when `ASSET_MANIFEST[id].gltfPath` is set,
 * otherwise renders the `children` placeholder. The transform props apply to
 * BOTH paths, so a placeholder and its future model share identical placement —
 * swapping is purely a manifest edit.
 */
import { Suspense, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { type Group } from 'three';
import { ASSET_MANIFEST, type AssetId } from './assetManifest';

interface AssetSlotProps {
  id: AssetId;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

/** Isolated so `useGLTF` is only ever called when a real path exists. */
function LoadedModel({ path }: { path: string }) {
  const { scene } = useGLTF(path) as unknown as { scene: Group };
  return <primitive object={scene} />;
}

export function AssetSlot({ id, children, position, rotation, scale }: AssetSlotProps) {
  const { gltfPath } = ASSET_MANIFEST[id];
  return (
    <group position={position} rotation={rotation} scale={scale} name={`asset:${id}`}>
      {gltfPath ? (
        <Suspense fallback={children}>
          <LoadedModel path={gltfPath} />
        </Suspense>
      ) : (
        children
      )}
    </group>
  );
}
