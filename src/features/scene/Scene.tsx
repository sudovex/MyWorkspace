'use client';

/**
 * The WebGL runtime root.
 *
 * Performance posture — the scene is built to hold 60fps on an integrated GPU:
 *  - `frameloop="demand"`: frames are drawn only when something asks. Inside
 *    the monitor's OS, and behind an open panel, nothing is drawn at all.
 *  - Resolution is capped (retina panels do not get a full 2× buffer — bloom
 *    hides the difference, the fill-rate saving is ~45%) and adapts downward
 *    if the frame rate drops (`PerformanceMonitor`), ending in a "lean" mode
 *    without shadows or post-processing rather than a slideshow.
 *  - One shadow-casting light, one shadow pass, and the shadow map is cached:
 *    it is only redrawn while something that casts a shadow is moving
 *    (`RenderDirector`).
 *  - Four dynamic lights. Everything else that glows is an unlit surface.
 *
 * Default-exported for `dynamic(..., { ssr: false })` — WebGL never mounts on
 * the server.
 */
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { type DeviceTier } from '@/hooks/useDeviceTier';
import { useExperienceStore } from '@/stores/experienceStore';
import { Room } from './room/Room';
import { Lighting } from './environment/Lighting';
import { Studio } from './environment/Studio';
import { Effects } from './environment/Effects';
import { CameraRig } from './camera/CameraRig';
import { GuideProjector } from './interaction/GuideProjector';
import { CAMERA_FOV, CAMERA_POSES } from './camera/poses';

interface TierConfig {
  /** Upper bound on the render resolution multiplier. */
  maxDpr: number;
  /** Never adapt below this. */
  minDpr: number;
  shadowMapSize: number;
  effects: boolean;
}

const TIER_CONFIG: Record<Exclude<DeviceTier, 'low'>, TierConfig> = {
  high: { maxDpr: 1.5, minDpr: 1, shadowMapSize: 2048, effects: true },
  medium: { maxDpr: 1.25, minDpr: 0.85, shadowMapSize: 1024, effects: true },
};

const LITE_CONFIG: TierConfig = {
  maxDpr: 0.75,
  minDpr: 0.75,
  shadowMapSize: 0,
  effects: false,
};

/**
 * `?quality=lite` — a QA escape hatch: no shadows, no post-processing, reduced
 * resolution. Useful on software renderers and for profiling what the effects
 * cost. It is also where adaptive quality ends up on a GPU that cannot keep up.
 */
function liteRequested(): boolean {
  return new URLSearchParams(window.location.search).get('quality') === 'lite';
}

const BACKDROP = '#06070d';
const DPR_STEP = 0.25;
/** Frames drawn before the scene is declared warmed up. */
const WARM_UP_FRAMES = 3;
/** Shadows keep refreshing this long after the last hover ends (hover eases out). */
const SHADOW_SETTLE_S = 1.4;

/**
 * Two jobs that belong to the renderer rather than to any object:
 *  - **Warm-up.** Compile every shader up front and draw a few frames behind
 *    the boot cover, then tell the store the scene is ready.
 *  - **Shadow caching.** The room's shadow casters only move while the pointer
 *    is over one of them, so the shadow map is frozen and re-rendered only
 *    then (and for a moment after, while the hover eases out).
 */
function RenderDirector() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const frames = useRef(0);
  const settleFor = useRef(SHADOW_SETTLE_S);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    gl.compile(scene, camera);
    invalidate();
    return () => {
      gl.shadowMap.autoUpdate = true;
      useExperienceStore.getState().setSceneReady(false);
    };
  }, [gl, scene, camera, invalidate]);

  useFrame((_, delta) => {
    if (frames.current < WARM_UP_FRAMES) {
      frames.current += 1;
      gl.shadowMap.needsUpdate = true;
      if (frames.current === WARM_UP_FRAMES) {
        useExperienceStore.getState().setSceneReady(true);
      } else {
        invalidate();
      }
      return;
    }
    if (useExperienceStore.getState().hovered) settleFor.current = SHADOW_SETTLE_S;
    if (settleFor.current > 0) {
      settleFor.current -= delta;
      gl.shadowMap.needsUpdate = true;
    }
  });

  return null;
}

export default function Scene({ tier }: { tier: DeviceTier }) {
  const [lite] = useState(liteRequested);
  const base = lite || tier === 'low' ? LITE_CONFIG : TIER_CONFIG[tier];
  // Adaptive quality's last resort: keep the room, drop the expensive parts.
  const [lean, setLean] = useState(false);
  const cfg = lean ? { ...base, shadowMapSize: 0, effects: false } : base;

  const [deviceDpr] = useState(() => window.devicePixelRatio || 1);
  const maxDpr = Math.min(deviceDpr, base.maxDpr);
  const [dpr, setDpr] = useState(maxDpr);
  // Low-density displays are cheap to multisample; dense ones don't need it.
  const multisampling = dpr <= 1.25 && tier === 'high' ? 4 : 0;

  const onDecline = () => {
    if (dpr - DPR_STEP >= base.minDpr - 1e-6) setDpr((d) => d - DPR_STEP);
    else setLean(true);
  };

  return (
    <Canvas
      frameloop="demand"
      shadows={cfg.shadowMapSize > 0 ? 'soft' : false}
      dpr={dpr}
      gl={{
        antialias: !cfg.effects,
        stencil: false,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
      }}
      camera={{
        fov: CAMERA_FOV,
        near: 0.02,
        far: 30,
        position: [...CAMERA_POSES.roomWide.position],
      }}
    >
      {!lite && !lean && <PerformanceMonitor onDecline={onDecline} flipflops={4} />}
      <color attach="background" args={[BACKDROP]} />
      {/* Fog swallows the far floor and the open side of the diorama in the
          wide shot, and is too far out to touch anything at the desk. */}
      <fog attach="fog" args={[BACKDROP, 3.2, 10]} />
      <Studio />
      <Lighting />
      <Room shadowMapSize={cfg.shadowMapSize} />
      <CameraRig />
      <GuideProjector />
      <RenderDirector />
      {cfg.effects && <Effects multisampling={multisampling} />}
    </Canvas>
  );
}
