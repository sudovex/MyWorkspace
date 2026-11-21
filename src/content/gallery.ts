/**
 * The gallery — the part of the room that is about the person, not the
 * engineer. Two albums: **rides** (opened by the helmet) and **gym** (opened
 * by the shaker bottle).
 *
 * HOW TO ADD YOUR OWN PHOTOS
 *   1. Drop image files into `/public/gallery/` (e.g. `/public/gallery/gym-01.jpg`).
 *      Phone photos work best exported at 900×1600 (9:16), JPEG, ~200 KB.
 *   2. Set `src` on an entry below to `'/gallery/gym-01.jpg'`, its `album`
 *      to the album it belongs in, and `aspect` to width ÷ height (`9 / 16`
 *      for a portrait phone photo). Add or remove entries freely.
 *
 * The ride photos have their number plates blurred before export.
 * Entries with `src: null` render a generated placeholder scene instead, so
 * the gallery always looks finished while real photos are pending.
 */
import { type GalleryAlbum } from '@/types/experience';
export type PlaceholderScene =
  | 'mountain-road'
  | 'coast'
  | 'city-night'
  | 'forest'
  | 'dunes'
  | 'workspace'
  | 'sunrise'
  | 'monsoon'
  | 'gym-barbell'
  | 'gym-dumbbells'
  | 'gym-kettlebell';

/** What each album is called, and the line under the gallery's title. */
export const ALBUMS: Readonly<Record<GalleryAlbum, { label: string; intro: string }>> = {
  rides: {
    label: 'Rides',
    intro:
      'Weekdays are for token flows. Weekends are for the helmet — ghat roads, ' +
      'early starts, and wherever the tarmac goes next.',
  },
  gym: {
    label: 'Gym',
    intro:
      'The other daily commit. Same rule as code: show up, do the reps, ' +
      'leave it a little better than yesterday.',
  },
};

export interface GalleryItem {
  id: string;
  album: GalleryAlbum;
  /** Path under `/public`, or `null` to use the generated placeholder. */
  src: string | null;
  /**
   * Width ÷ height of the photo (e.g. `9 / 16` for a phone story). Lets the
   * gallery lay portrait photos out as portraits instead of cropping them
   * into landscape tiles. Leave out for placeholders (drawn 4:3).
   */
  aspect?: number;
  /**
   * Which part of the photo to keep when a frame crops it, as CSS
   * `object-position` (e.g. `'center 20%'` keeps a face near the top).
   * Default: the centre.
   */
  focus?: string;
  placeholder: PlaceholderScene;
  title: string;
  caption: string;
  place: string;
  date: string;
}

export const gallery: readonly GalleryItem[] = [
  {
    id: 'ride-01',
    album: 'rides',
    src: '/gallery/ride-01.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'Top of the ghat',
    caption: 'Cloud cover, wet tarmac, and the whole valley below.',
    place: 'Up in the hills',
    date: '',
  },
  {
    id: 'ride-02',
    album: 'rides',
    src: '/gallery/ride-02.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'Waterfall season',
    caption: 'In the monsoon every cliff face turns into a waterfall.',
    place: 'Ghat road, monsoon',
    date: '',
  },
  {
    id: 'ride-03',
    album: 'rides',
    src: '/gallery/ride-03.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'After the rain',
    caption: 'Wet road, street lights running all the way to the horizon.',
    place: 'City, after midnight',
    date: '',
  },
  {
    id: 'ride-04',
    album: 'rides',
    src: '/gallery/ride-04.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'Under the sky',
    caption: 'Helmet on, sun breaking through. 31°C and climbing.',
    place: 'Somewhere on the road',
    date: '',
  },
  {
    id: 'ride-05',
    album: 'rides',
    src: '/gallery/ride-05.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'The long way round',
    caption: 'Puddles, a fence line and hills on both sides.',
    place: 'Village road',
    date: '',
  },
  {
    id: 'ride-06',
    album: 'rides',
    src: '/gallery/ride-06.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'Riding in pairs',
    caption: 'Fog rolling in, two bikes and an open meadow.',
    place: 'Misty plateau',
    date: '',
  },
  {
    id: 'ride-07',
    album: 'rides',
    src: '/gallery/ride-07.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'Parked in the green',
    caption: 'Lights on, monsoon in full swing.',
    place: 'Off the main road',
    date: '',
  },
  {
    id: 'ride-08',
    album: 'rides',
    src: '/gallery/ride-08.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'Night shift',
    caption: 'An empty highway and one glowing tail-light.',
    place: 'NH 4',
    date: '',
  },
  {
    id: 'ride-09',
    album: 'rides',
    src: '/gallery/ride-09.jpg',
    aspect: 9 / 16,
    focus: 'center 62%',
    placeholder: 'mountain-road',
    title: 'Wildflowers',
    caption: 'Orange cosmos along the roadside.',
    place: 'Roadside stop',
    date: '',
  },
  {
    id: 'gym-01',
    album: 'gym',
    src: '/gallery/gym-01.jpg',
    aspect: 3 / 4,
    focus: '55% 32%',
    placeholder: 'gym-barbell',
    title: 'Between sets',
    caption: 'Pump in, mood up.',
    place: 'Gym floor',
    date: '',
  },
  {
    id: 'gym-02',
    album: 'gym',
    src: '/gallery/gym-02.jpg',
    aspect: 3 / 4,
    focus: 'center 18%',
    placeholder: 'gym-barbell',
    title: 'Back day',
    caption: 'Gloves on, mirror check.',
    place: 'Gym floor',
    date: '',
  },
  {
    id: 'gym-03',
    album: 'gym',
    src: '/gallery/gym-03.jpg',
    aspect: 9 / 16,
    focus: 'center 55%',
    placeholder: 'gym-barbell',
    title: 'Against the skyline',
    caption: 'Window light, the city behind, one last flex.',
    place: 'By the window',
    date: '',
  },
  {
    id: 'gym-04',
    album: 'gym',
    src: '/gallery/gym-04.jpg',
    aspect: 3 / 4,
    focus: 'center 12%',
    placeholder: 'gym-barbell',
    title: 'Morning light',
    caption: 'Sun through the glass, progress in the mirror.',
    place: 'Mirror check',
    date: '',
  },
  {
    id: 'gym-05',
    album: 'gym',
    src: '/gallery/gym-05.jpg',
    aspect: 3 / 4,
    focus: '40% 50%',
    placeholder: 'gym-barbell',
    title: 'Forearm day',
    caption: 'Post-workout, still pumped.',
    place: 'On the way out',
    date: '',
  },
];

/** The entries of one album, in order. */
export function albumItems(album: GalleryAlbum): GalleryItem[] {
  return gallery.filter((item) => item.album === album);
}
