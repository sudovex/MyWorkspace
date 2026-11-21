# Asset backlog

Every physical object in the room currently renders as **procedural geometry
built in code** (with canvas-painted textures) — good enough to ship, but each
is still a swap point. Production models drop in without any code change: set `gltfPath` in
`src/features/scene/assets/assetManifest.ts` and the matching `<AssetSlot>`
renders the model in place of its placeholder, inheriting the exact transform.

## Conventions

- **Format:** glTF 2.0 binary (`.glb`), Draco or Meshopt compressed.
- **Location:** `/public/models/<id>.glb`.
- **Textures:** KTX2 / Basis compressed where possible; power-of-two, square.
- **Origin:** model origin at its natural resting base; +Z faces the viewer.
- **Scale:** metres. Desk surface sits at world `y = 0`, floor at `y = -0.75`.
- **Replacement location (per object):** `assetManifest.ts` → set `gltfPath`.

## Backlog

| Asset id | Object | Poly budget (tris) | Base texture | Interactions (milestone) |
| --- | --- | --- | --- | --- |
| `desk` | Desk | 3,000 | 2048 | — |
| `monitor` | Monitor | 4,000 | 1024 | click → terminal (shipped) |
| `keyboard` | Mechanical keyboard | 8,000 | 1024 | hover, key press (M3) |
| `mouse` | Mouse | 2,000 | 512 | hover (M3) |
| `mug` | Coffee mug | 1,500 | 512 | click → fact toast (shipped) |
| `lamp` | Desk lamp | 2,500 | 512 | click → light toggle (shipped) |
| `chair` | Chair | 5,000 | 1024 | — |
| `plant` | Plant | 4,000 | 1024 | subtle sway (M3) |
| `bookshelf` | Wall shelves + books | 6,000 | 2048 | click → résumé (shipped) |
| `window` | Window | 1,200 | 1024 | rain / lightning behind (M2) |
| `notebook` | Notebook | 1,000 | 512 | click → résumé / projects (shipped) |
| `phone` | Phone | 1,000 | 512 | click → contact (shipped) |
| `helmet` | Bike helmet | 3,000 | 1024 | click → gallery (shipped) |
| `deskCalendar` | Desk calendar | 600 | 512 | click → career timeline (shipped) |
| `bikeKeys` | Motorcycle keys | 800 | 512 | — |

## Photos

- **Gallery:** `public/gallery/*.jpg` — real photos in both albums: Rides
  (`ride-01…12.jpg`) and Gym (`gym-01…05.jpg`). An entry without `src` falls
  back to generated placeholder art.
- **Favicon / OG image:** still missing (`public/` has no images yet).

## Non-mesh assets (future)

- **Environment map:** night HDRI for image-based reflections (M2). Until then
  lighting is fully analytic (no network dependency).
- **Rain / particle textures:** soft sprite for dust and rain streaks (M2).
- **Screen content:** the monitor screen is a named mesh (`monitor-screen`)
  reserved for the boot output (M2) and the OS-entry render surface (M4).
