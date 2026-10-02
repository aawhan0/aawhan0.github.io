# aawhan0.github.io

Personal portfolio of [Aawhan Vyas](https://github.com/aawhan0), live at **[aawhan0.me](https://aawhan0.me/)**.

Dark console with a cinematic landing gate: **"On Stage"** (ascii wave → `/brief/`) and
**"Behind the Scenes"** (particle accretion disk → `story.html`). Plain HTML/CSS/JS, no build
step. Deployed automatically by GitHub Pages from `main`.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing gate — two halves, pick a door. Deep links like `/#work` redirect to `/brief/#work` |
| `/brief/` | **On Stage** — hero with pixel-art portrait, pillars, about, experience, expandable evidence rows, stack matrix, LinkedIn one-liners, contact |
| `story.html` | **Behind the Scenes** — TV intro (sound choice), scroll-driven broadcast chapters, CRT scene |
| `music.html` | **Off the Clock** — the creative archive. Scroll-driven Wrapped-style chapters (2024–2026 listening figures, a wireframe globe, unreleased waveforms, visual edits, taste), plus "trees — kurtains" on loop via a hidden SoundCloud widget |

## Structure

```
index.html             landing gate (two halves)
brief/index.html       the brief — serves at /brief/ (clean URL)
story.html             the evidence tour
music.html             "off the clock" — the creative archive
assets/css/style.css   dark console design system (light theme via html.light)
assets/css/archive.css the archive's own world — palette, chapters, motion (music.html only)
assets/js/main.js      gate scenes, theme, portrait reveal, rows, signals
assets/js/story.js     tv intro, crt hum, broadcast scenes
assets/js/music.js     archive: intro, hidden player, mute pill, globe, counters, waves
assets/js/data.js      ★ content data (SIGNALS) — edit this one
assets/fonts/          Geist Pixel Square (vercel, OFL — see OFL-GeistPixel.txt)
assets/img/portrait_PIXEL.png  pixel-art portrait (dark mode)
assets/img/portrait_OG.png    real photo (hover reveal + light mode)
assets/favicon.svg     a0 monogram
404.html               styled not-found page
CNAME                  → aawhan0.me  (DO NOT DELETE)
```

## Notes

- Background music is the SoundCloud widget API in a hidden iframe (`#sc-widget`) — full
  track, not a 30s preview. Browsers block audible autoplay until a gesture, so playback
  starts from an explicit click ("press play" / "continue with sound" / the corner pill).
- The contact headline ("LET'S BUILD.") is plain text in Geist Pixel — theme-aware via
  CSS variables.
- `assets/js/main.js` computes asset URLs from `document.body.dataset.root` so the same
  file serves both `/` and `/brief/` (which sets `data-root="../"`).

## Editing

- **New LinkedIn post** → append `{ id, title }` to `SIGNALS` in `assets/js/data.js`;
  `id` is the number in the post URL. Dates render automatically.
- **Email / LinkedIn / resume** → links live inline in `brief/index.html`.

## Local preview

```
python -m http.server 8000
```

Then open http://localhost:8000 — `/brief` redirects to `/brief/` the same way
GitHub Pages serves it.
