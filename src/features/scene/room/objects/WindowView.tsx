'use client';

/**
 * What the window looks out on: the city at night, in the rain.
 *
 * One quad where the glass is, and a small shader that turns it into a view
 * with depth instead of a picture stuck to the wall:
 *
 *  - **The city** is four painted layers (`textures/skyline.ts`): sky, a far
 *    skyline, a middle row of towers, and near buildings. Each is looked up
 *    where the view ray through that pixel would meet a plane at the layer's
 *    distance behind the glass, so the layers slide against each other as the
 *    camera moves — the push-in, the parallax, the turn to the left wall.
 *    Red aircraft lights blink on the tallest roofs.
 *  - **The rain** falls *outside*, between the layers: three sheets of
 *    streaks at different distances, the near one fast and long, the far one
 *    fine. They pick up the colour of the lights behind them.
 *  - **The glass** is wet: beads that swell and dry, and drops that run down
 *    it in stops and starts, leaving trails. Each one is a tiny lens — the
 *    city is refracted inside it — and the film of mist on the rest of the
 *    pane softens the view slightly, except where a drop has just wiped it.
 *
 * Why it moves: the room's whole premise is "indoors on a rainy night", and
 * the window is the only place the weather is visible. It replaces the old
 * flat skyline texture and the instanced streaks that fell *inside* the glass.
 *
 * Cost: one draw call, four texture reads and some arithmetic over the
 * window's pixels — no extra render passes, no geometry. Time only advances
 * while the room is on screen; under reduced motion it is frozen (a still,
 * wet window).
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import { useExperienceStore } from '@/stores/experienceStore';
import { PLACEMENT, WINDOW_SIZE } from '../layout';
import { usePainted } from '../usePainted';
import {
  SKYLINE,
  SKY_VIEW,
  createFarSkyline,
  createMidSkyline,
  createNearSkyline,
  createSkyTexture,
  type SkylineBeacon,
  type SkylineLayerId,
} from '../textures/skyline';

/**
 * The view ray through the middle of the window from the desk pose, as
 * tangents (x/z, y/z). The layers are positioned so that, from the desk, the
 * middle of each texture sits in the middle of the window.
 */
const DESK_SLOPE_X = -0.53;

/** x0, bottom, width, height of a layer's slab, for the shader. */
function slab(id: SkylineLayerId): Vector4 {
  const { depth, width, height, bottom } = SKYLINE[id];
  const x0 = PLACEMENT.window[0] + DESK_SLOPE_X * depth - width / 2;
  return new Vector4(x0, bottom, width, height);
}

const MAX_BEACONS = 3;

function beaconUniform(beacons: readonly SkylineBeacon[]): Vector2[] {
  return Array.from({ length: MAX_BEACONS }, (_, i) => {
    const beacon = beacons[i];
    // parked far outside the texture when a layer has fewer lights
    return beacon ? new Vector2(beacon.u, beacon.v) : new Vector2(0, -10);
  });
}

const VERTEX = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  varying vec2 vPane;

  void main() {
    vPane = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FRAGMENT = /* glsl */ `
  #include <fog_pars_fragment>

  uniform sampler2D uSky;
  uniform sampler2D uFar;
  uniform sampler2D uMid;
  uniform sampler2D uNear;
  uniform vec4 uFarSlab;
  uniform vec4 uMidSlab;
  uniform vec4 uNearSlab;
  uniform vec3 uDepths;
  uniform vec4 uSkyView;
  uniform vec2 uFarBeacons[${MAX_BEACONS}];
  uniform vec2 uMidBeacons[${MAX_BEACONS}];
  uniform vec2 uPaneSize;
  uniform float uTime;
  uniform float uGain;
  uniform float uMist;

  varying vec3 vWorld;
  varying vec2 vPane;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  /* ------------------------------ wet glass ------------------------------ */

  // Small beads that swell, sit, and dry. xy: lens offset, z: coverage.
  vec3 beads(vec2 p, float t) {
    vec2 g = p * 26.0;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float r = hash21(id);
    vec2 centre = (vec2(hash21(id + 7.7), hash21(id + 3.3)) - 0.5) * 0.6;
    float life = fract(t * 0.045 * (0.5 + r) + r * 7.0);
    float size = (0.07 + 0.17 * r * r) * smoothstep(0.0, 0.08, life) * smoothstep(1.0, 0.7, life);
    float present = step(0.6, hash21(id + 1.3));
    vec2 d = f - centre;
    float m = smoothstep(size, size * 0.5, length(d)) * present;
    return vec3(d / max(size, 0.001) * m, m);
  }

  // Drops that run down the pane in stops and starts, each leaving a trail.
  // xy: lens offset, z: coverage of the drop itself, w: its trail.
  vec4 runners(vec2 p, float t, float columns, float seed) {
    const float TALL = 5.0;
    vec2 g = vec2(p.x * columns, p.y * columns / TALL);
    float column = floor(g.x);
    g.y += hash21(vec2(column, seed)) * 11.0;
    vec2 id = floor(g);
    vec2 f = fract(g);
    float r = hash21(id + seed);
    float clock = t * (0.07 + 0.08 * r) + r * 5.0;
    float cycle = floor(clock);
    float s = fract(clock);
    // stick, slip, stick, slip — four hesitations on the way down
    float progress = (floor(s * 4.0) + smoothstep(0.25, 1.0, fract(s * 4.0))) / 4.0;
    float y = mix(0.94, 0.06, progress);
    float present = step(0.42, hash21(id + cycle * 1.37 + seed));
    float x = 0.5 + (r - 0.5) * 0.5 + 0.07 * sin(y * 17.0 + r * 6.28);
    float alive = smoothstep(0.0, 0.06, s) * smoothstep(1.0, 0.9, s);
    float radius = (0.13 + 0.07 * r) * alive;

    vec2 d = vec2(f.x - x, (f.y - y) * TALL);
    // a drop is a little taller than wide, and heavier at the bottom
    float m = smoothstep(radius, radius * 0.55, length(d * vec2(1.0, 0.82))) * present;

    float above = f.y - y;
    float trail =
      smoothstep(radius * 0.7, radius * 0.15, abs(f.x - x)) *
      step(0.0, above) *
      exp(-above * 3.2) *
      alive *
      present;
    return vec4(d / max(radius, 0.001) * m, m, trail);
  }

  /* ------------------------------- rain ---------------------------------- */

  // One sheet of falling streaks, in metres on its own plane.
  float streaks(vec2 q, float density, float speed, float seed) {
    q.x += q.y * 0.11;
    vec2 g = vec2(q.x * density, q.y * density * 0.1);
    float column = floor(g.x);
    float r = hash21(vec2(column, seed));
    g.y += uTime * speed * (0.75 + 0.5 * r) + r * 23.0;
    vec2 id = floor(g);
    vec2 f = fract(g);
    float present = step(0.5, hash21(id + seed));
    float x = 0.2 + 0.6 * hash21(id + seed + 3.1);
    float line = smoothstep(0.07, 0.0, abs(f.x - x));
    // bright at the head, fading up the tail
    float body = smoothstep(0.0, 0.03, f.y) * smoothstep(0.3, 0.0, f.y);
    return line * body * present;
  }

  /* ------------------------------- city ---------------------------------- */

  vec2 slabUv(vec2 pane, vec2 slope, float depth, vec4 slabRect) {
    vec2 q = pane + slope * depth;
    return (q - slabRect.xy) / slabRect.zw;
  }

  // A red light on a rooftop, blinking slowly, haloed by the wet air.
  vec3 beacon(vec2 uv, vec2 at, vec4 slabRect, float phase) {
    vec2 d = vec2((fract(uv.x - at.x + 0.5) - 0.5) * slabRect.z, (uv.y - at.y) * slabRect.w);
    float blink = smoothstep(0.55, 0.95, sin(uTime * 1.7 + phase) * 0.5 + 0.5);
    float core = exp(-dot(d, d) / 0.0007);
    float halo = exp(-dot(d, d) / 0.012);
    return vec3(1.0, 0.16, 0.12) * (core * 1.6 + halo * 0.35) * (0.25 + 0.75 * blink);
  }

  void main() {
    // where on the pane, in metres from its lower-left corner
    vec2 p = vPane * uPaneSize;

    // --- the wet glass decides how each pixel looks through --------------
    vec3 bead = beads(p, uTime);
    vec4 big = runners(p, uTime, 9.0, 1.0);
    vec4 small = runners(p + 3.7, uTime * 1.2, 15.0, 9.0);
    vec2 lens = bead.xy * 0.6 + big.xy + small.xy * 0.8;
    float drop = clamp(bead.z + big.z + small.z, 0.0, 1.0);
    float wiped = clamp(drop + big.w + small.w, 0.0, 1.0);
    float mist = uMist * (1.0 - wiped);

    // --- the view ray, bent where it passes through a drop --------------
    vec3 ray = vWorld - cameraPosition;
    vec2 slope = ray.xy / max(-ray.z, 0.001);
    slope -= lens * 0.24;
    vec2 pane = vWorld.xy;

    // --- sky --------------------------------------------------------------
    vec2 skyUv = (slope - uSkyView.xy) / uSkyView.zw;
    vec3 colour = texture2D(uSky, clamp(skyUv, 0.0, 1.0), mist).rgb;
    vec3 haze = vec3(0.16, 0.1, 0.24);

    // --- far skyline, in the haze, with its warning lights ---------------
    vec2 uvFar = slabUv(pane, slope, uDepths.x, uFarSlab);
    vec4 cityFar = texture2D(uFar, vec2(uvFar.x, clamp(uvFar.y, 0.0, 1.0)), mist);
    colour = mix(colour, mix(cityFar.rgb, haze, 0.3), cityFar.a);
    for (int i = 0; i < ${MAX_BEACONS}; i++) {
      colour += beacon(uvFar, uFarBeacons[i], uFarSlab, float(i) * 2.1) * 0.7;
    }
    vec2 rainFar = pane + slope * 4.0;
    float glow = 0.35 + dot(colour, vec3(0.5, 0.6, 0.9));
    colour += vec3(0.55, 0.62, 0.9) * streaks(rainFar, 30.0, 2.6, 5.0) * 0.1 * glow;

    // --- middle distance --------------------------------------------------
    vec2 uvMid = slabUv(pane, slope, uDepths.y, uMidSlab);
    vec4 cityMid = texture2D(uMid, vec2(uvMid.x, clamp(uvMid.y, 0.0, 1.0)), mist);
    colour = mix(colour, mix(cityMid.rgb, haze, 0.1), cityMid.a);
    for (int i = 0; i < ${MAX_BEACONS}; i++) {
      colour += beacon(uvMid, uMidBeacons[i], uMidSlab, float(i) * 1.3 + 0.9);
    }
    vec2 rainMid = pane + slope * 1.6;
    glow = 0.35 + dot(colour, vec3(0.5, 0.6, 0.9));
    colour += vec3(0.6, 0.68, 0.95) * streaks(rainMid, 20.0, 3.4, 11.0) * 0.15 * glow;

    // --- across the street -------------------------------------------------
    vec2 uvNear = slabUv(pane, slope, uDepths.z, uNearSlab);
    vec4 cityNear = texture2D(uNear, vec2(uvNear.x, clamp(uvNear.y, 0.0, 1.0)), mist * 0.6);
    colour = mix(colour, cityNear.rgb, cityNear.a);
    vec2 rainNear = pane + slope * 0.5;
    glow = 0.4 + dot(colour, vec3(0.5, 0.6, 0.9));
    colour += vec3(0.7, 0.78, 1.0) * streaks(rainNear, 12.0, 4.6, 17.0) * 0.2 * glow;

    // --- the glass itself --------------------------------------------------
    // drops gather light; their lower edge catches the room
    colour *= 1.0 + drop * 0.22;
    colour += vec3(0.5, 0.6, 0.95) * drop * smoothstep(0.2, 0.9, -lens.y) * 0.07;
    // a breath of condensation toward the edges of the pane
    vec2 edge = min(vPane, 1.0 - vPane);
    float fogged = 1.0 - smoothstep(0.0, 0.14, min(edge.x, edge.y));
    colour = mix(colour, vec3(0.2, 0.22, 0.38), fogged * 0.16 * (1.0 - wiped));

    gl_FragColor = vec4(colour * uGain, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function WindowView() {
  const phase = useExperienceStore((s) => s.phase);
  const prefersInstant = useExperienceStore((s) => s.prefersInstantEntry);
  const invalidate = useThree((s) => s.invalidate);

  const sky = usePainted(createSkyTexture, []);
  const far = useMemo(createFarSkyline, []);
  const mid = useMemo(createMidSkyline, []);
  const near = useMemo(createNearSkyline, []);
  useEffect(
    () => () => {
      far.texture.dispose();
      mid.texture.dispose();
      near.texture.dispose();
    },
    [far, mid, near],
  );

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        fog: true,
        uniforms: {
          ...UniformsUtils.clone(UniformsLib.fog),
          uSky: { value: sky },
          uFar: { value: far.texture },
          uMid: { value: mid.texture },
          uNear: { value: near.texture },
          uFarSlab: { value: slab('far') },
          uMidSlab: { value: slab('mid') },
          uNearSlab: { value: slab('near') },
          uDepths: {
            value: new Vector3(SKYLINE.far.depth, SKYLINE.mid.depth, SKYLINE.near.depth),
          },
          uSkyView: {
            value: new Vector4(
              SKY_VIEW.minX,
              SKY_VIEW.minY,
              SKY_VIEW.maxX - SKY_VIEW.minX,
              SKY_VIEW.maxY - SKY_VIEW.minY,
            ),
          },
          uFarBeacons: { value: beaconUniform(far.beacons) },
          uMidBeacons: { value: beaconUniform(mid.beacons) },
          uPaneSize: { value: new Vector2(WINDOW_SIZE.width, WINDOW_SIZE.height) },
          // a fixed moment, so a still frame (reduced motion) has rain in it
          uTime: { value: 20 },
          uGain: { value: 1.12 },
          uMist: { value: 0.9 },
        },
      }),
    [sky, far, mid, near],
  );
  useEffect(() => () => material.dispose(), [material]);

  // Weather runs only while the room is on screen, and not at all for
  // visitors who asked for reduced motion.
  const running =
    !prefersInstant &&
    (phase === 'reveal' || phase === 'room_idle' || phase === 'zooming');

  useFrame((state) => {
    if (!running) return;
    const time = material.uniforms.uTime;
    if (time) time.value = 20 + state.clock.elapsedTime;
    invalidate();
  });

  return (
    <mesh position={[0, 0, 0.004]} material={material}>
      <planeGeometry args={[WINDOW_SIZE.width, WINDOW_SIZE.height]} />
    </mesh>
  );
}
