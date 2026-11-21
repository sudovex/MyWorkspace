# Changelog

All notable changes per milestone.

## GitHub Pages deployment (Nov 2026)

### Added
- **`.github/workflows/deploy.yml`** — builds the site and publishes it to
  GitHub Pages on every push to `main` (or on demand from the Actions tab).
  The existing `ci.yml` only verified the build; it never deployed anything,
  which is why switching Pages to "GitHub Actions" showed no site.
- **Static export**: `next.config.ts` now sets `output: 'export'`,
  `images.unoptimized`, `trailingSlash` and `basePath` (from
  `NEXT_PUBLIC_BASE_PATH`, which the workflow reads from Pages: `/MyWorkspace`).
- `src/lib/asset.ts` — prefixes the base path onto `public/` files; the
  gallery photos use it (they 404'd under a sub-path otherwise).

### Changed
- `npm start` serves the exported `out/` folder (`next start` does not work
  with a static export).

## Real gym photos (Nov 2026)

### Changed
- **The Gym album is real.** Five of Shubham's gym photos replace the drawn
  samples (`public/gallery/gym-01.jpg` … `gym-05.jpg`, 900 px wide, 70–180 KB
  each). Four are 3:4, one (the window silhouette) is 9:16. The lift photo was
  saved mirrored (the "Welcome" screen and the T-shirt read backwards), so it
  was flipped the right way round. Titles and captions were written from the
  photos — edit them in `content/gallery.ts`.
- **`GalleryItem.focus`** — which part of a photo to keep when a frame crops
  it (CSS `object-position`), so faces near the top of a mirror selfie stay
  in frame. The ride photos keep their old framing (`center 62%`).
- **Masonry for short albums**: an album with fewer than two photos per
  column uses fewer, wider columns (five photos → three columns on a laptop),
  and a lone photo beside pairs may be framed extra tall (1:2) so the columns
  still end level. The drawn gym art (`GymArt`) stays in the code as the
  placeholder for any future gym entry without a photo.

## Real ride photos (Nov 2026)

### Changed
- **The Rides album is real.** Nine of Shubham's ride photos replace the
  eight drawn placeholders (`public/gallery/ride-01.jpg` … `ride-09.jpg`).
  Prepared for the web: rounded screenshot corners trimmed, cropped to 9:16,
  900×1600 JPEG (80–370 KB each, 1.8 MB together; Next serves smaller sizes).
  **Number plates are blurred** — his own and the friend's bike in "Riding in
  pairs" — because a plate can be looked up to its owner.
- Titles, captions and places were written from what each photo shows
  ("Top of the ghat", "Waterfall season", "Night shift" on NH 4…) — edit them
  in `content/gallery.ts`.
- **Portrait layout.** `GalleryItem.aspect` (width ÷ height). An album of
  portrait photos is now a masonry instead of the landscape bento: frames are
  dealt into columns row by row (2 on phones, 3 on tablets, 4 wider) and each
  column picks its frames' shapes — uncropped 9:16 where it can, slightly
  squarer crops where a column holds one more photo — so every column ends at
  the same height (`panels/masonry.ts`, pure, tested). The lightbox shows a
  portrait photo uncropped at its own aspect ratio, with narrow filmstrip
  thumbnails. The Gym album (still drawn samples) keeps the bento.

## A shaker bottle and a Gym album (Nov 2026)

### Added
- **A protein shaker on the desk**, right of the calendar (`objects/Shaker.tsx`):
  smoky translucent body with a chocolate shake and a printed scale, a black
  lid with a carry loop and a hi-viz yellow flip cap (the helmet's yellow).
  Hover gives it a quick shake; click opens the gallery on the **Gym** album.
  It has a beacon and an arrow in the first-visit guide. The desk did not
  need widening: it sits in the clear patch between the calendar, the lamp's
  base and the notebook.
- **Gallery albums.** The gallery now has **Rides** (the helmet) and **Gym**
  (the shaker) tabs, each with its own intro line. Gym starts with three
  sample frames (drawn: a loaded barbell, a dumbbell rack, a kettlebell and
  shaker) until real photos are added. Terminal: `gym`, `gallery gym`,
  `gallery rides`. Store: `panelAlbum`, `openPanel(..., { album })`.
- To add photos: put them in `public/gallery/` and add or edit entries in
  `content/gallery.ts` with `album: 'gym'` (or `'rides'`) and `src`.

## Shorter prompt (Nov 2026)

### Changed
- The terminal prompt and window title read `shubham@workspace` (was
  `shubham@workspace-os`) — on the monitor's idle screen in the room, in the
  real terminal, and in `neofetch`. The "WorkspaceOS" name in the banner is
  unchanged.

## A better monitor (Nov 2026)

### Changed
- **The monitor's body is rebuilt** (`objects/MonitorBody.tsx`): a slim
  graphite panel whose metal edge shows as a fine rim around a glossy black
  bezel (narrower: 12mm sides and top, a slightly deeper chin, was 18mm all
  round); a rounded hump on the back with vents, so it tapers from the side;
  a brushed-silver stand — a low foot with a softened edge and a curved arm
  rising to a hinge at the back of the panel; a webcam lens in the top bezel,
  a small "S M" monogram on the chin, and the power LED.
- **Cover glass**: a faint sheen across the whole front (a diagonal band, the
  top edge catching light, the desk lamp's warm reflection), so the screen
  reads as glass rather than a flat picture.
- **A power cable** runs from the back of the panel, behind the arm and off
  the back of the desk.
- The screen itself, its size and position, its lights and hover response are
  unchanged, so the terminal still lands exactly on the glass.

## Résumé PDF link (Nov 2026)

### Changed
- `profile.resumeUrl` is now `https://shubhammali.in/resume.pdf` (was
  `/resume`), so the résumé panel's **PDF** button, `resume --pdf` in the
  terminal and the SEO fallback open the file itself.

## GitHub username: sudovex (Nov 2026)

### Changed
- GitHub is now **github.com/sudovex** (was `shubhammali929`): the profile
  link and handle in `profile.ts` (phone, `/github`, `/contact`, SEO
  fallback), `site.ts`, and the FixMyCode and Easy Navigate source links in
  `resume.ts` (both repositories confirmed to exist under `sudovex`). The
  HackerRank profile is a separate account and still uses `shubhammali929`.

## Experience as roles and responsibilities (Nov 2026)

### Changed
- The experience bullets now describe each role's responsibilities, from
  Shubham's own list, instead of individual pieces of work. Software Engineer:
  six bullets (his eight, with testing and deployment points merged).
  Internship: four bullets in the same style. The domain detail that the old
  bullets carried (SSO with OAuth 2.0 / OIDC / SAML, multi-language SDKs) moved
  into each role's one-line summary and tags. Shows everywhere the résumé
  does: the panel, `experience` / `resume` in the terminal, and the SEO
  fallback.

## Snake in the terminal (Nov 2026)

### Added
- **`/snake`** — a minimal game of snake that takes the place of the prompt.
  Arrows or WASD to steer, Space to start / pause / play again, Esc or Q (or
  the `quit` link) to give the prompt back, which prints the score. On touch
  screens: swipe to steer, tap to pause; `snake` is on the touch quick-command
  bar. Walls and your own tail end the game; it speeds up a little with every
  bite; the best score is remembered (`localStorage`, `workspace-os:snake-best`).
  It pauses itself if the tab is hidden or a panel opens.
- `os/snake/`: `snake.ts` (the rules, pure, 16 tests) and `SnakeGame.tsx`.
  Esc is caught in the capture phase, so it quits the game instead of leaving
  the monitor; a second Esc leaves as before.

## A slower boot screen (Nov 2026)

### Changed
- The three boot lines on a first visit (`WorkspaceOS v1.0.0`, `Loading
  developer profile...`, `Preparing environment...`) now appear 600ms apart
  instead of 340ms, and the last one is held for 750ms instead of 420ms — they
  are on screen for about two seconds rather than one. The first-visit intro
  is 0.85s longer overall (≈8.8s); click or any key still skips it.
  (`boot/bootTimeline.ts`: `POST_LINE_STAGGER_MS`, `POST_HOLD_AFTER_LAST_LINE_MS`.)

## First-visit guide, a busier neon, a clearer shelf (Nov 2026)

### Added
- **A first-visit guide.** The first time a visitor reaches the desk, one
  message appears in the middle of the screen — _"Everything on this desk is
  clickable. Follow an arrow, click, and see what happens."_ — with an arrow
  from it to every clickable object (the coffee mug included, although it has
  no beacon in the room) and a pulsing ring on each. **Start
  exploring** (or Enter, Esc, or a click anywhere) clears it. It is shown
  once and remembered (`localStorage`, `workspace-os:guided`); the new **`?`
  button** in the top-right (or the `?` key) brings it back.
  - While it is up the room holds still and nothing in it reacts, so the
    arrows stay on their objects.
  - On portrait screens the message sits at the top and the arrows fan down.
  - `interface/guide/` (`Guide.tsx`, pure `arrows.ts` + tests);
    `scene/interaction/GuideProjector.tsx` tells the DOM where the objects are
    on the page, through the store (`guideOpen`, `guidePoints`).

### Changed
- **The neon stutters more often.** `> hello, world_` used to dip about once
  every 17 seconds; it now stutters every few seconds, on two unrelated
  periods (≈4.5s and ≈7.4s) so it never falls into a rhythm.

### Removed
- The glowing shield-and-keyhole sign on the lower shelf.

## The window: a new city, real rain (Nov 2026)

### Changed
- **The city outside is repainted, in depth.** Four layers instead of one
  flat picture (`textures/skyline.ts`): an overcast sky with the moon behind
  cloud; a hazy far skyline with landmark towers; a middle row of towers with
  lit office floors, flats, glass, rooftop billboards, neon signs and water
  tanks; and near buildings whose rooms you can see into (lamps, a TV's blue,
  curtains, blinds, a plant on a sill). Red aircraft lights blink on the
  tallest roofs.
- **The layers have parallax.** `objects/WindowView.tsx` is one quad with a
  small shader: each layer is looked up where the view ray would meet a plane
  that far behind the glass, so the city shifts with the camera — on the
  intro push-in, with the mouse, and when turning to the left wall.
- **The rain is outside now, and on the glass.** Three sheets of streaks fall
  between the layers at different distances and pick up the city's colours;
  on the pane itself, beads swell and dry and drops run down in stops and
  starts, leaving trails. Each drop refracts the city, and a light mist on
  the glass softens the view except where a drop has wiped it.

### Removed
- `objects/Rain.tsx` (instanced streaks that fell on the room side of the
  glass) and the old `createCityViewTexture`.

### Notes
- Cost: one draw call, four texture reads; no extra passes or geometry.
  Layer textures are 2048×1024 (mid, near) and 1024×512 (far, sky).
- Reduced motion: the weather is a still frame (a wet window, no movement).
- From the high, wide opening shot the window looks *down* into the city, so
  it shows streets and facades rather than sky — that is the parallax being
  honest, not a bug.

## The left side of the room (Nov 2026)

### Added
- **Look left.** At the desk, push the cursor against the left edge of the
  screen and the camera turns to the left wall — the window, the two framed
  prints — keeping the monitor in the right of the frame. Move the cursor back
  into the right third of the screen and it faces the desk again. Also `←` /
  `→`, and a slim tab on the screen's edge (the way to do it on touch).
  `roomView` in the store; the rule is pure (`camera/sideLook.ts`, tested).
- **Picture lights over the prints**: a small brass light above each frame
  with a warm pool on the wall (painted — no new real lights).
- **The wall runs off into the dark.** Past the prints the left wall fades to
  the backdrop colour (a gradient decal), so the far end of the room is night
  rather than an edge — in the turned view and in the opening wide shot.

### Notes
- The turn is a blend on top of the camera's base pose, not a new base, so it
  composes with breathing, parallax and the panel "lean" moves. Opening a
  panel or the monitor from the turned view faces the desk first (no jump:
  the leftover turn is folded into the base pose).
- Reduced motion: the cursor does not trigger it; the keys and the tab do, as
  a cut.
- On portrait screens the turned view aims at the prints themselves.

## Sound: a soundbar, rain and slow music (Nov 2026)

### Added
- **Ambient sound, on by default**: night rain on the window and slow, soft
  music (an eight-chord loop in F major — pad, low root, sparse bell-like
  keys with an echo). It is **generated in the browser** with the Web Audio
  API (`features/audio/`): no audio files, nothing to download. The score is
  pure data (`score.ts`, unit-tested); the top line is seeded per bar, so it
  is the same every visit but never loops.
- **A small soundbar under the monitor.** Click it to mute / unmute. A row of
  five lights behind the cloth rolls while the room is audible; muted, one
  amber light stays on.
- **A sound button in the top-right of the HUD** (also shown on phones), the
  **`M` key**, and **`/sound`** in the terminal (`sound on`, `sound off`,
  `mute`, `unmute`).
- `soundOn` / `soundUnlocked` in the store (`isSoundAudible`), `toggleSound`.
  The mute choice is remembered between visits (`localStorage`,
  `workspace-os:sound`).

### Notes
- **Browsers do not let a page play audio before the visitor interacts with
  it.** So "on by default" means: it starts with the first click or key press
  anywhere — in practice the click that skips the intro, or the first object
  clicked. Until then the HUD button reads "Click for sound".
- The audio context is suspended whenever nothing is audible (muted, or the
  tab is in the background), so silence costs no CPU.
- Levels were set by measurement (offline render: about −22 dBFS RMS, peaks
  under −7 dBFS, no clipping), **not by ear** — no assistant has listened to
  it. Tune in `config/audio.ts` (`volume`, `rain`, `music`) and the gains in
  `features/audio/ambience.ts`.
- `lib/prng.ts`: the seeded PRNG the textures used, now shared with the audio.

## Spotify inside the phone (Nov 2026)

### Changed
- The headphones (and `/spotify`) no longer open a new tab: they open **the
  phone on a Spotify app screen** — profile, an equaliser, a "Follow on
  Spotify" link, and an embedded Spotify player for every link in
  `profile.spotify.playlists` (empty for now; `lib/spotify.ts` converts share
  links to embed URLs). A profile page itself cannot be embedded — Spotify
  does not allow it.
- The phone gained screens (`PhoneView`) and a Spotify tile on its home
  screen, replacing "Copy email".
- `openPanel` accepts a `view`; `panelView` in the store.

## Certificates, headphones, the lamp switch (Nov 2026)

### Added
- **A framed certificate on the wall** (under the shelves). Clicking it opens
  a new **certificates panel**: every certification as a sheet of paper with
  issuer, description, credential ID, a seal and a verify link. Also
  `/certificates` in the terminal. `CertificationEntry` gained `description`
  and `credentialId`.
- **On-ear headphones on a stand** at the front-left of the desk. Hover: they
  rock and the cup rings pulse green. Click: opens the Spotify profile in a
  new tab (`profile.links.spotify`). Also `/spotify` in the terminal.

### Changed
- **The lamp is its own switch.** The top-right lamp button is gone; clicking
  the lamp toggles it (it already did — it now has a beacon and a clearer
  hover label so it is discoverable). The `L` key still works.
- Beacons now also mark the lamp, the certificate and the headphones.

## Helmet, second pass (Nov 2026)

From a second photo (three-quarter view from above).

### Changed
- The helmet now **holds the photo's pose** — nose toward the camera and to
  the left — instead of turning on hover (hover lifts it slightly and
  brightens the visor's edge).
- A **proper visor**: the eye port is sunk into the shell and the shield is a
  clear, tapering patch standing proud of it with a bright rim, so you look
  through it at the liner and cheek pads. Round pivots with a coin-slot screw.
- Crown, brow and chin **vents**, mounted along the surface's true normal.
- Livery re-drawn from the new angle: black centre ridge, white chevrons and
  nested yellow arcs on the crown, the brow blade, a pinstriped halftone
  panel, the yellow band down the back.
- Slightly larger and a touch further forward, with a generous hit area.

## WhatsApp + the real helmet (Nov 2026)

### Changed
- **Helmet** restyled after the owner's own helmet (from a photo): matte
  charcoal shell, hi-viz yellow blades, white flash under the visor, halftone
  crown panel, tinted visor on round pivots. The shell is now a sculpted
  sphere (longer than wide, jutting chin bar, tucked nape, spoiler lip, flat
  base) with a painted livery (`textures/helmet.ts`), and rests three-quarters
  on to the camera. The manufacturer's lettering is replaced with his own
  ("SM-1", "SHUBX").
- **WhatsApp** (`wa.me/918421075337`) added to `content/profile.ts`, the
  phone's home screen and connections list, the terminal (`/whatsapp`,
  `/contact`) and the SEO fallback. HackerRank left the phone's grid to make
  room (it is still in the résumé's certifications).

## The phone (Nov 2026)

### Changed
- Clicking the phone (or Contact / `contact` / `sudo hire shubham`) now opens
  a **phone handset** instead of a contact card: lock screen → home screen
  with LinkedIn, GitHub, Mail and Instagram as apps, plus Résumé, Website,
  HackerRank and Copy email, a connections list and a "Say hello" button.
  `PanelShell` gained a `bare` mode for it.
- Instagram (`@shubx404`) added to `content/profile.ts`, the terminal
  (`/instagram`, `/contact`) and the SEO fallback.

### Removed
- `panels/ContactPanel.tsx` (replaced by `PhonePanel.tsx`).

## Performance + polish pass (Nov 2026)

After the first run on a real MacBook Air ("improve graphics and make it
smooth").

### Changed — smoothness
- Lamp key is now a **spot light** (one shadow pass instead of a point
  light's six) and the **shadow map is cached** — redrawn only while a
  hotspot is hovered.
- **Seven dynamic lights → four.** The neon, shelf strip and LED washes are
  painted additive quads (`room/Glow.tsx`).
- **Resolution capped** at 1.5× (was a full 2× retina buffer with 4× MSAA),
  adaptive below that, with a "lean" last resort.
- **No `backdrop-filter` over the live canvas** (HUD, hover label, toast);
  panels are opaque and the **render loop sleeps** behind them.
- **Shader warm-up** behind the boot cover (`sceneReady`), so the push-in
  never starts on a compile hitch.

### Changed — graphics
- Lamp now points at the desk; shadows are 2048px on the high tier.
- LED strip along the desk's back edge, a second strip under the upper shelf,
  the screen's sheen on the desk, a wider neon wash.
- An edge-lit acrylic shield-and-keyhole sign on the shelf.
- Colour grade (saturation/contrast) and ~2% dithering grain.
- The floor plant moved into frame.

### Changed — terminal
- The numbered "Pick an option" menu and number shortcuts are **removed**.
  The session opens on _Type /help to see the available commands._
- `/help` lists every command with a short description (each row clickable).
  A leading slash is optional on every command; Tab completion keeps it.
- New `history` command. Long output now starts at its first line instead of
  scrolling it away. The quick-command bar shows on touch devices only.

## Build-out — the room becomes a portfolio (Nov 2026)

Everything from "implementation-complete but never seen in a browser" to a
working, browser-verified portfolio. See `CONTEXT.md` for the full handoff.

### Added
- **Intro, inverted:** the page opens on a wide establishing shot and the
  camera pushes in to the desk (`camera/introTimeline.ts`), under a title
  card. The lamp ignites during the move. Skip (click / any key) and a short
  returning-visitor cut.
- **The room, rebuilt:** procedural walnut desk, plank floor, painted walls,
  rug, a window onto a night skyline with rain, neon sign, wall prints,
  floating bookshelves, architect lamp, instanced backlit keyboard, helmet,
  tear-off calendar (today's real date), phone, notebook, mug with steam,
  chair, plant. All textures are painted on canvas at runtime — no assets.
- **Lighting & post:** every light is motivated by an object; a procedural
  environment map for reflections; bloom + vignette + filmic tone mapping.
- **Eight hotspots** (`interaction/hotspots.ts`, `useHotspot`), each with its
  own physical hover response, plus beacons, a cursor hover label, a dock and
  keyboard shortcuts.
- **Monitor terminal** (`features/os/`): the camera zooms to the screen and a
  real DOM terminal is laid exactly over the glass. Pure, unit-tested
  interpreter; numbered menu, clickable commands, history, Tab completion.
- **Animated résumé, gallery and contact panels** (`features/interface/`).
- **Typed content** in `src/content/` (profile, résumé, gallery, facts).
- Low-power path now opens the terminal full-screen instead of a dead end;
  `SeoFallback` mirrors the full résumé.
- `?tier=`, `?quality=lite`, `?debug` URL flags.

### Changed
- `experienceStore`: new transitions (skip paths, `black → reveal`), panel /
  hover / monitor-rect / lamp state and actions.
- `CameraRig` rewritten around one tweened base pose; poses adapt to the
  viewport's aspect ratio (`camera/poses.ts`).
- `ExperienceRoot` moved to `features/experience/` (the composition root).
- `terminalStore` now holds structured entries.
- New dependency: `@react-three/postprocessing`.

### Removed
- `camera/pullbackTimeline.ts` (superseded by the push-in), `Books.tsx`,
  `BikeKeys.tsx`, `DeskDetails.tsx`, `Notebook.tsx` (folded into the rebuilt
  objects), unused asset-manifest ids.

## M2 — Cinematic intro (superseded by the build-out above)

### Changed
- **Branding:** renamed the product to **WorkspaceOS**; the person is now
  modelled as the logged-in developer profile (`Shubham Mali`) rather than the
  OS being personal. `siteConfig` restructured (`osName`, `osVersion`,
  `developer`), metadata / fallbacks updated, persisted-settings key renamed to
  `workspace-os-settings`.

_(Intro choreography, alive-environment systems, sound architecture, and
imperfections land once an intro timeline direction is chosen.)_

## M1 — Scene shell

### Added
- R3F `<Canvas>` root (`Scene`) with `frameloop="demand"`, tier-gated DPR /
  shadows / antialias, and `PerformanceMonitor`-driven DPR backoff.
- Pose-driven `CameraRig` that performs the backward pullback and settles
  without burning frames (invalidates only while travelling).
- Named camera poses (`monitorClose`, `roomReveal`) as reversible data.
- Placeholder room: shell (floor, walls, window), desk, monitor (named screen
  mesh), warm lamp light, cool moonlight, furniture and desk props.
- `AssetSlot` + `assetManifest` — GLTF swap system (data-only replacement).
- `useDeviceTier` capability detection and low-tier `StaticFallback`.
- `dampVector3` framerate-independent smoothing utility (no new deps).
- Dev-only `DebugPanel` for walking the FSM.
- Vitest + experience-store test suite; GitHub Actions CI
  (typecheck / lint / test / build); `TODO_ASSETS.md`.

### Changed
- **experienceStore / experience types:** reworked the FSM to the new boot
  narrative — `black → post → booting → monitor_on → reveal → room_idle →
  zooming → os_active`, with reduced-motion (`black → room_idle`) and low-tier
  (`black → os_active`) skip paths.
- `siteConfig`: added a single `osName` constant so the OS brand is swappable.
- `ExperienceRoot`: replaced the M0 harness with a tier-aware entry that
  dynamically imports the Scene (`ssr: false`).

### Fixed
- Seeded the camera look-at target to the monitor pose to avoid a first-frame
  gaze swing from the world origin.

## M0 — Foundation
Initial scaffold: Next.js 15 / React 19 / TypeScript (strict) / Tailwind v4,
state stores, the guarded experience FSM, Zod env, Supabase factories,
providers, and tooling (ESLint flat config, Prettier).
