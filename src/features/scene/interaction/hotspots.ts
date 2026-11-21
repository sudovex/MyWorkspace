/**
 * The room's clickable objects: what each one is called, what it promises on
 * hover, where its "this is clickable" beacon floats, and what clicking it
 * does. Objects themselves stay dumb — they call `activateHotspot(id)` and own
 * only their physical hover response.
 *
 * Every action goes through `experienceStore`; nothing here reaches into the
 * DOM runtimes directly (the golden rule of isolation).
 */
import { useExperienceStore } from '@/stores/experienceStore';
import { type HotspotId } from '@/types/experience';
import { mugFacts } from '@/content/facts';
import { PLACEMENT, SCREEN, type Vec3 } from '../room/layout';

export interface HotspotSpec {
  label: string;
  hint: string;
  /** World position of the beacon ring. */
  beacon: Vec3;
}

const [shelfX, shelfY, shelfZ] = PLACEMENT.shelf;

export const HOTSPOTS: Readonly<Record<HotspotId, HotspotSpec>> = {
  monitor: {
    label: 'Monitor',
    hint: 'Open the terminal',
    beacon: [SCREEN.center[0] + 0.3, SCREEN.center[1] + 0.3, SCREEN.center[2] + 0.04],
  },
  calendar: {
    label: 'Calendar',
    hint: 'Career timeline',
    beacon: [PLACEMENT.calendar[0], 0.24, PLACEMENT.calendar[2] + 0.02],
  },
  bookshelf: {
    label: 'Bookshelf',
    hint: 'Read the résumé',
    beacon: [shelfX - 0.2, shelfY + 0.34, shelfZ + 0.2],
  },
  helmet: {
    label: 'Helmet',
    hint: 'Open the gallery',
    beacon: [PLACEMENT.helmet[0], 0.36, PLACEMENT.helmet[2] + 0.05],
  },
  notebook: {
    label: 'Notebook',
    hint: 'Projects',
    beacon: [PLACEMENT.notebook[0], 0.09, PLACEMENT.notebook[2]],
  },
  phone: {
    label: 'Phone',
    hint: 'Pick it up — socials & contact',
    beacon: [PLACEMENT.phone[0], 0.08, PLACEMENT.phone[2]],
  },
  lamp: {
    label: 'Lamp',
    hint: 'Click to switch it on / off',
    beacon: [PLACEMENT.lamp[0] - 0.25, 0.56, PLACEMENT.lamp[2] + 0.09],
  },
  mug: {
    label: 'Coffee',
    hint: 'Take a sip',
    beacon: [PLACEMENT.mug[0], 0.2, PLACEMENT.mug[2]],
  },
  certificate: {
    label: 'Certificates',
    hint: 'See all of them',
    beacon: [
      PLACEMENT.certificate[0] + 0.19,
      PLACEMENT.certificate[1] + 0.15,
      PLACEMENT.certificate[2] + 0.04,
    ],
  },
  headphones: {
    label: 'Headphones',
    hint: 'My Spotify, on the phone',
    beacon: [PLACEMENT.headphones[0], 0.27, PLACEMENT.headphones[2]],
  },
  shaker: {
    label: 'Shaker',
    hint: 'Gym photos',
    beacon: [PLACEMENT.shaker[0], 0.25, PLACEMENT.shaker[2]],
  },
  soundbar: {
    label: 'Soundbar',
    hint: 'Click to mute / unmute the room',
    beacon: [PLACEMENT.soundbar[0], 0.1, PLACEMENT.soundbar[2]],
  },
};

/**
 * Hotspots that show a beacon. The mug stays an undiscovered extra, and the
 * soundbar announces itself with its own lights.
 */
export const BEACON_HOTSPOTS: readonly HotspotId[] = [
  'monitor',
  'calendar',
  'bookshelf',
  'helmet',
  'notebook',
  'phone',
  'lamp',
  'certificate',
  'headphones',
  'shaker',
];

/**
 * What the first-visit guide points at: everything with a beacon, plus the
 * mug — it has no beacon in the room (it stays a small surprise there), but
 * the guide promises that everything is clickable, so it gets an arrow.
 */
export const GUIDE_HOTSPOTS: readonly HotspotId[] = [...BEACON_HOTSPOTS, 'mug'];

/**
 * Where each of those arrows lands: the beacon — except the monitor, which is
 * pointed at in the middle of its screen, and the mug, at its rim.
 */
export function guideTarget(id: HotspotId): Vec3 {
  if (id === 'monitor') return SCREEN.center;
  if (id === 'mug') return [PLACEMENT.mug[0], 0.1, PLACEMENT.mug[2]];
  return HOTSPOTS[id].beacon;
}

let factIndex = 0;

export function activateHotspot(id: HotspotId): void {
  const store = useExperienceStore.getState();
  switch (id) {
    case 'monitor':
      store.enterMonitor();
      return;
    case 'calendar':
      store.openPanel('resume', { section: 'experience', origin: 'calendar' });
      return;
    case 'bookshelf':
      store.openPanel('resume', { section: 'summary', origin: 'bookshelf' });
      return;
    case 'notebook':
      store.openPanel('resume', { section: 'projects', origin: 'notebook' });
      return;
    case 'helmet':
      store.openPanel('gallery', { album: 'rides', origin: 'helmet' });
      return;
    case 'shaker':
      store.openPanel('gallery', { album: 'gym', origin: 'shaker' });
      return;
    case 'phone':
      store.openPanel('contact', { origin: 'phone' });
      return;
    case 'lamp':
      store.toggleLamp();
      return;
    case 'certificate':
      store.openPanel('certificates', { origin: 'certificate' });
      return;
    case 'headphones':
      store.openPanel('contact', { view: 'spotify', origin: 'headphones' });
      return;
    case 'soundbar':
      store.toggleSound();
      return;
    case 'mug': {
      const fact = mugFacts[factIndex % mugFacts.length];
      factIndex += 1;
      if (fact) store.showToast(fact);
      return;
    }
  }
}
