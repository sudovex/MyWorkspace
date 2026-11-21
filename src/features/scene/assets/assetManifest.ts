/**
 * The single registry of every physical object in the room.
 *
 * Each object renders procedural (code-built) geometry today. Dropping in a
 * production model is a data-only change: set `gltfPath` here and the
 * `<AssetSlot>` renders the GLTF instead of the placeholder — no component or
 * layout logic changes. Budgets/resolutions are mirrored in `TODO_ASSETS.md`.
 */
export const ASSET_IDS = [
  'desk',
  'monitor',
  'keyboard',
  'mouse',
  'mug',
  'lamp',
  'chair',
  'plant',
  'bookshelf',
  'window',
  'notebook',
  'phone',
  'helmet',
  'bikeKeys',
  'deskCalendar',
] as const;

export type AssetId = (typeof ASSET_IDS)[number];

export interface AssetSpec {
  id: AssetId;
  label: string;
  /** Production model path under /public/models. `null` → use placeholder. */
  gltfPath: string | null;
  /** Target triangle budget for the production model. */
  polyBudget: number;
  /** Recommended base-colour texture resolution (px, square). */
  textureRes: 512 | 1024 | 2048;
}

export const ASSET_MANIFEST: Readonly<Record<AssetId, AssetSpec>> = {
  desk: { id: 'desk', label: 'Desk', gltfPath: null, polyBudget: 3000, textureRes: 2048 },
  monitor: {
    id: 'monitor',
    label: 'Monitor',
    gltfPath: null,
    polyBudget: 4000,
    textureRes: 1024,
  },
  keyboard: {
    id: 'keyboard',
    label: 'Mechanical keyboard',
    gltfPath: null,
    polyBudget: 8000,
    textureRes: 1024,
  },
  mouse: {
    id: 'mouse',
    label: 'Mouse',
    gltfPath: null,
    polyBudget: 2000,
    textureRes: 512,
  },
  mug: {
    id: 'mug',
    label: 'Coffee mug',
    gltfPath: null,
    polyBudget: 1500,
    textureRes: 512,
  },
  lamp: {
    id: 'lamp',
    label: 'Desk lamp',
    gltfPath: null,
    polyBudget: 2500,
    textureRes: 512,
  },
  chair: {
    id: 'chair',
    label: 'Chair',
    gltfPath: null,
    polyBudget: 5000,
    textureRes: 1024,
  },
  plant: {
    id: 'plant',
    label: 'Plant',
    gltfPath: null,
    polyBudget: 4000,
    textureRes: 1024,
  },
  bookshelf: {
    id: 'bookshelf',
    label: 'Bookshelf',
    gltfPath: null,
    polyBudget: 6000,
    textureRes: 2048,
  },
  window: {
    id: 'window',
    label: 'Window',
    gltfPath: null,
    polyBudget: 1200,
    textureRes: 1024,
  },
  notebook: {
    id: 'notebook',
    label: 'Notebook',
    gltfPath: null,
    polyBudget: 1000,
    textureRes: 512,
  },
  phone: {
    id: 'phone',
    label: 'Phone',
    gltfPath: null,
    polyBudget: 1000,
    textureRes: 512,
  },
  helmet: {
    id: 'helmet',
    label: 'Bike helmet',
    gltfPath: null,
    polyBudget: 3000,
    textureRes: 1024,
  },
  bikeKeys: {
    id: 'bikeKeys',
    label: 'Motorcycle keys',
    gltfPath: null,
    polyBudget: 800,
    textureRes: 512,
  },
  deskCalendar: {
    id: 'deskCalendar',
    label: 'Desk calendar',
    gltfPath: null,
    polyBudget: 600,
    textureRes: 512,
  },
} as const;
