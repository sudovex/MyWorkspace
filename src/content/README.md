# content/ — typed portfolio content

Everything the visitor reads lives here as plain typed data — local, so it can
be server-rendered for SEO/accessibility and edited without touching UI code.

| File         | What it feeds                                                       |
| ------------ | ------------------------------------------------------------------- |
| `profile.ts` | Name, role, summary, links, headline stats (HUD, résumé, terminal)  |
| `resume.ts`  | Experience, projects, skills, education, certifications             |
| `gallery.ts` | The helmet's gallery — set `src` to a file under `/public/gallery/` |
| `facts.ts`   | What the coffee mug says                                            |

Supabase is used only for submissions, never for content.
