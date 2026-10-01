/* aawhan0.me — rows, linkedin one-liners, grounded chat */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ── work rows: click to expand receipts ─────────────────── */
  document.querySelectorAll(".row").forEach((row) => {
    row.querySelector(".row-head").addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      row.classList.toggle("open");
    });
  });

  /* ── linkedin one-liners (dates decoded from post ids) ───── */
  const sigDateLabel = (id) => {
    const d = new Date(Number((BigInt(id) >> 22n).toString()));
    return d.toLocaleDateString("en-US", { month: "short" }).toLowerCase() +
      " " + String(d.getFullYear()).slice(2);
  };
  const list = document.getElementById("siglist");
  if (list) {
    list.innerHTML = SIGNALS.map((s) => `
      <li>
        <span class="s-date">${sigDateLabel(s.id)}</span>
        <a href="https://www.linkedin.com/feed/update/urn:li:activity:${s.id}"
           target="_blank" rel="noopener">${s.title}</a>
      </li>`).join("");
  }

  /* ── live github stats (silent fallback to baked-in) ─────── */
  fetch("https://api.github.com/users/aawhan0")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((u) => {
      const a = document.getElementById("stat-repos");
      const b = document.getElementById("stat-stars");
      if (a) a.textContent = u.public_repos;
      if (b) {
        return fetch("https://api.github.com/users/aawhan0/repos?per_page=100")
          .then((r) => r.json())
          .then((repos) => { b.textContent = repos.reduce((s, r) => s + r.stargazers_count, 0); });
      }
    })
    .catch(() => {});

  /* ── grounded chat: retrieval over the resume ────────────── */
  const STOP = new Set("the a an of to and or in for with on is are was were be been being i my me you your it its this that these those what which who whom how why when where do does did done have has had having not no yes if then than as at by from into about over under again more most some such only own same so too very can will just should now using use used also per while".split(" "));

  const tokenize = (s) =>
    (s.toLowerCase().match(/[a-z0-9+@#.]+/g) || [])
      .filter((t) => t.length > 1 && !STOP.has(t))
      .map((t) => (t.length > 4 ? t.replace(/(ing|ed|es|s)$/, "") : t));

  const N = RESUME_CHUNKS.length;
  const df = new Map();
  const chunkTokens = RESUME_CHUNKS.map((c) => {
    const t = new Map();
    for (const tok of tokenize(c.section + " " + c.title + " " + c.text)) {
      t.set(tok, (t.get(tok) || 0) + 1);
      df.set(tok, (df.get(tok) || 0) + 1);
    }
    return t;
  });

  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const markTerms = (text, terms) => {
    let out = esc(text);
    for (const term of [...terms].sort((a, b) => b.length - a.length)) {
      const re = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\@#]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    }
    return out;
  };

  const retrieve = (qRaw) => {
    const terms = [...new Set(tokenize(qRaw))];
    const scored = RESUME_CHUNKS.map((c, i) => {
      let s = 0;
      for (const t of terms) {
        const tf = chunkTokens[i].get(t);
        if (tf) s += Math.min(tf, 3) * Math.log(1 + N / (df.get(t) || 1));
      }
      return { c, s };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);

    return { terms, top: scored.slice(0, scored.length > 1 && scored[1].s >= scored[0].s * 0.45 ? 2 : 1) };
  };

  /* ── panel wiring ────────────────────────────────────────── */
  const fab = document.getElementById("fab");
  const panel = document.getElementById("panel");
  const log = document.getElementById("panel-log");
  const input = document.getElementById("chat-input");
  const send = document.getElementById("chat-send");
  let opened = false;

  const add = (html, cls) => {
    const el = document.createElement("div");
    el.className = cls;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const ask = (qRaw) => {
    const q = qRaw.trim();
    if (!q) return;
    add(esc(q), "msg-user");
    const { terms, top } = retrieve(q);
    if (!top.length) {
      add(`<div class="a-refuse">// nothing grounded in the resume for that. i refuse to
        answer what i can't cite — try: stack, projects, benchmarks, education.</div>`, "msg-bot");
      return;
    }
    for (const { c } of top) {
      add(`<p class="a-text">${markTerms(c.text, terms)}</p>
           <p class="a-cite">resume p.1 · § ${esc(c.section)} — ${esc(c.title)}</p>`, "msg-bot");
    }
  };

  const toggle = (force) => {
    const open = force !== undefined ? force : !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", open);
    fab.textContent = open ? "✕" : "ask";
    if (open && !opened) {
      opened = true;
      add(`hey — i'm the grounded side of this site. ask me anything about
        aawhan's resume; answers are <b>literal cited text</b> from the pdf,
        and i refuse to make things up. ✳`, "a-note");
      add(`try: <b>rag projects?</b> · <b>backend stack</b> · <b>benchmarks</b> ·
        <b>open source</b> · <b>education</b>`, "a-note");
    }
    if (open) input.focus();
  };

  fab.addEventListener("click", () => toggle());
  document.getElementById("panel-x").addEventListener("click", () => toggle(false));
  send.addEventListener("click", () => { ask(input.value); input.value = ""; });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { ask(input.value); input.value = ""; }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) toggle(false);
  });

  // first-run nudge: pulse the fab label once the reader reaches the work list
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        fab.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }],
          { duration: 600, iterations: 2, easing: "ease-in-out" }
        );
      }
    }, { threshold: 0.3 });
    io.observe(document.getElementById("work"));
  }
})();
