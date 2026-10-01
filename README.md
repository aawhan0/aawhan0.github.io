# aawhan0.github.io

Personal portfolio of [Aawhan](https://github.com/aawhan0), live at **[aawhan0.me](https://aawhan0.me/)**.

Built with plain HTML/CSS/JS — no framework, no build step. Deployed automatically by GitHub Pages from `main`.

## Structure

```
index.html            the whole site
assets/css/style.css  design system (dark editorial-terminal, chartreuse accent)
assets/js/main.js     constellation canvas, scroll reveals, card tilt, live GitHub stats
assets/favicon.svg    a0 monogram
404.html              styled not-found page
CNAME                 → aawhan0.me  (DO NOT DELETE)
```

## Editing

- **Projects** — cards live in the `#work` grid in `index.html`; each links to a repo.
- **Featured project** — the `#featured` section (currently ModelDock).
- **Stats** — hero numbers are baked in as fallbacks and refresh live from the public GitHub API client-side.
- **Palette/fonts** — CSS custom properties at the top of `style.css`.

## Local preview

```
python -m http.server 8000
# or: npx serve
```

Then open http://localhost:8000.
