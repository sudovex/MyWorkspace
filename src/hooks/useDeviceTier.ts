'use client';

/**
 * Coarse device capability tiering, used to scale the 3D experience:
 *  - `high`   : full scene, shadows, higher DPR
 *  - `medium` : full scene, reduced shadow quality / DPR
 *  - `low`    : skip WebGL entirely, serve the static fallback
 *
 * Uses cheap, dependency-free heuristics (cores, memory, coarse pointer, and a
 * one-shot WebGL renderer probe). This is deliberately conservative; a heavier
 * GPU benchmark (e.g. `detect-gpu`) can replace `probeRenderer` later without
 * changing the public API.
 */
import { useEffect, useState } from 'react';

export type DeviceTier = 'high' | 'medium' | 'low';

/** Substrings in the GPU renderer string that indicate low-end hardware. */
const LOW_END_GPU_HINTS = ['swiftshader', 'llvmpipe', 'software', 'mali-4', 'adreno 3'];

function probeRenderer(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : null;
  } catch {
    return null;
  }
}

/**
 * Manual override for debugging / QA: `?tier=high|medium|low` in the URL wins
 * over detection (e.g. to force the 3D scene on a software renderer).
 */
function tierOverride(): DeviceTier | null {
  const value = new URLSearchParams(window.location.search).get('tier');
  return value === 'high' || value === 'medium' || value === 'low' ? value : null;
}

function detectTier(): DeviceTier {
  const override = tierOverride();
  if (override) return override;

  // No WebGL at all → the scene cannot run.
  const renderer = probeRenderer();
  if (renderer === null && !window.WebGLRenderingContext) return 'low';

  const rendererLc = renderer?.toLowerCase() ?? '';
  if (LOW_END_GPU_HINTS.some((hint) => rendererLc.includes(hint))) return 'low';

  const cores = navigator.hardwareConcurrency ?? 4;
  // `deviceMemory` is non-standard; treat absence as "unknown, assume ok".
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (cores <= 4 || memory <= 4) return coarsePointer ? 'low' : 'medium';
  if (cores <= 6 || memory <= 6) return 'medium';
  return 'high';
}

export function useDeviceTier(): DeviceTier | null {
  // `null` until measured on the client — callers gate rendering on this so the
  // WebGL canvas never mounts during SSR or before tiering is known.
  const [tier, setTier] = useState<DeviceTier | null>(null);

  useEffect(() => {
    setTier(detectTier());
  }, []);

  return tier;
}
