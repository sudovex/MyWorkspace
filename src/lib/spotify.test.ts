import { describe, expect, it } from 'vitest';
import { spotifyEmbed } from './spotify';

describe('spotifyEmbed', () => {
  it('turns a playlist share link into its player URL', () => {
    expect(
      spotifyEmbed('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc123'),
    ).toEqual({
      kind: 'playlist',
      id: '37i9dQZF1DXcBWIGoYBM5M',
      src: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0',
    });
  });

  it('accepts locale-prefixed and already-embedded links, and other kinds', () => {
    expect(
      spotifyEmbed('https://open.spotify.com/intl-en/album/4aawyAB9vmqN3uQ7FjRGTy')?.kind,
    ).toBe('album');
    expect(
      spotifyEmbed('https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl')?.id,
    ).toBe('11dFghVXANMlKmJXsNCbNl');
  });

  it('refuses what Spotify will not embed — user profiles above all', () => {
    expect(
      spotifyEmbed('https://open.spotify.com/user/31ath5gizh7mab46rhs533uxuv5y'),
    ).toBeNull();
    expect(
      spotifyEmbed('https://example.com/playlist/37i9dQZF1DXcBWIGoYBM5M'),
    ).toBeNull();
    expect(spotifyEmbed('https://open.spotify.com/playlist/')).toBeNull();
    expect(spotifyEmbed('not a url')).toBeNull();
    expect(spotifyEmbed('https://open.spotify.com/playlist/abc"onload=x')).toBeNull();
  });
});
