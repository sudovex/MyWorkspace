# WorkspaceOS — Project Context

> **Purpose of this file.** A complete, self-contained handoff document. If you are
> a fresh assistant session with no history, read this file top to bottom and you
> will know what the project is, what exists, what was decided, what is pending,
> and what to do next. Keep it updated at the end of every working session.
>
> **Last updated:** M2 shipped (Shots 1–4); M3's room-life pass (§6) shipped,
> then substantially revised (interaction language: uniform hover-tooltips →
> bespoke per-object physical responses), then followed by a dedicated
> **environment art pass** (§6, "Environment art pass") — atmosphere,
> realism, and a curated set of new static props, explicitly no new
> functionality. Nothing in M2 or M3 has been visually verified in a live
> browser — see §8, item 13.
> **Current milestone:** M2 — Cinematic intro, functionally complete. M3 —
> Room interactivity, partially pulled forward (3 bespoke interactive
> objects, mouse parallax) plus a full environment-art polish pass;
> monitor-wake-to-OS-handoff (M4) still not started.
> **Status:** All four M2 shots plus three iterations of the room-life pass
> implemented, reviewed, gates green after every change. **Read
> `DESIGN_PHILOSOPHY.md` first** — it holds the _why_ behind everything
> below and should be read once per session before this file's _what/where_.

---

## 1. What this project is

An interactive 3D workspace portfolio. You don't read it — you **boot** it.

Two runtimes fused at one seam:

1. **The Scene** — a WebGL room at night (rain, warm lamp, sleeping monitor),
   rendered with React Three Fiber.
2. **WorkspaceOS** — a hand-built desktop environment (windows, terminal, apps),
   rendered in real DOM for full interactivity and accessibility.

Clicking the monitor zooms the camera in and hands off from WebGL to DOM without
a page reload. The moment the OS is active, the WebGL scene **freezes** to return
the GPU to the interface.

### Branding model

The **product** is an operating system: `WorkspaceOS v1.0.0`.
The **person** is modelled as the logged-in developer profile: `Shubham Mali`,
Software Engineer.

The OS is not personal — the _user of it_ is. Mirrors "Welcome back, Shubham Mali."
Do not rename the OS after the person. Legacy "ShubhamOS" strings still exist in
a few places (see §8) and should be cleaned up.

---

## 2. Governing principles

Full doctrine — including the _why_ behind each — now lives in
`DESIGN_PHILOSOPHY.md` §3. Summary, these override convenience:

1. **Golden rule of isolation.** `features/scene/` and `features/os/` **never**
   import from each other. They communicate only through
   `stores/experienceStore.ts`.
2. **Quality gate over feature count.** Each milestone must feel _exceptional_
   before the next begins.
3. **Every animation needs a narrative reason.** See the reason table in
   `DESIGN_PHILOSOPHY.md` §6.
4. **Luxury is restraint.** No lightning, no camera shake, no chromatic
   aberration, no lens flare, no grain above ~2%. Explicitly rejected.
5. **Improve existing effects; don't add new ones**, once a milestone locks.
6. **Content is local and typed.** `src/content/` is TS + MDX, server-renderable
   for SEO/a11y. Supabase is for _submissions only_, never for content.
7. **No third-party windowing library.** The window manager is hand-built.
8. **Respect the user's time.** Runtime budgets in §5 are hard limits.
9. **The intro must work fully silent.** Browsers block autoplay; audio can never
   be load-bearing.

---

## 3. Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
React Three Fiber v9 · Three.js · Drei · GSAP · Framer Motion · Zustand ·
React Query · Zod · Supabase · Resend · shadcn/ui · Vercel.

Node >= 20.11 (`.nvmrc`). Package manager: npm (lockfile committed).

### Scripts

| Script                    | Purpose                  |
| ------------------------- | ------------------------ |
| `dev`                     | Dev server               |
| `build` / `start`         | Production build & serve |
| `lint`                    | ESLint (flat config)     |
| `typecheck`               | `tsc --noEmit`           |
| `test` / `test:watch`     | Vitest                   |
| `format` / `format:check` | Prettier                 |

CI (`.github/workflows/ci.yml`) runs: typecheck → lint → test → build.

---

## 4. Architecture

```
src/
├── app/            Next routes, layout, providers, globals.css (design tokens)
├── config/         site.ts — single source for SEO / OS chrome
├── content/        typed portfolio content (TS + MDX) — EMPTY, README only
├── features/
│   ├── scene/      WebGL runtime (room + cinematic camera)
│   ├── os/         DOM runtime (desktop, window manager, apps) — EMPTY, READMEs only
│   └── easter-eggs/  EMPTY, README only
├── hooks/          useDeviceTier, usePrefersReducedMotion
├── lib/            utils, env (Zod), supabase client/server factories
├── stores/         experienceStore, windowStore, osStore, terminalStore
├── types/          framework-free domain models
└── components/ui/  shadcn primitives — EMPTY (.gitkeep)
```

### The experience FSM — the spine of the whole app

`src/stores/experienceStore.ts` + `src/types/experience.ts`

```
black → post → booting → monitor_on → reveal → room_idle → zooming → os_active
```

Transition table (`PHASE_TRANSITIONS`), guarded; illegal transitions are rejected
and warn in dev.

| From         | Allowed to                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `black`      | `post`, `room_idle` _(reduced-motion skip)_, `os_active` _(low-tier skip)_ |
| `post`       | `booting`, `black`                                                         |
| `booting`    | `monitor_on`                                                               |
| `monitor_on` | `reveal`                                                                   |
| `reveal`     | `room_idle`                                                                |
| `room_idle`  | `zooming`                                                                  |
| `zooming`    | `os_active`, `room_idle` _(abort)_                                         |
| `os_active`  | `room_idle` _(exit OS)_                                                    |

- `canTransition(from, to)` is a **pure exported function**, unit-tested without React.
- `isCanvasFrozen` is **derived** from phase (only `os_active` freezes). Never set manually.
- `phaseProgress` (0..1) is written every frame by the render loop, which reads the
  store imperatively via `getState()` and **must not subscribe**.

### Narrative bookend

The camera **starts tight on the monitor** (`monitorClose` — the boot frame),
pulls **back** to reveal the room (`roomReveal`), and later zooms **back in** to
the exact same frame to enter the OS. Poses are plain reversible data in
`features/scene/camera/poses.ts`.

### Coordinate convention

Metres. Desk surface at `y = 0`, floor at `y = -0.75`. Monitor screen centred at
~`[0, 0.32, -0.25]` facing `+Z` (toward viewer). Camera FOV 40, near 0.01, far 20.

Key positions: `monitorClose` pos `[0, 0.32, 0.42]` target `[0, 0.32, -0.25]` ·
`roomReveal` pos `[0.45, 0.95, 1.85]` target `[0, 0.12, -0.35]` ·
lamp `[0.72, 0, -0.35]` · window `[-0.7, 0.75, -1.24]`.

> Note: the window is **out of frame** at `monitorClose`. This is why rain cannot
> be revealed before the camera moves (see §5).

### Asset swap system

`features/scene/assets/assetManifest.ts` + `AssetSlot.tsx`.
Every object renders placeholder primitive geometry. Dropping in a production
model is a **data-only change**: set `gltfPath` in the manifest and `<AssetSlot>`
renders the GLTF instead, inheriting the identical transform. See `TODO_ASSETS.md`.

### Performance posture

- `frameloop="demand"` — a settled room costs **zero GPU**.
- `CameraRig` calls `invalidate()` only while travelling, then goes silent.
- Tier-gated DPR / shadow map size / antialias via `useDeviceTier`.
- `PerformanceMonitor` ratchets DPR down on decline.
- Low tier never mounts the Canvas at all → `StaticFallback`.
- **One deliberate exception, added in Shot 3:** `room_idle` (the resting
  state after the pullback) calls `invalidate()` every frame, forever, to
  drive the idle-breathing camera drift, dust motes, and rain fall. "A
  settled room costs zero GPU" no longer holds once `room_idle` is reached —
  it holds for every phase _before_ it. This is a conscious trade-off (see
  `DESIGN_PHILOSOPHY.md` §6, "idle breathing") and is disabled entirely under
  `prefers-reduced-motion`, where the camera and particles hold static. See
  known issue below on the cost of this for a long-idle tab.

---

## 5. M2 — Cinematic intro (CURRENT WORK)

### Locked decisions

| Decision                                         | Value                                                                                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First-visit runtime                              | **6.87s** (two cursor blinks — see below)                                                                                                                                                  |
| Returning visitor                                | **~2.6s** — a different edit, not a fast-forward                                                                                                                                           |
| Reduced motion                                   | Skip straight to `room_idle`, lights up, camera already at `roomReveal`                                                                                                                    |
| Lightning                                        | **Removed completely**                                                                                                                                                                     |
| Camera shake / chromatic aberration / lens flare | **Rejected**                                                                                                                                                                               |
| POST tone                                        | Minimal, elegant, confident. No humour, no fake-hacker, no BIOS spam. **Exactly 3 lines**                                                                                                  |
| Cursor blinks                                    | **Two**, not three (530ms VT100 rate)                                                                                                                                                      |
| Dust                                             | **Only in the pullback.** Never appears before it — the lamp cone is the only place it can exist, and the lamp itself only lights during the pullback window. No separate "dust hint" beat |
| Audio                                            | Silent by design (autoplay is blocked). Never load-bearing                                                                                                                                 |
| Skip affordance                                  | Click or key anywhere, appears ~1.5s, 11px mono, muted, bottom-right. **Cuts** to `room_idle` — never fast-forwards. **Not yet implemented — tracked in §8**                               |

### The core inversion

**Wrong:** camera moves → room appears.
**Right:** light reveals the world; the camera only reveals _where the light already is._
Full reasoning in `DESIGN_PHILOSOPHY.md` §2.

### Beat sheet (first visit, 6.87s — locked)

Two cursor blinks (not three) and cutting the standalone dust hint save 0.53s
off the original 7.40s draft, landing in the approved 6.8–7.0s window.

| Time      | Beat              | Notes                                                                                                                |
| --------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| 0.00–0.40 | **Black**         | `#05060a`, never pure black. Held.                                                                                   |
| 0.40–0.55 | **Panel wake**    | Emissive spikes to ~118% over 150ms                                                                                  |
| 0.55–1.65 | **POST**          | 3 lines, hard cut, 340ms stagger. Geist Mono, `#e8e4dc`. Panel settles 118%→100%; **exposure +15%**                  |
| 1.20–1.60 | **Keyboard LEDs** | Stagger L→R, ~40ms/zone. Single warm amber (`--warm`). Never RGB                                                     |
| 1.40–2.40 | **Desk visible**  | **No new light, no animation.** Pure consequence of existing light                                                   |
| 1.65–1.85 | **Clear to fill** | POST clears in one frame; panel at peak brightness                                                                   |
| 1.85–3.00 | **Lamp**          | 1.15s non-linear ramp; **colour warms 2200K → 2900K**                                                                |
| 3.10      | **Welcome**       | Appears on a **single frame**, no fade. Left-aligned                                                                 |
| 3.10–3.50 | **Dead air**      | 0.40s. **Protected — never cut**                                                                                     |
| 3.50–4.56 | **Cursor**        | `WorkspaceOS >` `█`, blink @ **530ms** (real VT100 rate), **×2**                                                     |
| 4.56      | **Handoff**       | Cursor vanishes on blink-off; camera starts **same frame**                                                           |
| 4.56–6.87 | **Pullback**      | 2.31s. **Dust first becomes visible here** (lamp cone only, right frame edge) — never before. Rain arrives on window |
| 6.87      | **room_idle**     | Breathing begins                                                                                                     |

### Phase ↔ beat mapping (resolved — was previously ambiguous)

The FSM (`experienceStore.ts`) is coarse-grained by design; a per-shot
internal timeline (e.g. `boot/bootTimeline.ts`) owns the fine sub-beats within
each phase and calls `transition()` at the boundaries below:

| FSM phase    | Owns (beat-sheet time)                              |
| ------------ | --------------------------------------------------- |
| `black`      | Black hold (0.00–0.40)                              |
| `post`       | Panel wake + POST lines + clear-to-fill (0.40–1.85) |
| `booting`    | Lamp ramp + colour warm (1.85–3.10)                 |
| `monitor_on` | Welcome + dead air + cursor blinks (3.10–4.56)      |
| `reveal`     | Pullback, incl. dust + rain reveal (4.56–6.87)      |
| `room_idle`  | Idle breathing (6.87+)                              |

### POST copy (proposed — 3 lines)

```
WorkspaceOS v1.0.0
Loading developer profile...
Preparing environment...
```

Then, after clear:

```
Welcome back,
Shubham Mali
```

**Typography.** `Welcome back,` — 13px, `--muted-foreground`, tracking +0.02em.
`Shubham Mali` — 22px, `--foreground`, tracking −0.01em. Left-aligned (centred
reads as a splash screen; left-aligned reads as a terminal). The **tracking
contrast** between the two lines is what makes it look designed.

### Camera specification (pullback) — implemented in Shot 3

- Cubic ease-**in**-out, weighted so the first 15% of time covers very little
  distance. Mass. **Implemented as quintic** (`easeInOutQuint`), not cubic —
  meaningfully slower at both ends than a true cubic; unit-tested to cover
  <5% of total travel in the first 15% of total time.
  See `camera/pullbackTimeline.ts` + `utils/easing.ts`.
- **Split curves:** position leads, look-at lags ~180ms on a gentler curve, so
  the monitor drifts slightly off-centre mid-move before the frame resolves.
  _(Strongest "this was shot, not computed" cue available.)_ Implemented
  exactly: look-at uses `easeInOutCubic` (gentler than position's quint).
- **Overshoot final pose ~3%**, settle back over the last 600ms. Implemented
  as two literal segments (ease to a 3%-extrapolated pose, then
  `easeOutCubic` back to the exact final pose) rather than a single curve
  shape — easier to reason about and to unit-test the exact overshoot/settle
  boundary.
- **Never dead-stop.** At `room_idle`: ~12s-period sine on Y of ~8mm plus ~0.3°
  rotational drift. Makes the eventual `os_active` freeze _land_. Implemented
  in `camera/idleBreathing.ts` — the rotational drift is expressed as a small
  look-at-target offset (≈0.0125 world units at the `roomReveal` viewing
  distance) rather than a raw camera rotation, since `camera.lookAt()`
  recomputes the full orientation every frame and would fight a directly-set
  rotation.
- **Exposure compensates +8%** as the bright panel occupies less of frame.
  Implemented via `gl.toneMappingExposure`, ramped during `reveal` and held
  through `room_idle` — **including the reduced-motion path**, which skips
  the ramp animation but must still land on the same resting exposure (a real
  bug caught and fixed during the Shot 4 review — see §8).
- **Fog finally engages** — retuned to `near=1.4, far=4.0` (was `2.6–6.5`).
  At the `roomReveal` camera-to-back-wall distance (~2.2–3.4m depending on
  what's being measured), this now mixes ~30–75% fog rather than the old
  ~20%, without fogging the monitor at `monitorClose` (~0.67m, well under
  `near`). **Unverified in a live browser** — the math is checked, the actual
  visual density is not (see §8).

### Overlap principle, reason table, emotional anchors

Moved to `DESIGN_PHILOSOPHY.md` §5–§7 (permanent doctrine, not per-milestone
detail). One update to note: the reason-table row is now **Cursor blink ×2**
(was ×3) and there is no longer a standalone "dust hint" row — dust's reason
("evidence of the lamp; cannot exist without it") is now satisfied entirely
inside the pullback row.

### Deviations from the original beat ordering (and why)

- **Rain and dust moved fully into the pullback — dust never appears before
  it.** Geometry, not preference: the window is out of frame at
  `monitorClose`, so rain literally cannot be seen before the camera moves,
  and dust can't be lit before the lamp that lights it turns on. The earlier
  draft's standalone 2.60s "dust hint" beat was cut entirely rather than kept
  as a preview — a preview would mean dust becomes visible _before_ the lamp
  fully justifies it, which breaks the same rule it exists to demonstrate.
  This also fixes dead time — a 2.31s pullback across a finished static room
  had nothing happening in it; now it's carrying both reveals.
- **Three POST lines, not four.** "Initializing workspace..." and "Preparing
  environment..." are near-synonyms. Four lines is a list; three is a rhythm.
- **Two cursor blinks, not three.** Saves 0.53s (7.40s → 6.87s) with no
  perceptual loss — the beat still reads as "waiting," just for a hair less
  time. Three was defensible but three round trips risked reading as a stall
  rather than a pause.

### Known risks (from self-critique, current as of the two decisions above)

- The cursor beat is still **~15% of runtime** on a blinking rectangle at two
  blinks. Smaller bet than the original three-blink draft, same idea.
- **Exposure ramps may be invisible** on mediocre screens in bright rooms.
  Cheap, free on good hardware, but not load-bearing.
- **Returning-visitor detection is fragile** (incognito, cleared storage,
  second device) — a meaningful share will get the long cut every time.
- **Keyboard LEDs may not read** at `monitorClose` — keyboard is low and small
  in frame. First thing to cut if the frame gets busy.
- **The bet:** this gates a portfolio behind a ~6.9s film. A recruiter with 30
  seconds does not want a film. Make this bet knowingly.

**Cut order if forced to 6s:** keyboard LEDs → one more cursor blink (down to
one — see `DESIGN_PHILOSOPHY.md` §8 for the doctrine, though §8 also says not
to go below one). Never cut: the black hold, the lamp, the dead air.

### Open questions

None blocking as of this update — all three were resolved by the user and are
reflected in the beat sheet above:

1. ~~Three cursor blinks or two?~~ → **Two.** Runtime 6.87s.
2. ~~Keep the dust hint, or move all dust into the pullback?~~ → **Moved
   fully in; the standalone hint is cut.** Dust must never appear before the
   camera reveals it.
3. ~~Accept three POST lines?~~ → **Yes, unchanged.**

### Shot plan (production, not pre-production)

Storyboard approved. Building one shot at a time; **each shot stops for
review before the next begins** — do not implement ahead of the current shot.

- [x] **Shot 1 — Black → Monitor wake → POST.** Shipped: `boot/bootTimeline.ts`
      (pure timing/colour model), `boot/BootOverlay.tsx` (DOM layer). Covers FSM
      phases `black` and `post`.
- [x] **Shot 2 — Lamp → Welcome → Cursor.** Shipped: `boot/lampTimeline.ts` +
      `room/objects/Lamp.tsx` (the lamp ramps for real during `booting`, off
      screen — see the core inversion, `DESIGN_PHILOSOPHY.md` §2);
      `boot/welcomeTimeline.ts`, wired into `BootOverlay.tsx` (Welcome, dead air,
      two 530ms cursor segments). Covers `booting` and `monitor_on`.
      **Keyboard LEDs deliberately not built** — never assigned to a shot by the
      approved plan, and `DESIGN_PHILOSOPHY.md` §8's own cut-order lists it first
      to go under pressure; building it now would be scope creep, not polish.
- [x] **Shot 3 — Camera pullback, lighting reveal, dust reveal, rain reveal,
      idle breathing.** Shipped: `camera/pullbackTimeline.ts` (authored
      quintic-weighted pullback with split position/look-at curves, 3% overshoot,
      600ms settle, +8% exposure ramp) driving `CameraRig` for `reveal`;
      `camera/idleBreathing.ts` driving `CameraRig` for `room_idle`;
      `room/objects/Dust.tsx` and `room/objects/Rain.tsx` (both invisible before
      `reveal`); fog retuned in `Scene.tsx`. **"Lighting reveal" resolved as a
      non-event, not a staged ramp** — see the design-call note below.
- [x] **Shot 4 — Polish only.** A fix-and-reformat pass over Shots 1–3: two
      real defects found and fixed (see §8), no new functionality or effects
      added.

**Design call resolved during Shot 3 (worth recording — it wasn't explicit
going in):** the "progressive lighting reveal" language in earlier notes
suggested lights staging on _during_ the pullback (monitor → desk → lamp →
rest). That would violate the core inversion ("nothing switches on during the
camera move"). What's actually implemented: the room's ambient/hemisphere/
directional lights (`Lighting.tsx`) were never touched — they can stay
always-on because `BootOverlay` is fully opaque through `black`/`post`/
`booting`/`monitor_on`, so they're invisible regardless until it disappears
at `reveal`. "Lighting reveal" is the _camera_ revealing an _already-lit_
room, not lights turning on. This also resolves former known issue #12
(`Lighting.tsx` being the "always-on M1 placeholder") — it's no longer a gap,
it's the correct final design.

---

## 6. M3 (pulled forward) — Room-life pass

M2 was implementation-complete when this started. The user's direct
feedback on `room_idle` — "everything feels frozen... the room feels like a
rendered scene instead of a living environment" — asked for real M3 content
(room interactivity: hover, parallax, monitor wake) ahead of schedule,
scoped narrowly to making the settled room feel occupied rather than
rendered. **This section describes the current, final state — v1 (below)
was built, then substantially reversed on further direct feedback; the
reversal and why is recorded at the end so it isn't re-litigated later.**

**Scoping call made without asking, still true:** several requested
destinations don't exist yet — WorkspaceOS itself (M4), a resume/documents
viewer, a ride gallery, a blog (M6/M7). Every interactive object's click
logs to the console at a clearly marked seam instead of navigating anywhere
or faking a destination UI that isn't real yet.

### Lighting & atmosphere

- **The lamp is the room's primary light source by warmth and reach, not
  raw brightness.** Key light: `intensity` 2.5 (was briefly 3.0, pulled back
  — "warmer, not brighter"), `distance` 3.4, shadow-casting (tier-gated
  `castShadow` + soft `shadow-radius`), colour pushed toward a deeper,
  more saturated amber (`lampColorAt` end value `rgb(255,168,88)`, was a
  cleaner `rgb(255,183,116)`). **Never achieved by dimming** the always-on
  cool ambient/hemisphere/directional trio in `Lighting.tsx`, which still
  stays exactly as Shot 3 locked it.
- **Indirect bounce fill — new.** A second, dim (`intensity` 0.85),
  non-shadow-casting point light centred over the desk
  (`boot/lampTimeline.ts`'s `bounceIntensityAt`/`bounceColorAt`,
  `Lamp.tsx`), broadening the lit area past the key light's own falloff so
  the desk reads as evenly warm rather than a single hot spot — the
  "spotlight" complaint. Starts ramping 200ms after the key light and never
  flickers itself (one flickering light is a detail; two in sync is a
  coincidence the eye would notice) — unit-tested to always stay dimmer
  than the key light and to ramp monotonically.
- **Ignition flicker** (key light only) — a brief (220ms), deterministic,
  decaying two-frequency perturbation before the smooth warm-up continues —
  unchanged from the first lighting pass.
- **Monitor glow breathing**, **plant sway** — unchanged from the first
  pass (see below), still `room_idle`-only and reduced-motion-safe.

### Helmet — real geometry, correct placement

`room/objects/Helmet.tsx` (extracted to its own file). Shell is a
Y-axis-only dome cutoff (theta, not phi) so its silhouette is correct
regardless of the group's rotation — deliberately avoided a separate
partial-sphere "chin bar" mesh after catching, on review, that its
phi/theta angles overlapped the shell's own coverage instead of extending
it (a real modelling mistake, fixed before shipping, not left as a known
issue). Visor is a full sphere scaled into a lens rather than an
angle-cut wedge, for the same robustness reason. Matte black, not the
original red. **Repositioned from under the desk to beside it** — world
x=-1.1, clearly outside the desk's own footprint (which ends at x≈-0.95),
between the desk and the bookshelf (x=-1.45), no collision. Interaction is
a single 2.6° Y-axis rotation on hover, damped, nothing else — no scale, no
label.

### Interaction — reversed from "website" to "environmental" (read this before touching hover code)

**v1** (first Room-life pass) gave five objects a uniform interaction
language: hover → drei `Html` tooltip + 3.5% scale-up, via a shared
`InteractiveObject` wrapper. Direct feedback: this read as "website
interactions," not environmental storytelling — floating labels are DOM UI
regardless of how minimal they're styled, and identical responses across
different objects makes a room feel systematised rather than lived-in.

**v2** (current): `InteractiveObject.tsx` and `hints.ts` are **deleted**.
No floating labels anywhere, on any object. Exactly **three** objects are
interactive, each with its own bespoke, physically-motivated response —
fewer, better-considered interactive objects is itself part of the fix:

- **Monitor** (`Monitor.tsx`) — never blank. The screen carries a
  canvas-generated desktop texture (`map` + `emissiveMap`, baked once):
  "WorkspaceOS", "Welcome back, Shubham Mali", "Open Workspace →" — the CTA
  lives _inside_ the screen's own material, not as DOM. Proximity (an
  oversized invisible pointer-target box, not the literal screen plane —
  "attracts attention" rather than requiring pixel-precise hover) brightens
  the screen (`emissiveIntensity` 0.62→0.92, damped) and intensifies a soft
  glow plane behind the bezel (a canvas radial-gradient sprite, additive
  blending — a cheap stand-in for bloom; this project has no postprocessing
  pipeline and adding one would be exactly the architecture change this
  pass was told not to make).
- **Notebook** (`Notebook.tsx`, extracted from `DeskProps.tsx`) — the cover
  is a separate mesh hinged at its back edge; on hover it rotates open ~4°
  (front edge lifts, back edge is the pivot) and the pages lift a further
  0.0025 units, revealing a canvas-baked page texture ("Resume /
  Certificates / Documentation") that was there underneath the whole time.
  No floating text — the object opens.
- **Helmet** — see above. 2.6° rotation only.
- **Mug, keyboard, plant are deliberately not interactive.** The brief's
  own "objects should tell their own story" list puts coffee and plant in
  the "understood by looking, not by hovering" category; keyboard was
  never named in either the interactive or the passive list, so it reverts
  to passive rather than inventing a story for it. Fewer interactive
  objects, not more — the opposite of the instinct that produced v1.

`interaction/cursor.ts` (the reference-counted cursor claim) **survives** —
still genuinely useful now that three separate bespoke components each
claim/release the cursor independently; the race it guards against (fast
mouse movement between adjacent objects) is unchanged by the v1→v2
rewrite. Each of the three components now owns its own hover state, damping,
and cursor claim/release directly — no shared wrapper, since scale,
hinge-rotation, and body-rotation are three different response _shapes_
that didn't actually fit one generic abstraction.

### Mouse parallax

Unchanged from the first pass: `camera/mouseParallax.ts` (pure: pointer NDC
→ a look-at offset, clamped to ≤~1.7° at the `roomReveal` viewing distance,
unit-tested against that budget) + `CameraRig` (the lag/ease itself —
`MathUtils.damp` at a deliberately slow lambda, additive with the existing
idle-breathing drift). `room_idle`-only, disabled under reduced motion.

### What this costs (performance honesty)

`room_idle` was already a permanent exception to "a settled room costs zero
GPU" (camera breathing + dust + rain, Shot 3). This pass — both versions —
adds several more continuously-ticking systems while idle (monitor glow +
proximity glow, plant sway, notebook hinge damping, helmet rotation
damping, the bounce-fill light) plus the parallax damp in `CameraRig`. Each
is cheap in isolation; together still trivial for any device that reached
`room_idle` at all (medium/high tier only). Not a new category of
trade-off, a larger version of the one already documented in "Performance
posture" above.

### Still unverified

Same caveat as M2, now covering two revisions of this pass: everything here
is checked by type, lint, unit test, and clean build — none of that
confirms it _looks_ right. Whether the lamp genuinely reads as "the primary
light source" without feeling like a spotlight, whether the monitor's baked
screen text is legible and well-composed at the `roomReveal` distance,
whether the notebook's page texture renders right-side-up (the plane's
rotation-to-face-up was reasoned through, not rendered and checked),
whether the helmet actually reads as a full-face helmet rather than an
abstract shape — unconfirmed in a live browser. See known issue #13 below.

### Environment art pass — atmosphere and realism, no new functionality

A dedicated milestone on top of the room-life pass, explicitly scoped to
**not** touch interaction, architecture, or the room's layout — only
material, placement, lighting, and a curated set of new static (non-
interactive, non-phase-aware) props. Reviewed the room like an environment
artist first: every surface was a single flat colour/roughness with no
variation, objects sat at clean round position values with axis-aligned
rotations, nothing touched the desk with any contact darkening, and the
bookshelf was a solid box with nothing on it.

- **`room/effects/ContactShadow.tsx` — new, shared.** A cheap "blob shadow"
  (one canvas radial-gradient texture, reused by every instance) standing in
  for real ambient occlusion — this project has no postprocessing pipeline
  and adding SSAO would be exactly the architecture change this milestone
  was told not to make. Applied under most of the room's objects.
- **Monitor glare fixed.** Screen material roughness 0.3→0.65 — a glossy
  screen was catching the nearby lamp as a hard white specular hit that read
  as a rendering artifact. The emissive glow still carries "screen light";
  the material itself is now closer to an anti-glare coating.
- **`receiveShadow` added broadly** across desk props, the lamp base, and
  the monitor stand — objects now separate from each other and the desk
  through actual shadow, not just ambient fill.
- **Imperfection pass** on every existing prop: keyboard/mouse/phone/chair
  got small non-axis-aligned rotations and off-round position nudges; the
  mug got a baked coffee-ring stain (canvas texture) slightly offset from
  its current position — "picked up and set down in roughly the same spot
  for months," not welded there.
- **New objects — curated, not the full requested list, to avoid clutter:**
  desktop speakers flanking the monitor, headphones (resolves a known gap —
  existed in the manifest, was never placed), two pens, a desk calendar
  that **genuinely reads the current month/year via `Date()` at mount**,
  one sticky note on the monitor bezel, a hint of cable management behind
  the monitor, bike keys beside the helmet, and three books with baked
  spine labels — _Designing Data-Intensive Applications_, _Clean Code_,
  _System Design Interview_ — finally giving the bookshelf content instead
  of being an empty box. New files: `room/objects/DeskDetails.tsx`,
  `Books.tsx`, `BikeKeys.tsx`. New `assetManifest.ts` entries: `speakers`,
  `bikeKeys`, `deskCalendar`, `stickyNotes`, `pens`, `cables`, `books`.
- **Lighting:** key light pulled back from intensity 3.0→2.5 and pushed
  toward a more saturated amber (warmer, not brighter, again); the bounce
  fill (from the room-life pass) repositioned and given more reach
  specifically so it grazes the back wall, not just the desk.

**Four real placement/geometry bugs caught on review before shipping, not
left as known issues:**

1. The helmet's original "chin bar" mesh (previous pass) had phi/theta
   angles that overlapped the shell's own coverage instead of extending it.
2. `DeskDetails.tsx`'s speakers were positioned inside an `AssetSlot`
   already offset to the monitor's position, then given a _second_,
   independent offset in the same direction — compounding to place them
   nearly at the desk's back edge instead of flanking the monitor.
3. The first cable segment was centred at desk-surface height, so half of
   it would render above the desk and half would clip through it, instead
   of running from behind the bezel down to the surface.
4. The pens' "different angles" used a Y-axis rotation applied to a
   cylinder _before_ it was laid flat — a cylinder is symmetric around its
   own long axis, so that rotation was doing nothing visible. Fixed by
   composing the lay-flat (X) and heading (Y) rotations as nested groups
   instead of one Euler triple, so the order is explicit rather than
   dependent on Euler-composition intuition.

All four were caught by re-reading the geometry math after writing it, the
same discipline that caught real bugs in the M2 and room-life passes — not
by rendering and looking, which still isn't possible in this environment.

---

## 7. Milestone status

- [x] **M0 — Foundation.** Tooling, strict TS, design tokens, state stores, guarded FSM, Zod env, Supabase factories, providers.
- [x] **M1 — Scene shell.** R3F canvas, pose-driven camera rig (pullback), placeholder room, asset-slot swap system, night lighting, device-tier + reduced-motion fallbacks, Vitest, CI.
- [ ] **M2 — Cinematic intro.** ← **CURRENT.** All 4 shots implemented and
      gate-clean (typecheck/lint/test/build) — see "Shot plan" above. Not yet
      checked off as _done_ because it has not been **visually verified in a live
      browser** (no headless browser tool in this environment — see §8). Treat as
      "implementation complete, verification pending." `ExperienceRoot` no longer
      runs the M1 stand-in; reduced motion is the only remaining skip path out of
      `black`.
- [ ] **M3 — Room interactivity (hover, parallax, monitor wake).** ← Partially
      pulled forward as the "Room-life pass" (§6): hover + contextual hints on
      5 objects, mouse parallax, monitor glow breathing. Not done because
      "monitor wake" here means the M4 handoff trigger (clicking the monitor
      to enter WorkspaceOS) — the hover/hint affordance exists, but the click
      is still a stub (known issue #17); genuinely finishing M3 means M4
      exists to hand off to.
- [ ] M4 — The transition (monitor → OS handoff, canvas freeze)
- [ ] M5 — OS core (desktop, window manager, shortcuts)
- [ ] M6 — Terminal + backend (`sudo hire shubham`, Supabase, Resend)
- [ ] M7 — Content apps (Projects, Experience, Gallery, …)
- [ ] M8 — Sandbox demos
- [ ] M9 — Easter eggs + polish
- [ ] M10 — Performance / a11y / SEO / deploy

### What exists and works today

- `Scene` — `frameloop="demand"`, tier-gated quality, `PerformanceMonitor` DPR backoff
- `CameraRig` — damped toward `poseForPhase(phase)`, invalidates only while
  travelling, snaps under reduced motion, look-at seeded to `monitorClose` to
  kill first-frame gaze swing
- `CAMERA_POSES` — reversible data, phase→pose map
- Placeholder room — shell (floor, 2 walls, window), desk, monitor with a **named
  `monitor-screen` mesh** reserved for POST output (M2) and the OS render surface
  (M4), lamp + warm point light, desk props, furniture
- `AssetSlot` + `assetManifest` — data-only GLTF swap
- `useDeviceTier` (cores/memory/pointer + WebGL renderer probe; `null` until
  measured so WebGL never mounts during SSR), `StaticFallback`, `SeoFallback`
  (sr-only, server-rendered), dev-only `DebugPanel`
- `dampVector3` — framerate-independent smoothing, no new dependency
- Design tokens in oklch — warm/cool tension mirroring the narrative (cool indigo
  `--primary` carries the UI; warm amber `--warm` reserved for rare, meaningful
  highlights). Motion language as easing/duration custom props
- `windowStore` — full window lifecycle, monotonic `zCounter` so focusing never
  renumbers
- `osStore` — persisted (`workspace-os-settings`), `skipHydration: true` +
  explicit rehydrate to avoid SSR mismatch
- `terminalStore` — typed skeleton with a `HireStage` sub-FSM
- Zod env — public eager, server secrets **lazy** so the app builds with no backend
- `boot/bootTimeline.ts` — pure, unit-tested functions driving Shot 1's panel
  colour curve (off → wake overshoot → settle → peak fill) and POST line
  reveals from a single elapsed-ms input
- `boot/lampTimeline.ts` — pure, unit-tested lamp-ramp model (ember → tungsten
  colour + intensity) for the `booting` phase
- `boot/welcomeTimeline.ts` — pure, unit-tested Welcome/dead-air/cursor-blink
  model for the `monitor_on` phase; the two-segment blink math is
  unit-tested specifically at the handoff boundary (must land mid-"off")
- `boot/BootOverlay.tsx` — the DOM layer for Shots 1–2: owns `black`, `post`,
  `booting`, `monitor_on`. `setTimeout`s for the two silent phases,
  `requestAnimationFrame` loops for the two phases with visible content.
  Unmounts entirely — a hard cut, no fade — the instant `reveal` begins.
- `utils/easing.ts` — shared, framework-free easing primitives
  (`easeOutCubic`, `easeInOutCubic`, `easeInOutQuint`, `lerp`) used by every
  timeline module above and below
- `camera/pullbackTimeline.ts` — pure, unit-tested authored pullback (Shot 3):
  quintic-weighted position, lagged-cubic look-at, 3%-overshoot-then-settle,
  exposure ramp
- `camera/idleBreathing.ts` — pure, unit-tested sine-drift model for
  `room_idle`'s continuous camera breathing
- `CameraRig` — now three regimes by phase: the authored pullback for
  `reveal`, continuous breathing for `room_idle`, and the original
  critically-damped approach for every other phase (unchanged)
- `room/objects/Dust.tsx`, `room/objects/Rain.tsx` — lightweight sprite/
  instanced-mesh particle systems, invisible before `reveal`, frozen (present
  but not animating) under reduced motion
- `camera/mouseParallax.ts` — pure, unit-tested pointer→look-at-offset
  mapping, clamped to a tested angular budget
- `interaction/cursor.ts` — reference-counted cursor claim, order-independent
  across adjacent hoverable objects. **`InteractiveObject.tsx` and
  `hints.ts` no longer exist** — deleted in the interaction-language
  reversal (§6); each interactive object now owns its own bespoke response.
- `Lamp.tsx` — shadow-casting (tier-gated) key light tuned warmer rather
  than brighter, plus a second non-shadow-casting bounce-fill light for
  broader, less spotlight-y coverage; `lampTimeline.ts` models the key
  light's ignition flicker and the fill's delayed, flicker-free ramp
- `Monitor.tsx` — a real in-screen desktop texture (baked canvas: wordmark,
  welcome text, CTA) plus proximity-based brightness and a cheap glow-sprite
  bloom stand-in, all `room_idle`-gated
- `Notebook.tsx` (own file, extracted from `DeskProps.tsx`) — hinged cover
  that opens on hover, canvas-baked page text underneath
- `Helmet.tsx` (own file, extracted from `Furniture.tsx`) — full-face
  silhouette via a robust Y-axis dome cutoff + scaled-sphere visor lens,
  2.6° hover rotation only, repositioned beside the desk rather than
  under it
- `Furniture.tsx` — plant sway, `room_idle`-gated and reduced-motion-safe;
  mug and keyboard are deliberately passive (§6)
- `room/effects/ContactShadow.tsx` — shared blob-shadow AO stand-in, one
  canvas texture reused by every instance, applied under most room objects
- `room/objects/DeskDetails.tsx` — speakers, headphones, pens, a
  current-month desk calendar (`Date()` at mount), a sticky note, cable
  management; `Books.tsx` (bookshelf spine labels), `BikeKeys.tsx`
  (beside the helmet) — all purely static/environmental, no phase-awareness
- `DeskProps.tsx` — coffee-ring stain on the mug (canvas texture), plus
  small rotation/position imperfections on every existing prop so nothing
  reads as ruler-placed

---

## 8. Known issues / drift (unaddressed)

Not blocking M2, but should be cleaned up.

1. **Stale branding.** `package.json` `name` is `shubham-os` and its description
   says "ShubhamOS". `.env.example` header says "ShubhamOS environment".
2. **README status line** says "Milestone 0 — Foundation complete" while the
   checklist marks M0 _and_ M1 done and the CHANGELOG has M2 in progress.
3. **`siteConfig.url` is hardcoded** `http://localhost:3000` and never reads
   `clientEnv.NEXT_PUBLIC_SITE_URL` → wrong `metadataBase` in production.
4. **Placeholder social links** — `github.com/`, `linkedin.com/`,
   `hello@example.com`.
5. **No `public/` directory at all** — no `models/`, favicon, or OG image.
6. ~~`headphones` and `helmet` exist in `assetManifest` but have no
   `<AssetSlot>` anywhere in the room.~~ **Both resolved.** Helmet in the
   Room-life pass (§6) — beside the desk, interactive. Headphones in the
   Environment art pass (§6) — set down near the laptop, purely
   environmental.
7. **Theme is inert.** `osStore` has `day`/`night` + `toggleTheme`, but `<html>`
   hardcodes `dark` and nothing syncs the class. Same for `rainEnabled` and
   `wallpaperId` — no consumers yet.
8. **Vitest is `environment: 'node'`, `include: ['src/**/*.test.ts']`** — cannot
   test `.tsx`. Only `experienceStore` has tests; `windowStore` (more intricate)
   has none.
9. **`windowStore` behaviours that read like bugs:** `minimizeWindow` nulls
   `focusedId` without promoting the next window; `restoreWindow` sets
   `display: 'normal'` without consuming `restoreGeometry`, stranding geometry
   when restoring a window that was minimized while maximized.
10. **`components.json` exists but `components/ui/` is just a `.gitkeep`** —
    shadcn configured, nothing generated. `src/content/` is a README only.
11. **Skip affordance still not built.** Locked decision (§5); all four shots
    are now done and it was never assigned to one of them, so this is no
    longer "not yet its turn" — it's a genuine gap. Until it exists, the boot
    sequence has no user-facing escape hatch other than
    `prefers-reduced-motion`, and a first-time visitor is committed to the
    full 6.87s. **Should be the next thing built**, before M3.
12. ~~Room lighting (`Lighting.tsx`) is still the always-on M1 placeholder.~~
    **Resolved in Shot 3 — see the "design call resolved" note under the Shot
    plan above.** Staying always-on turned out to be the correct final
    design, not a gap: the room is invisible behind `BootOverlay` regardless
    until `reveal`, so there was nothing to phase-gate.
13. **Neither the M2 cinematic intro nor the Room-life pass (§6) has been
    visually verified in a live browser.** Every timing/easing/colour value
    has a unit test, and typecheck/lint/test/build are all green after every
    change, but none of that confirms the thing actually _looks_ right —
    composition, whether dust genuinely reads near the frame's right edge at
    the `roomReveal` pose, whether the fog retune (§5) is too subtle or too
    heavy, whether the lamp now convincingly reads as the primary light
    source, whether the hover scale-pulse and parallax are calibrated right.
    **This is the single highest-value next step** — a few minutes with a
    real browser (or `/run` if a browser tool becomes available in this
    environment) would convert a lot of "should be right" into "confirmed
    right."
14. **`room_idle` now renders continuously, forever, once reached.** A
    deliberate trade-off, grown across two passes: idle-breathing camera
    drift, dust motes, and rain fall (Shot 3), plus monitor glow breathing,
    plant sway, per-object hover-scale damping, and mouse parallax
    (Room-life pass, §6). Each addition is individually cheap; see §6's
    "what this costs" note. Not a bug, but worth knowing: a visitor who
    lands on `room_idle` and leaves the tab open for an hour keeps the GPU
    busy that whole time. Acceptable for a portfolio (nobody idles here for
    an hour), but the kind of thing that should be named explicitly rather
    than discovered later.
15. **Point-light colour ramping via `Color.setRGB(r/255, g/255, b/255)`
    treats the 0–255 palette as if it were already linear 0–1**, which isn't
    colour-managed the way a real Kelvin-to-RGB conversion would be. It's a
    deliberately stylised approximation (documented as such in
    `boot/lampTimeline.ts`), not a physically accurate blackbody curve.
    Fine for this project's "hybrid realism" aesthetic; would need revisiting
    if the lighting model ever needs to be physically correct.
16. **Keyboard LEDs remain unbuilt** (see the Shot 2 entry in the Shot plan
    above) — an intentional scope decision under doctrine's own cut-order,
    not an oversight, but recorded here so it doesn't read as forgotten.
17. **The three interactive objects' click handlers are real but lead
    nowhere.** Monitor ("Open Workspace" CTA), notebook, and helmet all
    fully support hover/cursor/click — the click currently only logs to the
    console. The destinations don't exist yet: WorkspaceOS entry is M4, the
    resume/documents viewer and ride gallery are M6/M7. **When those
    milestones land, wire each object's `onClick` to real
    navigation/state** — the seam is deliberately left obvious (a single
    `console.info` call per object) rather than hidden behind something
    that looks finished. (Was 5 objects with a shared handler; mug and
    keyboard's interactivity was removed in the §6 interaction-language
    reversal — this item narrowed rather than grew.)

---

## 9. Undecided / needs a design call

- **M4 seam:** does the OS render into the `monitor-screen` mesh as a texture
  first, or is it a pure DOM overlay that appears once the camera lands? M4's
  design hinges on this and it affects how M2/M3 are built.
- Sound design (opt-in only; can never autoplay).
- Real content for `src/content/`.
- Production GLTF assets — see `TODO_ASSETS.md`.

---

## 10. How to resume a session

1. Read `DESIGN_PHILOSOPHY.md` once, to recalibrate judgment on tone and
   restraint before touching anything.
2. Read this file.
3. Read `README.md`, `CHANGELOG.md`, `TODO_ASSETS.md` for anything newer.
4. Check §7 for the current milestone, §5 for M2's locked direction and Shot
   plan, and §6 for the room-life pass — **do not implement a shot beyond
   the one currently in progress without explicit approval to move on.**
5. Check §5 "Open questions" — if unanswered, **ask before implementing**.
6. Respect §2 / `DESIGN_PHILOSOPHY.md` §3 governing principles.
7. **At the end of the session, update this file:** milestone status, shot
   status, what shipped, new decisions, new known issues, and the "Last
   updated" line at the top. Update `DESIGN_PHILOSOPHY.md` only if an actual
   doctrine decision changed — it should be far more stable than this file.
