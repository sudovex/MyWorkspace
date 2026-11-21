import { describe, expect, it } from 'vitest';
import { GALLERY_ALBUMS } from '@/types/experience';
import { ALBUMS, albumItems, gallery } from './gallery';

describe('gallery content', () => {
  it('gives every entry a unique id and a known album', () => {
    const ids = gallery.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of gallery) expect(GALLERY_ALBUMS).toContain(item.album);
  });

  it('has something in every album, and a label for each', () => {
    for (const album of GALLERY_ALBUMS) {
      expect(albumItems(album).length).toBeGreaterThan(0);
      expect(ALBUMS[album].label.length).toBeGreaterThan(0);
    }
  });

  it('points photos at /public', () => {
    for (const item of gallery) {
      if (item.src !== null) expect(item.src.startsWith('/')).toBe(true);
    }
  });
});
