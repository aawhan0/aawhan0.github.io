# aawhan0.github.io

Personal portfolio of [Aawhan Vyas](https://github.com/aawhan0), live at **[aawhan0.me](https://aawhan0.me/)**.

The theme is the **evidence layer**: every claim on the page links to its proof — repo, benchmark, PR or literal resume text. Plain HTML/CSS/JS, no framework, no build step. Deployed automatically by GitHub Pages from `main`.

## Sections

1. **Hero** — thesis + live GitHub stats + the evidence graph (clickable background: nodes are real repos/PRs)
2. **Featured** — ModelDock with proof chips (hover/click for receipts) and the gated-lifecycle pipeline
3. **Selected work** — project cards with hoverable metric proofs
4. **Open-source receipts** — merged PRs with verified test counts
5. **Ask my resume** — grounded retrieval demo, runs fully client-side: term-weighted search over the resume PDF, answers are literal cited text (no LLM, no keys), plus the grounded-vs-confident exhibit from TraceBack's benchmark
6. **Signals** — LinkedIn posts feed: two live official embeds + linked cards, dates auto-decoded from post IDs
7. **About / Contact** — terminal bio (mirrors the LinkedIn headline) + email/LinkedIn/GitHub/resume

## Structure

```
index.html             markup
assets/css/style.css   design system (dark editorial-terminal, chartreuse accent)
assets/js/main.js      evidence graph, popovers, resume demo, signals renderer
assets/js/data.js      ★ content data — edit this one
assets/favicon.svg     a0 monogram
404.html               styled not-found page
CNAME                  → aawhan0.me  (DO NOT DELETE)
```

## Editing (all in `assets/js/data.js`)

- **New LinkedIn post** → append to `SIGNALS`: `{ id, title, blurb, tags }` where `id` is the number in the post URL. Set `embed: true` on the two newest to render live embeds; all others become cards.
- **Resume changes** → update the matching chunk in `RESUME_CHUNKS`; the demo picks it up automatically (it's the literal source text, so keep it verbatim).
- **Email / LinkedIn** → constants at the bottom of the file.
- **Stats, projects, colors** → `index.html` / top of `style.css`.

## Local preview

```
python -m http.server 8000
```

Then open http://localhost:8000.
