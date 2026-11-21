# WorkspaceOS — Design Philosophy

> **Purpose of this file.** This is the _why_, not the _what_. For architecture,
> file layout, FSM wiring, milestone status, and exact current numbers, read
> `CONTEXT.md`. This file is the permanent doctrine behind those numbers — it
> should barely change between milestones, while `CONTEXT.md` changes every
> session. If a future decision seems to contradict this file, that is a signal
> to stop and reconcile it explicitly, not to quietly drift.

---

## 1. What this is

An interactive 3D workspace portfolio. You don't read it — you **boot** it.

Two runtimes fused at one seam: a WebGL room at night (rain, warm lamp,
sleeping monitor), and a hand-built desktop OS in real DOM. Clicking the
monitor hands off from one to the other without a page reload.

The **product** is the operating system (`WorkspaceOS v1.0.0`). The **person**
is the logged-in developer profile (`Shubham Mali`). The OS is not personal —
the user of it is.

---

## 2. The core inversion

**Wrong:** the camera moves → the room appears.
**Right:** light reveals the world → the camera only reveals _where the light
already is._

Nothing switches on during a camera move. Every light source turns on while
the camera is still, and the camera's job is only to travel to a frame the
light has already prepared. This single reversal is the difference between an
intro that feels _rendered_ and one that feels _shot_.

A direct consequence: **dust and rain can only exist where light already
reaches them.** Dust must never appear before the lamp that illuminates it is
already on. Rain on the window can only be revealed once the window is in
frame — which, given the camera starts tight on the monitor and the window is
out of frame at that pose, means dust and rain both belong to the pullback,
not before it. This is geometry, not preference.

---

## 3. Governing principles

These override convenience. If a change violates one of these, don't make it.

1. **Golden rule of isolation.** `features/scene/` and `features/os/` **never**
   import from each other. They communicate only through
   `stores/experienceStore.ts`.
2. **Quality gate over feature count.** Each milestone must feel _exceptional_
   before the next begins. Do not advance in order to add features.
3. **Every animation needs a narrative reason.** If it exists only because it
   looks cool, remove it. See §6.
4. **Luxury is restraint.** No lightning, no camera shake, no chromatic
   aberration, no lens flare, no grain above ~2%. Explicitly rejected — do not
   re-propose them without a genuinely new argument.
5. **Improve existing effects; don't add new ones.** Once a milestone is
   locked, the next pass polishes timing, easing, and composition — it does
   not introduce new mechanics.
6. **Content is local and typed.** `src/content/` is TS + MDX,
   server-renderable for SEO/a11y. Supabase is for _submissions only_, never
   for content.
7. **No third-party windowing library.** The window manager is hand-built.
8. **Respect the user's time.** Runtime budgets are hard limits, not
   aspirations.
9. **The intro must work fully silent.** Browsers block autoplay; audio can
   never be load-bearing for comprehension or pacing.

---

## 4. Tone doctrine

- **POST / boot copy:** minimal, elegant, confident. No humour, no
  fake-hacker aesthetic, no BIOS spam, no loading spinners. Three lines, not
  four — four lines reads as a list, three reads as a rhythm.
- **Typography carries meaning.** Tracking and size contrast between adjacent
  lines is a deliberate design tool (e.g. a muted, wide-tracked label line
  above a tighter, larger name line) — it's what makes static text read as
  _designed_ rather than dumped.
- **Terminals don't fade.** Text that belongs to a terminal/BIOS register
  appears and clears in hard cuts, one frame, never a fade. Fades are for
  organic/physical things (lamp warmth, panel brightness); hard cuts are for
  digital/informational things (POST lines, the cursor).
- **Colour is warm/cool tension, on purpose.** The room is warm tungsten (the
  lamp); the machine is cool monitor-light. Reserve the warm accent for rare,
  meaningful moments — don't let it leak into ambient UI.

---

## 5. The overlap principle

Beats in a _list_ happen one after another. Beats in a _film_ bleed into each
other. Every beat should start roughly 25–30% before the previous one settles.

**The one deliberate exception** is the dead-air pause after "Welcome"
appears and before the cursor starts blinking: that pause must be clean on
both sides, with nothing overlapping it. Its power comes entirely from being
the only moment in the whole piece that does not overlap with anything else.
Do not "improve" it by filling it with a transition — that would delete the
one thing that makes it read as a pause rather than a delay.

---

## 6. Why each animation exists

If you can't fill in the right-hand column for a proposed effect, don't build
it.

| Animation                     | Narrative reason                                                       |
| ----------------------------- | ---------------------------------------------------------------------- |
| Black hold                    | The machine is off. Absence is a state, not empty time.                |
| Panel wake overshoot          | LCD backlights overshoot on power-on. Physical truth, not decoration.  |
| Exposure ramp                 | The viewer's eyes adapting to a dark room.                             |
| POST stagger                  | Sequential work being done — the machine is actually doing something.  |
| Keyboard LEDs                 | POST finished; peripherals initialize in order.                        |
| Desk becoming visible         | A _consequence_ of existing light — never its own animation.           |
| Lamp ramp + colour warming    | Tungsten physics. The machine woke the room someone actually lives in. |
| Dust in the lamp cone         | Evidence the lamp is on. Cannot exist without it — see §2.             |
| "Welcome", no fade            | Terminals don't fade in.                                               |
| Dead air                      | The machine finished and is now waiting. See §5.                       |
| Cursor blink                  | Waiting for input. The machine has manners.                            |
| Cursor vanish on move         | The machine stopped waiting because we're leaving.                     |
| Camera pullback               | Reveals the room the light already lit.                                |
| Split position / look-at      | Physical camera operators lead with one, lag the other. Mass.          |
| Overshoot + settle on arrival | Cameras have inertia.                                                  |
| Rain arriving on the window   | The window enters frame — see §2.                                      |
| Idle breathing                | The world didn't stop existing once the camera parked.                 |

---

## 7. The three emotional anchors

Everything else in the intro is transition between these three. If a cut has
to be made under time pressure, protect these first:

1. **The cursor pause** — a prompt and one blinking block, motionless, for
   several seconds. The screenshot moment. The machine has manners.
2. **The lamp warming** — cold blue machine light warming to tungsten.
   Before it, this is hardware; after it, it's somebody's room at night.
3. **The cursor vanishing exactly as the camera starts moving** — one frame,
   two events. The mind welds them into cause and effect and concludes the
   whole thing was authored, not computed.

All three are **screen and light**. None of them is the camera. The camera
move itself is the least memorable element of the piece and should be
treated as connective tissue between anchors, not a centerpiece.

---

## 8. Trade-off doctrine (what to cut, and in what order)

When forced to cut for time or risk, cut in this order: secondary ambient
detail (keyboard LEDs) → hinting effects that duplicate a later, stronger
beat (an early dust hint once dust already lives in the pullback) → one
repetition of a repeating beat (one fewer cursor blink).

**Never cut:** the black hold, the lamp, the dead air. These three carry the
entire emotional argument of the piece; everything else is in service of
them.

When a choice must be made between "more choreographed" and "one clear
thing happening," choose the one clear thing. A window with four concurrent
systems reads as noise even if each system is individually justified by §6.

---

## 9. Amendments — the "build-out" session (Nov 2026)

The owner's direction for this session was explicit: *the page should zoom in
to the desk on load, every object should be a doorway, and it should look
spectacular.* Where that direction and the doctrine above disagreed, the
direction won. These are the deliberate departures — recorded so they are not
"fixed" back by a later session reading §2–§8 literally.

| Doctrine (above)                                   | What is now built, and why                                                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §2: the camera starts tight on the monitor and pulls **back** | The camera opens on a **wide** establishing shot and pushes **in** to the desk. The boot screen still plays first, as a DOM cover.                                                               |
| §2: nothing switches on during a camera move       | The lamp **ignites during the push-in** (~0.5s in). Flying into a room that is coming alive is the stronger beat for an inbound move; the window, monitor and neon are already lit when the cover lifts. |
| §3.4 / §3.5: no postprocessing pipeline            | **Bloom + a light vignette** (`environment/Effects.tsx`). Still no chromatic aberration, lens flare, shake or heavy grain — only things that emit light bloom.                                          |
| CONTEXT §6 (v2): no floating labels, three interactive objects | Eight clickable objects, with **beacons**, a cursor **hover label** and a **dock**. A portfolio has to be discoverable in the 30 seconds a recruiter gives it; bespoke per-object physical responses were kept on top. |
| §7 anchor 3: cursor vanishes as the camera moves   | Still true in spirit: the cover lifts on the same frame `monitor_on` ends. The title card over the push-in is new.                                                                                       |

**Sound (later amendment, owner's request).** The room is no longer silent by
default: night rain and slow music start with the visitor's first interaction
(browsers allow nothing earlier). The restraint doctrine still applies to it —
it is a backdrop, mixed quietly, with no stingers, UI clicks or hover sounds;
one click on the soundbar or the HUD mutes it and the choice is remembered;
and nothing in the experience depends on hearing it.

**Performance is part of the design.** A cinematic room that stutters is
worse than a plain page. The rule that came out of the first real-hardware
run: _light the room with as few real lights as possible and paint the rest_
(see `CONTEXT.md` §4, "Performance budget"). New glow → `Glow`, not a light.

What did **not** change: warm/cool tension (the lamp is the only warm key;
amber stays reserved for accents), hard cuts for terminal text, the dead-air
pause, the golden rule of isolation, and "every animation
needs a reason" — each new one has its reason in its file's header comment.

---

## 10. How to use this alongside CONTEXT.md

- Read this file once, at the start of a session, to recalibrate judgment.
- Read `CONTEXT.md` every session — it has the numbers, the file map, and
  what's actually shipped.
- If you're about to make a call this file doesn't cover, make the call that
  a restrained, physically-motivated, silent-by-default film would make — then
  add the reasoning here if it's likely to recur.
