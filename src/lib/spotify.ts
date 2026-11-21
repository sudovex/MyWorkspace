/**
 * Spotify only lets certain things be embedded in another site: playlists,
 * albums, artists, tracks, shows and episodes — not user profiles. This turns
 * an ordinary share link for one of those into the URL of its embeddable
 * player, or returns `null` for anything that cannot be embedded.
 */
const EMBEDDABLE = ['playlist', 'album', 'artist', 'track', 'show', 'episode'] as const;

export type SpotifyEmbedKind = (typeof EMBEDDABLE)[number];

export interface SpotifyEmbed {
  kind: SpotifyEmbedKind;
  id: string;
  /** The player URL to use as an iframe `src`. */
  src: string;
}

export function spotifyEmbed(link: string): SpotifyEmbed | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.hostname !== 'open.spotify.com') return null;
  // Share links may carry a locale prefix (/intl-en/…) or already be /embed/….
  const parts = url.pathname
    .split('/')
    .filter((part) => part && part !== 'embed' && !part.startsWith('intl-'));
  const [kind, id] = parts;
  if (!kind || !id) return null;
  if (!(EMBEDDABLE as readonly string[]).includes(kind)) return null;
  if (!/^[A-Za-z0-9]+$/.test(id)) return null;
  return {
    kind: kind as SpotifyEmbedKind,
    id,
    src: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
  };
}
