'use client';

/**
 * Generated stand-in artwork for gallery entries that don't have a photo yet:
 * layered-landscape scenes for the rides album, and moody gym still-lifes
 * (`GymArt`) for the gym album — all inline SVG, no image assets. Each scene
 * is a palette plus a handful of switches — sun or moon, ridges, a road, rain,
 * a skyline — and is fully deterministic, so a given entry always looks the
 * same.
 */
import { useId, useMemo } from 'react';
import { type PlaceholderScene } from '@/content';

interface SceneSpec {
  sky: readonly [string, string, string];
  orb: { x: number; y: number; r: number; color: string; glow: string } | null;
  ridges: readonly { y: number; amp: number; color: string }[];
  road?: string;
  rain?: boolean;
  stars?: boolean;
  skyline?: string;
  trees?: string;
  seed: number;
}

const W = 400;
const H = 300;

type GymScene = Extract<PlaceholderScene, `gym-${string}`>;
type LandscapeScene = Exclude<PlaceholderScene, GymScene>;

const isGymScene = (scene: PlaceholderScene): scene is GymScene =>
  scene.startsWith('gym-');

const SCENES: Record<LandscapeScene, SceneSpec> = {
  'mountain-road': {
    sky: ['#1c2350', '#b0563f', '#f0ad5c'],
    orb: { x: 250, y: 150, r: 26, color: '#ffe3a8', glow: '#ffb86b' },
    ridges: [
      { y: 168, amp: 40, color: '#74395a' },
      { y: 196, amp: 30, color: '#48294e' },
      { y: 232, amp: 18, color: '#22183a' },
    ],
    road: '#f2d9a6',
    seed: 3,
  },
  coast: {
    sky: ['#0f2a55', '#2f6f9a', '#f2c08a'],
    orb: { x: 120, y: 132, r: 20, color: '#fff0c9', glow: '#ffd39a' },
    ridges: [
      { y: 178, amp: 4, color: '#2a6a8f' },
      { y: 204, amp: 5, color: '#1d4d74' },
      { y: 238, amp: 26, color: '#12233f' },
    ],
    seed: 9,
  },
  'city-night': {
    sky: ['#070a1f', '#1a1f52', '#5a3274'],
    orb: { x: 310, y: 62, r: 14, color: '#eef3ff', glow: '#9fb6ff' },
    ridges: [{ y: 262, amp: 4, color: '#070914' }],
    skyline: '#0b0f24',
    stars: true,
    seed: 17,
  },
  forest: {
    sky: ['#0e2a2a', '#1f5a4a', '#b7c98a'],
    orb: { x: 200, y: 96, r: 34, color: '#f1f7c8', glow: '#cfe39a' },
    ridges: [
      { y: 190, amp: 22, color: '#1d4a3c' },
      { y: 226, amp: 14, color: '#12332b' },
    ],
    trees: '#0a211c',
    seed: 23,
  },
  dunes: {
    sky: ['#3a2a5c', '#d2764a', '#f6cf8a'],
    orb: { x: 300, y: 104, r: 22, color: '#fff2c4', glow: '#ffc27a' },
    ridges: [
      { y: 176, amp: 26, color: '#c9824e' },
      { y: 208, amp: 20, color: '#9a5a3c' },
      { y: 244, amp: 16, color: '#5c3329' },
    ],
    seed: 31,
  },
  workspace: {
    sky: ['#0b0f24', '#27304a', '#6f66ff'],
    orb: { x: 200, y: 150, r: 46, color: '#8fb4ff', glow: '#6f66ff' },
    ridges: [{ y: 236, amp: 2, color: '#6b4a33' }],
    seed: 41,
  },
  sunrise: {
    sky: ['#25305e', '#e0785a', '#ffd98a'],
    orb: { x: 200, y: 196, r: 38, color: '#fff4cf', glow: '#ffcf7a' },
    ridges: [
      { y: 200, amp: 24, color: '#5a3b5e' },
      { y: 236, amp: 14, color: '#2b2140' },
    ],
    road: '#ffe2b0',
    seed: 47,
  },
  monsoon: {
    sky: ['#101a2c', '#2c4257', '#6f8a94'],
    orb: null,
    ridges: [
      { y: 170, amp: 34, color: '#31505a' },
      { y: 204, amp: 26, color: '#213a44' },
      { y: 240, amp: 14, color: '#122228' },
    ],
    road: '#b9cbd0',
    rain: true,
    seed: 53,
  },
};

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ridgePath(y: number, amp: number, rand: () => number): string {
  const points: string[] = [`M0 ${H}`, `L0 ${y}`];
  let previous = y;
  for (let x = 25; x <= W; x += 25) {
    const next = y + (rand() - 0.5) * amp;
    points.push(`Q${x - 12.5} ${previous + (rand() - 0.5) * amp * 0.5} ${x} ${next}`);
    previous = next;
  }
  points.push(`L${W} ${H} Z`);
  return points.join(' ');
}

export function PlaceholderArt({ scene }: { scene: PlaceholderScene }) {
  if (isGymScene(scene)) return <GymArt scene={scene} />;
  return <Landscape scene={scene} />;
}

const IRON = '#090a12';
const EDGE = '#ffb86b';
const HI_VIZ = '#d6f03c';

/**
 * A dark gym under one warm overhead light: a loaded barbell on a rack, a
 * dumbbell rack, or a kettlebell beside a shaker — silhouettes with a rim of
 * lamplight, in the room's own palette.
 */
function GymArt({ scene }: { scene: GymScene }) {
  const uid = useId().replace(/:/g, '');
  const rim = { stroke: EDGE, strokeOpacity: 0.55, strokeWidth: 1.2 } as const;

  const plate = (x: number, h: number, w: number, key: string) => (
    <rect
      key={key}
      x={x}
      y={168 - h / 2}
      width={w}
      height={h}
      rx={3}
      fill={IRON}
      {...rim}
    />
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
      role="img"
      aria-label="Placeholder artwork"
    >
      <defs>
        <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0d1c" />
          <stop offset="0.7" stopColor="#1b1a2e" />
          <stop offset="1" stopColor="#2a2234" />
        </linearGradient>
        <radialGradient id={`${uid}-light`} cx="0.5" cy="0" r="0.9">
          <stop offset="0" stopColor="#ffcf8f" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ff9a5a" stopOpacity="0.12" />
          <stop offset="1" stopColor="#ff9a5a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14131f" />
          <stop offset="1" stopColor="#07070d" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-wall)`} />
      <rect width={W} height={H} fill={`url(#${uid}-light)`} />
      {/* rubber floor */}
      <rect y={236} width={W} height={H - 236} fill={`url(#${uid}-floor)`} />
      <line x1="0" y1="236" x2={W} y2="236" stroke={EDGE} strokeOpacity="0.18" />

      {scene === 'gym-barbell' && (
        <g>
          {/* rack uprights and J-hooks */}
          {[92, 300].map((x) => (
            <g key={x}>
              <rect x={x} y={70} width={10} height={166} fill={IRON} {...rim} />
              <rect x={x - 6} y={156} width={22} height={6} fill={IRON} {...rim} />
            </g>
          ))}
          {/* the bar */}
          <rect x={30} y={164} width={340} height={7} rx={3} fill="#2c2e3a" />
          <rect x={30} y={164} width={340} height={2} fill={EDGE} opacity="0.35" />
          {/* plates, big to small, both sides */}
          {[
            [58, 112, 13],
            [72, 112, 13],
            [86, 84, 9],
          ].map(([x, h, w], i) => plate(x ?? 0, h ?? 0, w ?? 0, `l${i}`))}
          {[
            [329, 112, 13],
            [315, 112, 13],
            [305, 84, 9],
          ].map(([x, h, w], i) => plate(x ?? 0, h ?? 0, w ?? 0, `r${i}`))}
          <rect x={60} y={163} width={9} height={9} fill={HI_VIZ} opacity="0.9" />
          <rect x={331} y={163} width={9} height={9} fill={HI_VIZ} opacity="0.9" />
        </g>
      )}

      {scene === 'gym-dumbbells' && (
        <g>
          {[150, 210].map((shelfY, row) => (
            <g key={shelfY}>
              <rect x={30} y={shelfY + 14} width={340} height={6} fill={IRON} {...rim} />
              {Array.from({ length: 6 }, (_, i) => {
                const size = 12 + i * 2 + row * 4;
                const x = 48 + i * 56;
                return (
                  <g key={i}>
                    <rect
                      x={x + size * 0.6}
                      y={shelfY + 3}
                      width={28 - size * 0.4}
                      height={4}
                      fill="#2c2e3a"
                    />
                    <rect
                      x={x}
                      y={shelfY + 5 - size / 2}
                      width={size * 0.75}
                      height={size}
                      rx={2}
                      fill={IRON}
                      {...rim}
                    />
                    <rect
                      x={x + 30}
                      y={shelfY + 5 - size / 2}
                      width={size * 0.75}
                      height={size}
                      rx={2}
                      fill={IRON}
                      {...rim}
                    />
                  </g>
                );
              })}
            </g>
          ))}
          {/* the frame of the rack */}
          <rect x={24} y={130} width={8} height={106} fill={IRON} {...rim} />
          <rect x={368} y={130} width={8} height={106} fill={IRON} {...rim} />
        </g>
      )}

      {scene === 'gym-kettlebell' && (
        <g>
          {/* kettlebell */}
          <path
            d="M168 158 C168 120, 232 120, 232 158"
            fill="none"
            stroke={IRON}
            strokeWidth={14}
            strokeLinecap="round"
          />
          <path
            d="M168 158 C168 120, 232 120, 232 158"
            fill="none"
            stroke={EDGE}
            strokeOpacity={0.4}
            strokeWidth={1.2}
          />
          <circle cx={200} cy={196} r={44} fill={IRON} {...rim} />
          <rect x={166} y={234} width={68} height={4} rx={2} fill={IRON} />
          {/* a shaker beside it, cap in hi-viz */}
          <rect x={268} y={170} width={30} height={66} rx={4} fill="#1d2230" {...rim} />
          <rect
            x={270}
            y={196}
            width={26}
            height={38}
            rx={3}
            fill="#6a4632"
            opacity="0.8"
          />
          <rect x={266} y={160} width={34} height={12} rx={3} fill={IRON} {...rim} />
          <rect x={276} y={153} width={14} height={7} rx={2} fill={HI_VIZ} />
          {/* a towel over a bench edge */}
          <path d="M40 236 L40 214 L120 210 L128 236 Z" fill="#232535" {...rim} />
        </g>
      )}
    </svg>
  );
}

function Landscape({ scene }: { scene: LandscapeScene }) {
  const uid = useId().replace(/:/g, '');
  const spec = SCENES[scene];

  const { ridges, stars, rain, towers, trees } = useMemo(() => {
    const rand = seeded(spec.seed);
    return {
      ridges: spec.ridges.map((r) => ridgePath(r.y, r.amp, rand)),
      stars: spec.stars
        ? Array.from({ length: 46 }, () => ({
            x: rand() * W,
            y: rand() * H * 0.55,
            r: 0.4 + rand() * 0.9,
          }))
        : [],
      rain: spec.rain
        ? Array.from({ length: 70 }, () => ({ x: rand() * (W + 60) - 30, y: rand() * H }))
        : [],
      towers: spec.skyline
        ? Array.from({ length: 16 }, (_, i) => ({
            x: i * 26 - 6 + rand() * 6,
            w: 18 + rand() * 14,
            h: 46 + rand() * 120,
            lit: Array.from({ length: 14 }, () => ({
              x: 3 + Math.floor(rand() * 3) * 6,
              y: 8 + Math.floor(rand() * 14) * 9,
              warm: rand() > 0.3,
            })),
          }))
        : [],
      trees: spec.trees
        ? Array.from({ length: 13 }, (_, i) => ({
            x: i * 34 - 10 + rand() * 14,
            h: 90 + rand() * 90,
            w: 30 + rand() * 18,
          }))
        : [],
    };
  }, [spec]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
      role="img"
      aria-label="Placeholder artwork"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={spec.sky[0]} />
          <stop offset="0.6" stopColor={spec.sky[1]} />
          <stop offset="1" stopColor={spec.sky[2]} />
        </linearGradient>
        {spec.orb && (
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor={spec.orb.glow} stopOpacity="0.75" />
            <stop offset="1" stopColor={spec.orb.glow} stopOpacity="0" />
          </radialGradient>
        )}
        <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#${uid}-sky)`} />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8eeff" opacity="0.8" />
      ))}
      {spec.orb && (
        <>
          <circle
            cx={spec.orb.x}
            cy={spec.orb.y}
            r={spec.orb.r * 3.6}
            fill={`url(#${uid}-glow)`}
          />
          <circle cx={spec.orb.x} cy={spec.orb.y} r={spec.orb.r} fill={spec.orb.color} />
        </>
      )}

      {towers.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${H - 34 - t.h})`}>
          <rect width={t.w} height={t.h + 40} fill={spec.skyline} />
          {t.lit.map((l, j) =>
            l.x < t.w - 4 && l.y < t.h ? (
              <rect
                key={j}
                x={l.x}
                y={l.y}
                width="2.4"
                height="3.4"
                fill={l.warm ? '#ffc27a' : '#8fd8ff'}
                opacity="0.9"
              />
            ) : null,
          )}
        </g>
      ))}

      {ridges.map((d, i) => (
        <path key={i} d={d} fill={spec.ridges[i]?.color} />
      ))}

      {trees.map((t, i) => (
        <path
          key={i}
          d={`M${t.x} ${H} L${t.x + t.w / 2} ${H - t.h} L${t.x + t.w} ${H} Z`}
          fill={spec.trees}
          opacity={0.75 + (i % 3) * 0.08}
        />
      ))}

      {spec.road && (
        <path
          d={`M${W * 0.46} ${H} C ${W * 0.2} ${H * 0.9}, ${W * 0.82} ${H * 0.84}, ${W * 0.5} ${H * 0.77} S ${W * 0.6} ${H * 0.7}, ${W * 0.55} ${H * 0.68}`}
          fill="none"
          stroke={spec.road}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.9"
        />
      )}

      {scene === 'workspace' && (
        <g>
          <rect x="120" y="96" width="160" height="96" rx="5" fill="#0b0c10" />
          <rect x="126" y="102" width="148" height="84" rx="2" fill="#0c1326" />
          <rect x="134" y="114" width="70" height="4" rx="2" fill="#8fb4ff" />
          <rect x="134" y="126" width="104" height="4" rx="2" fill="#7de2a8" />
          <rect x="134" y="138" width="52" height="4" rx="2" fill="#7f8db0" />
          <rect x="134" y="150" width="8" height="10" fill="#ffb86b" />
          <rect x="192" y="192" width="16" height="30" fill="#17181e" />
          <rect x="164" y="220" width="72" height="6" rx="3" fill="#17181e" />
        </g>
      )}

      {rain.map((r, i) => (
        <line
          key={i}
          x1={r.x}
          y1={r.y}
          x2={r.x - 7}
          y2={r.y + 22}
          stroke="#d6e6f0"
          strokeWidth="0.8"
          opacity="0.35"
        />
      ))}

      <rect width={W} height={H} fill={`url(#${uid}-fade)`} />
    </svg>
  );
}
