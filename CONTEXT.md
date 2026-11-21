# WorkspaceOS — Project Context

> **Purpose of this file.** A complete, self-contained handoff document. If you are
> a fresh assistant session with no history, read this file top to bottom and you
> will know what the project is, what exists, what was decided, what is pending,
> and what to do next. Keep it updated at the end of every working session.
>
> **Last updated:** Nov 2026 — the "build-out" session, then a **performance +
> polish pass** after the owner ran it on his MacBook Air and asked for it to
> be smoother (see §4 "Rendering" and §8.1), and a terminal change (the
> numbered menu is gone; the session opens on "Type /help").
> First written at the build-out: The room was rebuilt,
> the intro was inverted (wide shot → push in to the desk), and the monitor
> terminal, animated résumé, gallery and contact all shipped. **Everything
> below was verified in a real browser** (headless Chromium, software GL) —
> the first session where that was possible.
> **Status:** typecheck / lint / 105 unit tests / production build all green.
> **Read `DESIGN_PHILOSOPHY.md` first** — especially §9 (Amendments), which
> records where this session deliberately departed from the older doctrine.
> The previous, much longer M2-era version of this file is preserved at
> `docs/archive/CONTEXT.M2.md` for the reasoning behind the boot beat sheet.

---

## 1. What this project is

An interactive 3D workspace portfolio for **Shubham Mali** (Software Engineer,
miniOrange — backend, identity & security). You don't read it — you fly into a
room at night and use what's on the desk.

**The journey**

1. **Boot** (DOM cover): black hold → three POST lines → a hairline of progress
   → "Welcome back, Shubham Mali" + a blinking prompt.
2. **Push-in** (`reveal`): the cover lifts on a wide establishing shot; the
   camera travels in to the desk under a title card; the lamp ignites on the way.
3. **At the desk** (`room_idle`): every object is a doorway.

| Object            | Opens                                                        |
| ----------------- | ------------------------------------------------------------ |
| Monitor           | camera zooms in → usable terminal over the glass (`os_active`) |
| Desk calendar     | résumé panel at **Experience** (the career timeline)         |
| Bookshelf         | résumé panel from the top (a RÉSUMÉ book slides out on hover) |
| Notebook          | résumé panel at **Projects**                                 |
| Helmet            | gallery panel, **Rides** album                               |
| Phone             | a phone you pick up: lock screen → home screen of social apps |
| Lamp              | click the lamp itself to switch the room's warm light on / off |
| Certificate frame | (on the wall under the shelves) panel with every certificate |
| Headphones        | (on a stand, front-left) open the phone on its Spotify app    |
| Soundbar          | (under the monitor) mutes / unmutes the room's sound          |
| Shaker bottle     | (right of the calendar) gallery, **Gym** album                |
| Coffee mug        | a one-line fact (toast)                                      |

The same destinations are on the **dock** and on **keys** (`T` `R` `G` `C`,
`L` for the lamp, `M` for sound, `?` for the guide, `←` / `→` to look at the
left wall and back,
`Esc` to go back), and inside the
**terminal** — nobody has to hunt for a hotspot.

**The first-visit guide** (owner's request: _helper arrows with one text in
the centre, and a button that makes it disappear_). `interface/guide/Guide.tsx`
opens it once, ~0.9s after the visitor first reaches the desk, unless
`localStorage['workspace-os:guided']` is set; closing it (button, Enter, Esc,
Space, click anywhere, or anything in the store that ends it) sets the key.
`?` in the HUD or on the keyboard reopens it. State: `guideOpen` +
`guidePoints` in the store. The DOM cannot see three.js, so
`scene/interaction/GuideProjector.tsx` projects each of `GUIDE_HOTSPOTS` (the
beacons plus the mug; the monitor at its screen centre — `guideTarget`) to
page pixels and publishes them only when
they move; `CameraRig` holds the camera still while the guide is up,
`useHotspot` and the look-left rule are disabled, and the HUD hides. Arrow
geometry is pure (`guide/arrows.ts`, tested): an arrow leaves the card's edge
toward its object, bows, stops short; objects the card covers or sits right
beside get a ring but no arrow. The card is centred on landscape screens and
at the top on portrait ones.

**Looking left** (owner's request: _show the left side of the room when the
cursor goes to the very left; darker at the end_). `roomView: 'desk' | 'left'`
in the store. `camera/sideLook.ts` is the pure rule: the cursor moving left
into the outer ~9% of the screen (`LOOK_LEFT_AT`) turns the head; moving right
past `LOOK_BACK_AT` (the right third) turns it back — two thresholds on
purpose, so what slides into view can be pointed at. It only reacts to the
cursor _moving_ that way, so `←` / `→` and the HUD's edge tabs (`LookTab`) are
not undone by a resting cursor. `CameraRig` eases a 0..1 turn (`LOOK_SECONDS`)
and blends base pose → `leftPoseFor(aspect)` (`poses.ts`); it is a layer, not
a base pose, and is folded into the base when the phase leaves `room_idle`.
`transition` and `openPanel` reset the view to `desk`. The headphones sit just
inside the threshold — if a hotspot is ever added further left, re-check it.
The left wall itself: two prints with brass picture lights (`WallDecor`,
painted pools) and a gradient decal that fades the wall into the backdrop
colour past z≈1.25 (`RoomShell`, `createFalloffTexture`).

**The window** (`objects/WindowView.tsx`, mounted by `RoomShell`'s `Window`)
is a single quad with a `ShaderMaterial` — the one custom shader in the room.
`textures/skyline.ts` paints four canvas layers (sky; far / mid / near
skylines that tile horizontally, are transparent above the roofline and end
in a solid row so they clamp downward) and exports where each lives
(`SKYLINE`: depth behind the glass + the slab of world its texture covers;
`SKY_VIEW`: the view-ray tangents the sky spans). The shader finds, per pixel,
where the view ray meets each layer's plane — that is the parallax — and
composites back to front with rain streaks in between; a wet-glass function
(beads + running drops) bends the ray and clears the mist. To restyle the
city, edit the painters (`paintSky/Far/Mid/Near`; they are plain canvas code
and can be previewed outside WebGL); to re-frame it, edit `SKYLINE`. Layers
are placed so each texture's centre is at the window's centre **from the desk
pose** (`DESK_SLOPE_X`) — if the desk pose moves, re-check the composition.
Time advances only in `reveal` / `room_idle` / `zooming`, never under reduced
motion.

**Sound** (`features/audio/`, owner's request: _on by default, slow music with
a rainy, cosy night feel_). Rain + slow music, generated live with the Web
Audio API — no audio files. `score.ts` is the music as pure data (eight chords
in F major, ten seconds each; the sparse top line is seeded per bar, so it
never loops); `ambience.ts` builds the node graph (`buildAmbience`, which also
renders offline via `renderAmbience` for measuring) and owns the live context
(`AmbienceEngine`: lazy creation, fades, suspends the context when nothing is
audible); `AmbientSound.tsx` is mounted in `ExperienceRoot` and only follows
the store. Controls — the soundbar, the HUD's top-right button, `M`, `/sound` —
all call `toggleSound()`.

Two store flags, because a preference is not the same as noise: `soundOn`
(the preference, default true, persisted in `localStorage` as
`workspace-os:sound`) and `soundUnlocked` (browsers block audio until the
first gesture; `AmbientSound` sets it on the first `click` / `keyup`).
Audible = `isSoundAudible(state)` = both. **Do not "fix" this into real
autoplay — browsers will not allow it.** The unlock listeners are bubble-phase
on purpose: a press on a sound control is handled first, so one gesture is
never counted as both "unlock" and "toggle" (before unlock, `toggleSound`
means "start"). The mix ducks to 20% while the phone's Spotify screen has real
players on it. Levels were set by offline measurement, not by ear (§8).

**The terminal** opens on a banner and one line: _Type /help to see the
available commands._ `/help` lists every command with a one-line description
(`HELP` in `commands.ts` — each row is also a button). The leading slash is
optional everywhere (`/resume` ≡ `resume`). There is deliberately **no menu**
and no number shortcuts (the owner asked for them to be removed); a
quick-command bar appears only on touch devices (`pointer: coarse`).

**Snake** (`os/snake/`, owner's request: _a minimal snake game in the
terminal_). `/snake` returns a `startGame` effect; `Terminal` then renders
`SnakeGame` where the input line was (the input is hidden, not unmounted) and
ignores clicks on commands in the scrollback until the game ends. The rules
are pure (`snake.ts`: immutable state, queued turns, seeded food placement,
`tickMs`); the component owns the `setTimeout` clock and a capture-phase
`window` keydown listener — capture so Esc quits the game before
`MonitorOS`'s Esc handler can leave the monitor. Board 22×13, cells 1.1em, so
it scales with the terminal's font like everything else on the screen.

**The phone** (`panels/PhonePanel.tsx`, panel id still `contact`) is a device,
like the monitor: a handset body picked up off the desk, the same lock screen
the 3D phone shows, auto-unlocking onto a home screen where LinkedIn, GitHub,
Instagram and WhatsApp are apps (plus Mail, Résumé, Website, Copy email), a
spelled-out connections list, and a "Say hello" button. It uses
`PanelShell`'s `bare` mode (no glass sheet). Handles live in
`content/profile.ts` → `links`.

The phone has screens (`PhoneView`: `home`, `spotify`); `openPanel('contact',
{ view })` opens it on one, which is how the headphones and `/spotify` land on
the **Spotify app**. Spotify refuses to be framed for *profile* pages (its
embed endpoint only serves playlists, albums, artists, tracks, shows and
episodes — verified), so that screen is a drawn profile plus Spotify's own
embedded player for each link in `profile.spotify.playlists` (converted by
`lib/spotify.ts`, unit-tested). **The list is empty right now** — the owner
said he will add playlists later; until then the screen is profile + a
"Follow on Spotify" link, and no music plays inside the phone.

**The helmet** is modelled on the owner's real one (he supplied a photo):
matte charcoal, hi-viz yellow blades, white flash, tinted visor. Geometry is
a sphere sculpted by `shape()` in `objects/Helmet.tsx` — with the eye port
actually recessed, a clear visor patch standing proud of it, pivots and vents
mounted on the surface normal; the livery is painted in the shell's UV space
by `textures/helmet.ts` in mirrored "side coordinates" (`EYE_PORT` is shared
by both files). It holds a fixed three-quarter pose taken from his photo and
does not turn on hover — he asked for the look over the motion. The manufacturer's wordmarks were deliberately not copied — the
lettering is his own ("SM-1", "SHUBX"); change it in `textures/helmet.ts`.

### Branding model

The **product** is an operating system: `WorkspaceOS v1.0.0`. The **person** is
the logged-in developer profile. Don't rename the OS after the person.

---

## 2. Governing principles

Full doctrine lives in `DESIGN_PHILOSOPHY.md`. The ones that bite most often:

1. **Golden rule of isolation.** `features/scene/`, `features/interface/`,
   `features/os/` and `features/audio/` **never** import from each other. They communicate only
   through `stores/experienceStore.ts`. `features/experience/ExperienceRoot.tsx`
   is the single composition root where they are mounted side by side. Shared
   constants live in `config/` (e.g. `screenTheme.ts`).
2. **Every animation needs a reason** — written in the header comment of the
   file that owns it.
3. **Restraint.** No lightning, camera shake, chromatic aberration, lens flare
   or heavy grain. Bloom is allowed only on things that emit light.
4. **Content is local and typed** (`src/content/`). Supabase is for
   submissions only.
5. **The experience must work silent, without a pointer, without WebGL, and
   with reduced motion.** Each of those has a real path (§4). Sound is on by
   default now (owner's request) but nothing depends on it: mute is one click,
   is remembered, and no information is carried by audio alone.

---

## 3. Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict, `noUncheckedIndexedAccess`)
· Tailwind CSS v4 · React Three Fiber v9 · three 0.172 · drei ·
`@react-three/postprocessing` · Framer Motion · Zustand · lucide-react · Zod ·
Vitest. (GSAP, React Query, Supabase, Resend are installed but unused so far.)

Node >= 20.11 (`.nvmrc`). npm, lockfile committed.

| Script                    | Purpose                  |
| ------------------------- | ------------------------ |
| `dev`                     | Dev server               |
| `build` / `start`         | Production build & serve |
| `lint`                    | ESLint (flat config)     |
| `typecheck`               | `tsc --noEmit`           |
| `test` / `test:watch`     | Vitest                   |
| `format` / `format:check` | Prettier                 |

CI (`.github/workflows/ci.yml`): typecheck → lint → test → build.

**Hosting:** GitHub Pages, repo `sudovex/MyWorkspace`, at
`https://sudovex.github.io/MyWorkspace/`. The app is a **static export**
(`next.config.ts`: `output: 'export'`, `images.unoptimized`, `trailingSlash`,
`basePath` from `NEXT_PUBLIC_BASE_PATH`). `.github/workflows/deploy.yml`
builds on push to `main` and deploys with `actions/deploy-pages`; it takes the
base path and site URL from `actions/configure-pages`, so a custom domain
needs no code change. Consequences: no server code (no API routes, no
server actions, no image optimisation — photos are pre-sized), and any
`public/` file referenced from code must use `asset()` (`src/lib/asset.ts`),
because Next does not add the base path to plain `src` strings. The
working copy lives in the owner's Git folder (`Workspace/Git/MyWorkspace`).

**URL flags:** `?tier=high|medium|low` (force device tier), `?quality=lite`
(no shadows / post, reduced resolution — for software renderers and profiling),
`?debug` (dev only: FSM walker). Dev builds also expose `window.__experience`
(the store). The returning-visitor cut is keyed on localStorage
`workspace-os:visited`.

---

## 4. Architecture

```
src/
├── app/                  routes, layout, providers, globals.css (tokens)
├── config/               site.ts (SEO / OS chrome), screenTheme.ts (monitor colours),
│                         audio.ts (volume, fades, storage key)
├── content/              profile.ts · resume.ts · gallery.ts · facts.ts   ← edit me
├── features/
│   ├── experience/       ExperienceRoot.tsx — composition root
│   ├── audio/            the room's sound (Web Audio, no files)
│   │   ├── score.ts                  the music as data (pure) + tests
│   │   ├── ambience.ts               node graph, offline render, AmbienceEngine
│   │   └── AmbientSound.tsx          follows soundOn / soundUnlocked in the store
│   ├── scene/            WebGL runtime
│   │   ├── Scene.tsx                 Canvas, tier config, fog
│   │   ├── boot/                     BootOverlay + pure timelines (boot, lamp, welcome)
│   │   ├── camera/                   poses.ts · introTimeline.ts · CameraRig.tsx ·
│   │   │                             idleBreathing.ts · mouseParallax.ts · sideLook.ts
│   │   ├── environment/              Lighting · Studio (env map) · Effects (bloom)
│   │   ├── interaction/              hotspots.ts · useHotspot.ts · cursor.ts ·
│   │   │                             GuideProjector.tsx
│   │   ├── room/                     layout.ts (all placements) · Room · RoomShell ·
│   │   │                             HitArea · Rod · usePainted · useCanvasFonts
│   │   │   ├── objects/              Desk Monitor Keyboard Lamp Helmet Calendar Shelf
│   │   │   │                         MonitorBody (housing, stand, glass, cable)
│   │   │   │                         DeskProps Headphones Soundbar Certificate Furniture
│   │   │   │                         WallDecor Beacons Dust WindowView (city + rain shader)
│   │   │   ├── textures/             canvas.ts · surfaces.ts · props.ts · screen.ts ·
│   │   │   │                         helmet.ts · skyline.ts (the city's four layers)
│   │   │   └── effects/ContactShadow
│   │   └── assets/                   AssetSlot + assetManifest (GLTF swap points)
│   ├── interface/        DOM over the room
│   │   ├── InterfaceRoot.tsx
│   │   ├── guide/                    Guide.tsx (first-visit arrows) · arrows.ts (pure)
│   │   ├── hud/                      Hud (identity, clock, sound, dock) · HoverLabel ·
│   │   │                             IntroTitle · Toast
│   │   └── panels/                   PanelShell · ResumePanel · GalleryPanel ·
│   │                                 PlaceholderArt · PhonePanel · CertificatesPanel
│   └── os/               the monitor's OS
│       ├── MonitorOS.tsx             lays the terminal over the glass
│       ├── terminal/                 Terminal.tsx · commands.ts (pure) + tests
│       └── snake/                    snake.ts (pure rules) + tests · SnakeGame.tsx
├── hooks/                useDeviceTier, usePrefersReducedMotion
├── lib/                  prng.ts (seeded PRNG: textures + audio) · spotify.ts · utils.ts
├── stores/               experienceStore (the FSM) · terminalStore · osStore · windowStore
└── types/                experience.ts (phases, panels, hotspots), os.ts, window.ts
```

### The experience FSM — the spine of the whole app

`src/stores/experienceStore.ts` + `src/types/experience.ts`

```
black → post → booting → monitor_on → reveal → room_idle ⇄ zooming → os_active
```

| From         | Allowed to                                                                              |
| ------------ | --------------------------------------------------------------------------------------- |
| `black`      | `post`, `reveal` _(returning visitor)_, `room_idle` _(reduced motion)_, `os_active` _(low tier)_ |
| `post`       | `booting`, `black`, `room_idle` _(skip)_                                                |
| `booting`    | `monitor_on`, `room_idle` _(skip)_                                                      |
| `monitor_on` | `reveal`, `room_idle` _(skip)_                                                          |
| `reveal`     | `room_idle`                                                                             |
| `room_idle`  | `zooming`                                                                               |
| `zooming`    | `os_active`, `room_idle` _(abort)_                                                      |
| `os_active`  | `room_idle`                                                                             |

Beyond `phase`, the store carries the cross-runtime state: `activePanel` /
`panelSection` / `panelOrigin` (which panel, which deep link, which object
opened it), `hovered`, `monitorRect` (the screen's rectangle in CSS px),
`lampOn`, `toast`. Actions: `transition`, `skipIntro`, `enterMonitor`,
`exitMonitor`, `openPanel`, `closePanel`, `toggleLamp`, `showToast`.
`canTransition` and `canOpenPanel` are pure and unit-tested.

### Who owns which phase

| Phase(s)                              | Owner                                                                 |
| ------------------------------------- | --------------------------------------------------------------------- |
| `black` `post` `booting` `monitor_on` | `boot/BootOverlay.tsx` (DOM cover; rAF/timeouts on pure timelines)    |
| `reveal`                              | `CameraRig` (authored push-in) + `IntroTitle` + `Lamp` (ignition)     |
| `room_idle`                           | `CameraRig` (breathing, parallax, panel "lean"), hotspots, `Hud`      |
| `zooming`                             | `CameraRig` (eased dolly; reports `monitorRect`; → `os_active`)       |
| `os_active`                           | `os/MonitorOS.tsx` (canvas is not rendering at all)                   |

### Camera (`camera/`)

- One model: a tweened **base pose**; `restingPose({phase, aspect, panelOrigin})`
  says where it should rest. `reveal` is the one authored timeline
  (`introTimeline.ts`: quintic weight, lagged look-at, ~1% overshoot + settle,
  shallow lateral arc, 3.4s).
- **Aspect-aware poses:** `monitorPoseFor(aspect)` backs off until the glass
  fits (≤80% of height, ≤90% of width); `deskPoseFor(aspect)` backs off on
  narrow viewports. Both unit-tested.
- `room_idle` adds breathing + damped parallax on top of the base, and is the
  one phase that renders continuously (`frameloop="demand"` everywhere else).
- Opening a panel from an object leans the camera toward it (`FOCUS_POSES`);
  the panel waits 0.3s so the move is seen.

### The monitor handoff (was the open "M4 seam" question — now decided)

**Pure DOM overlay, positioned by projection.** When `zooming` completes,
`CameraRig.reportScreenRect()` projects the screen's corners (`layout.SCREEN`)
through the live camera and stores the rectangle; `MonitorOS` lays the terminal
exactly there. The WebGL screen shows a canvas-painted idle terminal with the
same colours and chrome (`config/screenTheme.ts`), so the cut is invisible.
Terminal type scales with the screen via container-query units. Below 560px of
projected width (phones) and on the low tier, the terminal is a full-viewport
sheet instead.

### Coordinate convention (`room/layout.ts` is the single source)

Metres. Desk surface `y = 0`, floor `y = -0.75`, back wall `z = -0.82`, left
wall `x = -2.15`. Screen centre `[0, 0.375, -0.484]`, 0.82 × 0.46, facing `+Z`.
Camera FOV 40. `roomWide` pos `[2.5, 1.7, 4.05]`; `desk` pos `[0.3, 0.78, 1.9]`
→ target `[0.03, 0.37, -0.45]`.

### Rendering

- All geometry is procedural; all textures are painted on canvas at runtime
  (`textures/`), using the page's Geist fonts once loaded (`useCanvasFonts`).
  Nothing is fetched — no models, images or HDRIs.
- **Four real lights, no more:** the lamp's key (a `spotLight` down the
  shade's axis — the only shadow caster), the lamp's bounce fill, the
  monitor's bias light, the screen's key, plus the window's moonlight.
  Everything else that glows — the neon's wash, the shelf and desk LED strips,
  the screen's sheen on the desk — is **painted light** (`room/Glow.tsx`: an
  additive quad), and the shelf's books carry a little emission instead of
  being lit. Adding a real light costs every pixel in the room; add a `Glow`.
- `Studio.tsx`: a 64px procedural environment map for reflections.
- `Effects.tsx`: bloom (emitters are authored >1.0 with `toneMapped={false}`),
  a light grade (saturation/contrast), vignette, ACES tone mapping, and ~2%
  grain used as dither against banding.

**Performance budget (the scene must hold 60fps on an integrated GPU):**

- **Resolution:** DPR is capped at 1.5 (high) / 1.25 (medium), never above the
  device's own. `PerformanceMonitor` steps it down by 0.25 on sustained low
  fps and finally flips to a "lean" mode (no shadows, no post). MSAA only
  when the buffer is ≤1.25× (cheap there, unnecessary on dense displays).
- **Shadows are cached.** One spot light → one shadow pass, and
  `gl.shadowMap.autoUpdate = false`: `RenderDirector` (in `Scene.tsx`) only
  re-renders the shadow map while a hotspot is hovered (the only time a
  caster moves) and ~1.4s after. If you add a caster that moves on its own,
  it must request shadow updates or not cast.
- **The loop sleeps** inside the monitor (`os_active`) and behind any open
  panel (the room eases to a stop, then `CameraRig` stops invalidating).
- **No `backdrop-filter` over the live canvas.** The HUD, hover label and
  toast use solid translucent fills. The only blur is the panel backdrop, and
  the canvas is asleep under it.
- **Warm-up:** `RenderDirector` compiles all shaders and draws a few frames
  behind the boot cover, then sets `sceneReady`; `BootOverlay` holds black
  until then (max 5s), so the push-in never starts on a compile hitch.
- The monitor's canvas texture skips mipmaps (it re-uploads ~12×/s).

### Accessibility / fallback paths

- **Reduced motion:** `black → room_idle`; camera snaps everywhere; no
  breathing/parallax; panels fade instead of swinging.
- **Low tier / no WebGL:** `black → os_active`; the terminal opens full-screen
  over `StaticFallback`; résumé / gallery / contact panels all work from it.
- **Keyboard:** dock keys, terminal fully keyboard-driven, panels trap Esc and
  restore focus. Hotspots themselves are pointer-only — the dock is their
  keyboard equivalent.
- **SEO / screen readers:** `SeoFallback` server-renders the full résumé as
  semantic HTML from the same content files.

---

## 5. The intro (current numbers)

| Time (first visit) | Beat                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| 0.00–0.40          | Black hold                                                           |
| 0.40–2.70          | `post`: backlight wakes, 3 POST lines (600ms stagger), clear         |
| 2.70–3.95          | `booting`: hairline progress                                         |
| 3.95–5.41          | `monitor_on`: Welcome, 0.4s dead air, prompt, two 530ms blink halves |
| 5.41–8.81          | `reveal`: cover lifts (1.3s) on the wide shot; push-in; title card   |
| ~5.95              | lamp ignites (flicker → ramp, ember → amber, 1.15s)                  |
| 8.81               | `room_idle`: HUD in, beacons after ~0.9s; first-visit guide          |

- **Returning visitor:** 0.25s black → `reveal`. ~3.7s total.
- **Skip:** click or any key during the intro **cuts** to the desk (never
  fast-forwards). Hint appears at 1.5s.
- The boot timelines (`bootTimeline`, `lampTimeline`, `welcomeTimeline`) are
  pure modules from M2; their reasoning is in the archived context. One
  change since: the POST lines ("Loading developer profile…") were slowed
  from a 340ms to a 600ms stagger, with a 750ms hold on the last line, because
  the owner found them too fast to read. That adds 0.85s to the first visit.

---

## 6. Content — what is real and what is a stand-in

`src/content/` was written from Shubham's own facts (his existing site
shubhammali.in and what he has stated): role, company, dates, education,
projects, certifications, skills, links.

**Needs the owner's review / replacement:**

- **Experience bullets** (`resume.ts`) are now **roles and responsibilities**
  — the owner's own list for the Software Engineer role (lightly merged), and
  the internship's written to match (those four are inferred, not his words:
  confirm). The domain detail lives in each role's `summary` and `tags`. Still
  no metrics; one quantified highlight per role would strengthen it.
- **Headline copy** — "I build the part of the product that decides who gets
  in.", the gallery's intro paragraph and captions, and the mug facts — were
  written for him; edit to taste.
- **Both albums have real photos** — Rides nine (plates blurred), Gym five —
  with captions written from the photos: the owner should check them. Real
  photos:
  drop into `public/gallery/`, set `src` (and `album`: `rides` or `gym`) in
  `gallery.ts`, plus `aspect` (`9 / 16` for a phone photo) and, if a crop
  cuts a face, `focus` (e.g. `'center 15%'`). Export new photos
  at 900×1600 JPEG and blur any number plate first.
- **Availability** reads "Open to freelance projects & collaborations" (what
  his current site says). Change in `profile.ts` if he wants it to say more.
- `profile.resumeUrl` points at `https://shubhammali.in/resume.pdf` (the PDF on
  the current site). If this app replaces that site, host the PDF in
  `public/` and update the URL.
- The CodeChef SQL certificate reuses the Problem Solving verify link — the
  separate link wasn't recoverable from the old site.

---

## 7. Milestone status

- [x] **M0 — Foundation.**
- [x] **M1 — Scene shell.**
- [x] **M2 — Cinematic intro.** Inverted to a push-in; skip + returning cut built.
- [x] **M3 — Room interactivity.** Eight hotspots, beacons, hover label, dock, keys.
- [x] **M4 — The transition.** Monitor → DOM terminal over the glass; canvas idle.
- [ ] **M5 — OS core** (desktop, window manager). Not started — the terminal
      _is_ the OS. `windowStore` / `osStore` remain unused skeletons.
- [~] **M6 — Terminal + backend.** Terminal shipped (`/help`-driven). `sudo hire shubham` opens
  the contact panel; no Supabase / Resend submission flow yet.
- [~] **M7 — Content apps.** Résumé, gallery, contact shipped as panels.
  No blog / sandbox / downloads.
- [ ] M8 — Sandbox demos
- [ ] M9 — Easter eggs + polish (a few exist: `coffee`, `neofetch`, `lamp`, `ride`)
- [ ] M10 — Performance / a11y / SEO / deploy

---

## 8. Known issues / not done

1. **Frame rate has never been measured by an assistant.** Verification is
   headless Chromium on a software renderer (~1 fps), which proves layout,
   interaction and state — not smoothness. The first build was reported as
   not smooth on the owner's MacBook Air; the performance pass (§4) removed
   the known costs (a six-pass point-light shadow every frame, seven lights,
   a full 2× retina buffer with MSAA, live backdrop blurs) on reasoning, not
   on a profile. **If it is still not smooth, profile on the real machine**
   before guessing — Chrome's Performance panel, and `?quality=lite` to see
   whether the GPU or the main thread is the limit.
2. **Remaining cost centres**, in the order to cut them: bloom → the bias
   point light → shadow map size (2048 on high) → DPR cap.
3. **`room_idle` renders continuously** (breathing, parallax, steam, rain,
   beacons, the monitor's typed text) except behind a panel. Deliberate.
4. **Hotspots are pointer-only.** Keyboard users get the dock and its keys;
   there is no focus ring walking the 3D objects.
5. **No `public/` assets:** favicon, OG image, gallery photos, résumé PDF.
6. **Chair is out of frame at the desk pose on wide screens** (it shows in the
   wide shot and on narrow viewports). Intentional, but worth a look.
7. **Theme is still inert:** `osStore` has `day`/`night`; only night exists.
   The lamp toggle is the only lighting control.
8. `windowStore` quirks from M0 (minimize doesn't promote focus; restore
   strands geometry) are untouched — nothing uses the store yet.
9. Vitest is `environment: 'node'`, `.test.ts` only — components have no tests.
   Pure logic does: FSM, poses, intro timeline, boot timelines, terminal
   interpreter, the music score, the look-left rule, the guide's arrows, the
    snake rules (159 tests).
12. **Nobody has listened to the sound.** The ambience is synthesised and its
    levels and spectrum were checked by rendering it offline and measuring
    (about −22 dBFS RMS, rain and music roughly equal, no clipping) — that
    proves it is balanced and safe, not that it is pretty. If the owner finds
    it thin or dull, the knobs are the bus gains and filter cutoffs in
    `ambience.ts`, the chords in `score.ts`, and `config/audio.ts`. Swapping in
    a recorded loop instead is a small change inside `AmbienceEngine`.
13. The soundbar's lights are a fixed slow wave, not a real level meter — the
    scene may not import the audio feature (golden rule).
10. `package.json` `name` is still `shubham-os`.
11. Unused dependencies (gsap, react-query, supabase, resend) inflate install
    time, not the bundle.

---

## 9. Good next steps

1. Run it on a real GPU, tune light / bloom levels by eye, record the intro.
2. Replace placeholder content (§6): a metric or two in the experience, real
   photos.
3. Add `public/` assets: favicon, OG image (a screenshot of the desk), PDF.
4. M6: a real `sudo hire shubham` / contact submission (Supabase + Resend).
5. Optional delight: a day/night switch on the window, a second terminal
   theme, production GLTF models via `AssetSlot`, a volume slider, a distant
   thunder roll now and then.

---

## 10. How to resume a session

1. Read `DESIGN_PHILOSOPHY.md` (§9 first), then this file.
2. `npm install && npm run dev`; open `http://localhost:3000` (add `?debug`
   for the FSM walker).
3. Positions live in `room/layout.ts`; camera poses in `camera/poses.ts`;
   hotspot labels/actions in `interaction/hotspots.ts`; words in `src/content/`.
4. Keep the gates green: `npm run typecheck && npm run lint && npm test && npm run build`.
5. **At the end of the session, update this file.**
