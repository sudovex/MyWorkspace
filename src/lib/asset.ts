/**
 * A path to a file in `public/`, prefixed with the site's base path.
 *
 * Next adds the base path to its own links and scripts, but not to plain
 * strings handed to `<img>` / `next/image` — so a photo at
 * `/gallery/ride-01.jpg` would 404 on `https://sudovex.github.io/MyWorkspace/`
 * without this. Absolute URLs pass through untouched.
 */
export function asset(path: string): string {
  if (/^[a-z]+:\/\//i.test(path) || path.startsWith('data:')) return path;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
