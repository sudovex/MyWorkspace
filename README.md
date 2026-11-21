# WorkspaceOS

An interactive 3D workspace portfolio. You don't read this portfolio — you
**fly into a room** at night, **click the things on the desk**, and **use the
monitor's terminal**.

> Status: the room, the intro, the monitor terminal, the animated résumé, the
> gallery and contact are built and browser-verified. See `CONTEXT.md` for the
> full handoff and the milestone plan below for what is left.

## What you can do in it

| In the room           | What it opens                                                           |
| --------------------- | ----------------------------------------------------------------------- |
| **Monitor**           | Camera zooms in → a real, usable terminal (type `/help`)                |
| **Desk calendar**     | The animated résumé, at the career timeline                             |
| **Bookshelf**         | The animated résumé, from the top                                       |
| **Notebook**          | The résumé, at projects                                                 |
| **Helmet**            | The photo gallery — Rides                                               |
| **Shaker bottle**     | The photo gallery — Gym                                                 |
| **Phone**             | A handset with your socials as apps (LinkedIn, GitHub, Mail, Instagram) |
| **Certificate frame** | All your certificates                                                   |
| **Headphones**        | The phone, on its Spotify app                                           |
| **Soundbar**          | Mutes / unmutes the room's rain and music                               |
| **Lamp** / **mug**    | Click the lamp to switch the light / the mug tells you something        |

Everything is also on the dock and on keys: `T` terminal · `R` résumé ·
`G` gallery · `C` contact · `L` lamp · `M` sound · `?` guide · `Esc` back.

**First visit.** New visitors get one message with arrows to everything that
can be clicked; "Start exploring" clears it. It shows once per browser — the
`?` button in the top-right corner brings it back. To see it again while
developing, clear `workspace-os:guided` in the browser's local storage.

**Look left.** Push the cursor against the left edge of the screen (or press
`←`, or tap the tab on the edge) and the camera turns to the left wall and its
framed prints; move back to the right (or `→`) to face the desk.

**Sound.** The room plays night rain and slow music, generated in the browser
(no audio files). It is on by default, but browsers only let it start after
the visitor's first click or key press. Mute with the soundbar under the
monitor, the button in the top-right corner, `M`, or `/sound` in the terminal;
the choice is remembered. Loudness lives in `src/config/audio.ts`.

**Your content lives in `src/content/`** — `profile.ts`, `resume.ts`,
`gallery.ts`, `facts.ts`. To add real photos, drop them in `public/gallery/`
and add or edit entries in `gallery.ts`: set `src` (e.g. `'/gallery/gym-01.jpg'`)
and `album` (`'rides'` for the helmet, `'gym'` for the shaker).

## Concept

The experience is two runtimes fused at one seam:

1. **The Scene** — a WebGL room (rain on the window, warm lamp light, a neon
   sign, a live terminal on the monitor) rendered with React Three Fiber.
2. **The interface** — DOM panels the room's objects open (résumé, gallery,
   contact), plus the HUD and dock.
3. **WorkspaceOS** — the monitor's terminal, in real DOM for full
   interactivity and accessibility.

Clicking the monitor zooms the camera in and hands off from WebGL to DOM without
a page reload: the terminal is positioned exactly over the monitor's glass. The
moment the OS is active, the WebGL scene **freezes** to return the GPU to the
interface.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
React Three Fiber v9 · Three.js · Drei · GSAP · Framer Motion · Zustand ·
React Query · Zod · Supabase · Resend · shadcn/ui · Vercel.

## Architecture at a glance

```
src/
├── app/            Next.js routes, layout, providers, global styles
├── config/         Site metadata (typed, single source)
├── content/        Typed portfolio content (TS + MDX) — never a database
├── features/
│   ├── experience/ Composition root — the only place the runtimes meet
│   ├── scene/      WebGL runtime (the room + cinematic camera)
│   ├── interface/  DOM over the room (HUD, dock, résumé / gallery / contact)
│   ├── os/         DOM runtime (the monitor's terminal)
│   └── easter-eggs/
├── hooks/          Cross-feature reusable hooks
├── lib/            utils, env (Zod), Supabase clients
├── stores/         Zustand state (experience FSM, windows, OS, terminal)
├── types/          Framework-free domain models
└── components/ui/  shadcn primitives
```

**Golden rule:** `scene/`, `interface/` and `os/` never import from each
other. They communicate only through `stores/experienceStore.ts` — the finite state machine
that governs the whole journey.

## Getting started

Requires Node ≥ 20.11 (see `.nvmrc`).

```bash
npm install          # or pnpm install
cp .env.example .env.local   # optional at this stage; app runs without secrets
npm run dev
```

Open http://localhost:3000.

Handy URL flags: `?tier=high|medium|low` forces a device tier, `?quality=lite`
turns off shadows and post-processing, `?debug` (dev only) shows the FSM
walker. The intro is shorter on return visits — clear the
`workspace-os:visited` localStorage key to see the full first-visit cut.

### Scripts

| Script            | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `dev`             | Start the dev server                       |
| `build`           | Static export into `out/`                  |
| `start`           | Serve `out/` locally (after `build`)       |
| `lint`            | ESLint (flat config, Next + TS + Prettier) |
| `typecheck`       | `tsc --noEmit`                             |
| `format`          | Prettier write                             |

## Deploying (GitHub Pages)

The site is a **static export** (`output: 'export'` in `next.config.ts`):
`npm run build` writes plain files to `out/`, which any static host can serve.

`.github/workflows/deploy.yml` builds and publishes it to GitHub Pages on
every push to `main` (and from **Actions → Deploy to GitHub Pages → Run
workflow**). One-time setup: **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The site then lives at
`https://sudovex.github.io/MyWorkspace/`.

The workflow reads the sub-path (`/MyWorkspace`) from Pages and passes it to
the build as `NEXT_PUBLIC_BASE_PATH`; files from `public/` must go through
`asset()` (`src/lib/asset.ts`) so they pick it up. With a custom domain set in
Settings → Pages the sub-path becomes empty automatically.

To check an export locally under the same sub-path:

```bash
NEXT_PUBLIC_BASE_PATH=/MyWorkspace npm run build
mkdir -p /tmp/pages && ln -sfn "$PWD/out" /tmp/pages/MyWorkspace
npx serve /tmp/pages   # open http://localhost:3000/MyWorkspace/
```

## Environment

All variables are **optional at M0** — the app builds and runs without a
backend. They become required when the Contact form and `sudo hire shubham`
workflow ship in M6. See `.env.example`.

## Milestone plan

- [x] **M0 — Foundation**: tooling, strict TS, design tokens, state stores, the guarded experience FSM.
- [x] **M1 — Scene shell**: R3F canvas, pose-driven camera rig (pullback), placeholder room + asset-slot swap system, night lighting, device-tier + reduced-motion fallbacks, Vitest, CI.
- [x] **M2 — Cinematic intro**: boot screen, wide-shot push-in to the desk, title card, skip + returning-visitor cut.
- [x] **M3 — Room interactivity**: eight clickable objects, beacons, hover labels, parallax, dock + keys.
- [x] **M4 — The transition**: monitor → terminal handoff (DOM laid over the glass), canvas freeze.
- [ ] M5 — OS core (desktop, window manager, shortcuts) — the terminal is the whole OS for now
- [~] M6 — Terminal + backend: terminal shipped; `sudo hire shubham` opens contact, no Supabase/Resend yet
- [~] M7 — Content apps: résumé, gallery (placeholder photos) and contact shipped as panels
- [ ] M8 — Sandbox demos
- [ ] M9 — Easter eggs + polish
- [ ] M10 — Performance / a11y / SEO / deploy

## License

MIT © 2026 Shubham
