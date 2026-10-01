/* aawhan0.me — landing gate (ascii wave + evidence disk), dot headline,
   evidence rows, linkedin one-liners, grounded chat */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ── landing gate scenes ─────────────────────────────────── */
  const gate = document.getElementById("gate");
  const sceneRafs = [];

  const makeScene = (canvas, draw) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H;
    const size = () => {
      W = canvas.width = canvas.offsetWidth * dpr;
      H = canvas.height = canvas.offsetHeight * dpr;
    };
    size();
    window.addEventListener("resize", size);
    if (reduced) { draw(ctx, W, H, 0); return; }
    const t0 = performance.now();
    const loop = (now) => {
      draw(ctx, W, H, (now - t0) / 1000);
      sceneRafs.push(requestAnimationFrame(loop));
    };
    sceneRafs.push(requestAnimationFrame(loop));
  };

  const stopScenes = () => { sceneRafs.forEach((id) => cancelAnimationFrame(id)); };

  // left: ascii interference wave
  const CHARS = " .·:;=+*#%@";
  makeScene(document.getElementById("ascii-wave"), (ctx, W, H, t) => {
    ctx.fillStyle = "#0b0b0e";
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
    const step = 9 * dpr, rowH = 13 * dpr;
    for (let y = rowH; y < H; y += rowH) {
      for (let x = step; x < W; x += step) {
        // one coherent ridge wandering across the panel
        const ridge = H * 0.5 + Math.sin(x * 0.004 / dpr + t * 0.9) * H * 0.22
          + Math.sin(x * 0.011 / dpr - t * 0.5) * H * 0.08;
        const d = Math.abs(y - ridge);
        const band = Math.exp(-(d * d) / (2 * Math.pow(H * 0.11, 2)));
        const shimmer = 0.5 + 0.5 * Math.sin(x * 0.02 / dpr + y * 0.03 / dpr + t * 2);
        const n = band * (0.55 + 0.45 * shimmer);
        if (n < 0.1) continue;
        const ch = CHARS[Math.floor(n * (CHARS.length - 1))];
        ctx.fillStyle = `rgba(125,145,190,${0.1 + n * 0.7})`;
        ctx.fillText(ch, x, y);
      }
    }
  });

  // right: evidence accretion disk
  makeScene(document.getElementById("disk"), (() => {
    let stars = null, parts = null, seedW = 0, seedH = 0;
    const seed = (W, H) => {
      stars = Array.from({ length: 130 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        a: Math.random() * 0.5 + 0.1, r: Math.random() * 1.1 + 0.3,
      }));
      const R = Math.min(W, H) * 0.46, inner = R * 0.28;
      parts = Array.from({ length: 520 }, () => {
        const r = inner * 0.9 + Math.pow(Math.random(), 0.7) * (R - inner);
        return { r, a: Math.random() * Math.PI * 2, w: 1.6 / Math.pow(r / (inner * 2), 1.4) };
      });
      seedW = W; seedH = H;
    };
    return (ctx, W, H, t) => {
      if (!parts || W !== seedW || H !== seedH) seed(W, H);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.46, inner = R * 0.28;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(11,11,14,0.4)";
      ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        ctx.fillStyle = `rgba(200,205,225,${s.a})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalCompositeOperation = "lighter";
      const sq = 0.42;
      for (const p of parts) {
        p.a += p.w * 0.016;
        const x = cx + Math.cos(p.a) * p.r;
        const y = cy + Math.sin(p.a) * p.r * sq;
        const k = (p.r - inner) / (R - inner); // 0 inner → 1 outer
        const warm = 1 - k;
        ctx.fillStyle = `rgba(${255},${Math.floor(178 + warm * 66)},${Math.floor(107 + warm * 123)},${0.12 + (1 - k) * 0.75})`;
        ctx.fillRect(x, y, 1.6 * dpr, 1.6 * dpr);
      }
      // event horizon
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.arc(cx, cy, inner * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = "#050507";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, inner * 0.66, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,225,190,0.55)";
      ctx.lineWidth = 1.4 * dpr;
      ctx.stroke();
    };
  })());

  const enterGate = (goto) => {
    if (!gate || gate.classList.contains("away")) return;
    gate.classList.add("away");
    document.body.classList.remove("locked");
    stopScenes();
    setTimeout(() => gate.remove(), 850);
    if (goto === "work") {
      setTimeout(() => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" }), 420);
    }
  };
  if (gate) {
    if (location.hash && location.hash !== "#") {
      gate.remove(); document.body.classList.remove("locked");
    } else {
      document.querySelectorAll(".enter").forEach((b) =>
        b.addEventListener("click", () => enterGate(b.dataset.goto)));
    }
  }

  /* ── dot-matrix headline ─────────────────────────────────── */
  const dotHead = document.getElementById("dot-head");
  const renderDotHead = () => {
    if (!dotHead) return;
    const maxW = Math.min(640, dotHead.parentElement.clientWidth || 640);
    // low-res sample: ~1px glyphs → chunky LED dots
    const fs = 10, lineH = 14;
    const font = `700 ${fs}px system-ui, sans-serif`;
    const lines = [
      [{ t: "I TURN ", a: 0 }, { t: "“WHAT IF?”", a: 1 }, { t: " INTO", a: 0 }],
      [{ t: "WORKING SOFTWARE.", a: 0 }],
    ];
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    octx.font = font;
    const widths = lines.map((segs) => segs.reduce((s, x) => s + octx.measureText(x.t).width, 0));
    const W = Math.ceil(Math.max(...widths)) + 2;
    const H = Math.ceil(lineH * lines.length + 2);
    off.width = W; off.height = H;
    octx.font = font;
    octx.textBaseline = "top";
    lines.forEach((segs, i) => {
      let x = 0;
      for (const seg of segs) {
        octx.fillStyle = seg.a ? "#ff7a1a" : "#ffffff";
        octx.fillText(seg.t, x, i * lineH + 1);
        x += octx.measureText(seg.t).width;
      }
    });
    const img = octx.getImageData(0, 0, W, H).data;
    const cell = Math.min(6, maxW / W);
    const r = cell * 0.36;
    dotHead.width = Math.round(W * cell * dpr);
    dotHead.height = Math.round(H * cell * dpr);
    dotHead.style.width = Math.round(W * cell) + "px";
    dotHead.style.height = "auto";
    const ctx = dotHead.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W * cell, H * cell);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (img[i + 3] > 110) {
          const amber = img[i] > 200 && img[i + 1] < 180;
          ctx.beginPath();
          ctx.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2);
          ctx.fillStyle = amber ? "rgba(255,178,107,0.95)" : "rgba(233,233,238,0.9)";
          ctx.fill();
        }
      }
    }
  };
  renderDotHead();
  let rzT;
  window.addEventListener("resize", () => { clearTimeout(rzT); rzT = setTimeout(renderDotHead, 200); });

  /* ── work rows: index numbers + click to expand receipts ── */
  document.querySelectorAll(".rows .row").forEach((row, i) => {
    const head = row.querySelector(".row-head");
    const idx = document.createElement("span");
    idx.className = "r-idx";
    idx.textContent = String(i + 1).padStart(2, "0");
    head.prepend(idx);
    head.addEventListener("click", (e) => {
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

  /* ── live github stats (silent fallback) ─────────────────── */
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
  document.getElementById("rail-chat")?.addEventListener("click", () => toggle(true));
  send.addEventListener("click", () => { ask(input.value); input.value = ""; });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { ask(input.value); input.value = ""; }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open")) toggle(false);
  });

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
