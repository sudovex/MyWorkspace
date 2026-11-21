import { afterEach, describe, expect, it, vi } from 'vitest';
import { asset } from './asset';

describe('asset (pure)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('leaves paths alone when the site is at the root', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');
    expect(asset('/gallery/ride-01.jpg')).toBe('/gallery/ride-01.jpg');
  });

  it('prefixes the base path on a sub-path deploy', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/MyWorkspace');
    expect(asset('/gallery/ride-01.jpg')).toBe('/MyWorkspace/gallery/ride-01.jpg');
    expect(asset('gallery/ride-01.jpg')).toBe('/MyWorkspace/gallery/ride-01.jpg');
  });

  it('never touches absolute URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/MyWorkspace');
    expect(asset('https://shubhammali.in/resume.pdf')).toBe(
      'https://shubhammali.in/resume.pdf',
    );
  });
});
