# aawhan0.github.io

Personal portfolio of [Aawhan Vyas](https://github.com/aawhan0), live at **[aawhan0.me](https://aawhan0.me/)**.

One plain page: paper background, serif voice, mono structure. Every line links to its
proof — no decoration that doesn't inform. Plain HTML/CSS/JS, no build step. Deployed
automatically by GitHub Pages from `main`.

## Page

1. **Top** — identity line, open-to-full-time status, github/linkedin/email
2. **Intro** — one sentence + live GitHub stats line
3. **Selected work** — dense rows (projects, experience, OSS PRs). Click a row to expand its receipts; ↗ opens the repo
4. **On LinkedIn** — posts as one-liners with dates auto-decoded from post IDs
5. **About** — a short humane paragraph
6. **Ask (floating, bottom-right)** — grounded chat over the resume: term-weighted retrieval, answers are literal cited text, refuses what it can't cite. No LLM, no keys

## Structure

```
index.html             markup
assets/css/style.css   paper/ink design system
assets/js/main.js      row toggles, linkedin list, grounded chat
assets/js/data.js      ★ content data — edit this one
assets/favicon.svg     a0 monogram
404.html               styled not-found page
CNAME                  → aawhan0.me  (DO NOT DELETE)
```

## Editing (all in `assets/js/data.js`)

- **New LinkedIn post** → append `{ id, title, blurb, tags }` to `SIGNALS`; `id` is the
  number in the post URL. Date renders automatically.
- **Resume changes** → update the matching chunk in `RESUME_CHUNKS` verbatim; the chat
  picks it up automatically.
- **Email / LinkedIn** → constants at the bottom of the file.

## Local preview

```
python -m http.server 8000
```

Then open http://localhost:8000.
