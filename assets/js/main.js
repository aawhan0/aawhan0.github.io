/* aawhan0.me — evidence layer
   background: clickable evidence graph of real repos/PRs
   demo: grounded retrieval over the resume (no LLM, no keys — literal cited text)
   signals: LinkedIn posts feed with official embeds
*/

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ── evidence graph ──────────────────────────────────────── */
  const ARTIFACTS = [
    { label: "ModelDock ★9", url: "https://github.com/aawhan0/ModelDock", r: 9, hub: true },
    { label: "Dasaiko ★5", url: "https://github.com/aawhan0/Dasaiko", r: 8, hub: true },
    { label: "TraceBack", url: "https://github.com/aawhan0/TraceBack", r: 6.5 },
    { label: "Faultline", url: "https://github.com/aawhan0/Faultline", r: 5.5 },
    { label: "ClearLabel-AI", url: "https://github.com/aawhan0/ClearLabel-AI", r: 5.5 },
    { label: "PuppetGPT", url: "https://github.com/aawhan0/PuppetGPT", r: 5.5 },
    { label: "InterviewForge", url: "https://github.com/aawhan0/InterviewForge", r: 5 },
    { label: "gLyric", url: "https://github.com/aawhan0/gLyric", r: 5 },
    { label: "MomentXRT", url: "https://github.com/aawhan0/MomentXRT", r: 5 },
    { label: "Provena PR #153", url: "https://github.com/provena/provena/pull/153", r: 4.5 },
    { label: "HelloblueGK PR #170", url: "https://github.com/HelloblueGK/HelloblueGK/pull/170", r: 4.5 },
    { label: "genwefilms.com", url: "https://genwefilms.com", r: 4.5 },
  ];
  const GRAPH_EDGES = [
    ["ModelDock ★9", "Dasaiko ★5"],
    ["ModelDock ★9", "TraceBack"],
    ["TraceBack", "Faultline"],
    ["Dasaiko ★5", "TraceBack"],
    ["Dasaiko ★5", "PuppetGPT"],
    ["ClearLabel-AI", "MomentXRT"],
    ["ModelDock ★9", "Provena PR #153"],
    ["TraceBack", "HelloblueGK PR #170"],
    ["Dasaiko ★5", "genwefilms.com"],
  ];

  const canvas = document.getElementById("constellation");
  let hoverNode = null;

  if (canvas) {
    const ctx = canvas.getContext("2d");
    let W, H, filler = [], nodes = new Map(), raf, firstFrame = true;

    const seed = () => {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";

      // artifacts on a loose spiral so they never clump
      nodes = new Map();
      const cx = W * 0.5, cy = H * 0.42;
      ARTIFACTS.forEach((a, i) => {
        const angle = i * 2.399963; // golden angle
        const rad = (0.14 + 0.30 * Math.sqrt((i + 0.7) / ARTIFACTS.length)) * Math.min(W, H);
        nodes.set(a.label, {
          ...a,
          x: cx + Math.cos(angle) * rad * 1.35,
          y: cy + Math.sin(angle) * rad,
          vx: (Math.random() - 0.5) * 0.05 * dpr,
          vy: (Math.random() - 0.5) * 0.05 * dpr,
        });
      });

      const count = Math.min(46, Math.floor((window.innerWidth * window.innerHeight) / 34000));
      filler = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.2 * dpr,
        vy: (Math.random() - 0.5) * 0.2 * dpr,
        r: (Math.random() * 1.4 + 0.6) * dpr,
      }));
      firstFrame = true;
    };

    const nodeAt = (px, py) => {
      for (const n of nodes.values()) {
        if (Math.hypot(px - n.x, py - n.y) < (n.r + 7) * dpr) return n;
      }
      return null;
    };

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // ambient filler links
      for (let i = 0; i < filler.length; i++) {
        for (let j = i + 1; j < filler.length; j++) {
          const a = filler[i], b = filler[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const lim = 120 * dpr;
          if (d < lim) {
            ctx.strokeStyle = `rgba(150,150,185,${(1 - d / lim) * 0.22})`;
            ctx.lineWidth = dpr * 0.6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      // evidence edges
      ctx.strokeStyle = "rgba(198,242,78,0.16)";
      ctx.lineWidth = dpr * 0.9;
      for (const [a, b] of GRAPH_EDGES) {
        const na = nodes.get(a), nb = nodes.get(b);
        if (!na || !nb) continue;
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
      }

      // filler dots
      for (const n of filler) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        ctx.fillStyle = "rgba(185,185,215,0.5)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }

      // artifact nodes (slow drift)
      for (const n of nodes.values()) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 40 * dpr || n.x > W - 40 * dpr) n.vx *= -1;
        if (n.y < 90 * dpr || n.y > H - 40 * dpr) n.vy *= -1;
        const isHover = n === hoverNode;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = isHover || n.hub ? "#c6f24e" : "rgba(198,242,78,0.55)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, (n.r + 3.5) * dpr, 0, Math.PI * 2);
        ctx.strokeStyle = isHover ? "rgba(198,242,78,0.9)" : "rgba(198,242,78,0.22)";
        ctx.lineWidth = dpr * (isHover ? 1.6 : 1);
        ctx.stroke();
      }

      // hover tooltip
      if (hoverNode) {
        ctx.font = `${11 * dpr}px "JetBrains Mono", monospace`;
        const tw = ctx.measureText(hoverNode.label).width + 18 * dpr;
        const tx = Math.min(Math.max(hoverNode.x - tw / 2, 8), W - tw - 8);
        const ty = hoverNode.y - (hoverNode.r + 22) * dpr;
        ctx.fillStyle = "rgba(10,10,15,0.92)";
        roundRect(tx, ty, tw, 20 * dpr, 5 * dpr);
        ctx.fill();
        ctx.strokeStyle = "rgba(198,242,78,0.5)";
        ctx.lineWidth = dpr;
        roundRect(tx, ty, tw, 20 * dpr, 5 * dpr);
        ctx.stroke();
        ctx.fillStyle = "#f1f1ee";
        ctx.fillText(hoverNode.label, tx + 9 * dpr, ty + 14 * dpr);
      }
      firstFrame = false;
    };

    const tick = () => { draw(); raf = requestAnimationFrame(tick); };

    seed();
    if (reduced) draw(); else raf = requestAnimationFrame(tick);
    window.addEventListener("resize", seed);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) raf = requestAnimationFrame(tick);
    });

    window.addEventListener("pointermove", (e) => {
      const n = nodeAt(e.clientX * dpr, e.clientY * dpr);
      if (n !== hoverNode) {
        hoverNode = n;
        document.body.style.cursor = n ? "pointer" : "";
        if (reduced) draw();
      }
    });
    window.addEventListener("click", (e) => {
      if (e.target.closest("a,button,input,textarea,select,iframe,label,.card,.btn,.chip,.proof,.demo,.signals,nav,.terminal")) return;
      const n = nodeAt(e.clientX * dpr, e.clientY * dpr);
      if (n) window.open(n.url, "_blank", "noopener");
    });
  }

  /* ── proof popovers ──────────────────────────────────────── */
  const pop = document.createElement("div");
  pop.className = "proof-pop";
  pop.setAttribute("role", "tooltip");
  document.body.appendChild(pop);
  let popPin = null;

  const showPop = (el) => {
    pop.innerHTML =
      (el.dataset.proofTitle ? `<b>${el.dataset.proofTitle}</b>` : "") +
      el.dataset.proof +
      (el.dataset.proofLink ? `<a href="${el.dataset.proofLink}" target="_blank" rel="noopener">verify ↗</a>` : "");
    pop.classList.add("on");
    const r = el.getBoundingClientRect();
    const pw = Math.min(320, window.innerWidth - 24);
    pop.style.width = pw + "px";
    let x = Math.min(Math.max(r.left + r.width / 2 - pw / 2, 12), window.innerWidth - pw - 12);
    let y = r.top - pop.offsetHeight - 10;
    if (y < 60) y = r.bottom + 10;
    pop.style.left = x + "px";
    pop.style.top = y + "px";
  };
  const hidePop = () => { if (!popPin) pop.classList.remove("on"); };

  document.querySelectorAll(".proof").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.addEventListener("mouseenter", () => showPop(el));
    el.addEventListener("mouseleave", hidePop);
    el.addEventListener("focus", () => showPop(el));
    el.addEventListener("blur", hidePop);
    el.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      if (popPin === el) { popPin = null; hidePop(); }
      else { popPin = el; showPop(el); }
    });
  });
  document.addEventListener("click", (e) => {
    if (popPin && !e.target.closest(".proof")) { popPin = null; hidePop(); }
  });

  /* ── reveal on scroll ────────────────────────────────────── */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ── card tilt ───────────────────────────────────────────── */
  if (!reduced && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ── ask my resume: grounded retrieval (no llm, no keys) ── */
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

  const answer = (qRaw) => {
    const terms = [...new Set(tokenize(qRaw))];
    const scored = RESUME_CHUNKS.map((c, i) => {
      let s = 0;
      for (const t of terms) {
        const tf = chunkTokens[i].get(t);
        if (tf) s += Math.min(tf, 3) * Math.log(1 + N / (df.get(t) || 1));
      }
      return { c, s };
    }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);

    const top = scored.slice(0, scored.length > 1 && scored[1].s >= scored[0].s * 0.45 ? 2 : 1);
    const log = document.getElementById("demo-log");

    const entry = document.createElement("div");
    entry.className = "qa";
    let html = `<p class="qa-q mono"><span>❯</span> ${esc(qRaw)}</p>`;
    if (!top.length) {
      html += `<div class="qa-refuse mono">// no grounded passage in the resume for that.
// a grounded system refuses to answer what it can't cite — try a suggestion below.</div>`;
    } else {
      for (const { c } of top) {
        html += `<div class="qa-a">
          <p class="qa-text">${markTerms(c.text, terms)}</p>
          <p class="qa-cite mono">resume p.1 · § ${esc(c.section)} — ${esc(c.title)} <span class="badge">literal source · no llm</span></p>
        </div>`;
      }
    }
    entry.innerHTML = html;
    log.appendChild(entry);
    entry.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "nearest" });
  };

  const input = document.getElementById("demo-input");
  const btn = document.getElementById("demo-ask");
  const ask = () => {
    const q = input.value.trim();
    if (!q) return;
    answer(q);
    input.value = "";
  };
  if (input && btn) {
    btn.addEventListener("click", ask);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") ask(); });
    document.querySelectorAll(".demo-chip").forEach((chip) => {
      chip.addEventListener("click", () => { input.value = chip.textContent.trim(); ask(); });
    });
    // seed the demo the first time it scrolls into view
    const demoSec = document.getElementById("demo");
    if (demoSec) {
      const dio = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          dio.disconnect();
          answer("what has aawhan built with rag?");
        }
      }, { threshold: 0.35 });
      dio.observe(demoSec);
    }
  }

  /* ── signals: linkedin feed ──────────────────────────────── */
  const sigDate = (id) => new Date(Number((BigInt(id) >> 22n).toString()));
  const sigDateLabel = (id) => {
    const d = sigDate(id);
    const days = Math.floor((Date.now() - d.getTime()) / 864e5);
    return days < 1 ? "today" : days < 30 ? days + "d ago"
      : d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toLowerCase();
  };

  const embeds = SIGNALS.filter((s) => s.embed);
  const cards = SIGNALS.filter((s) => !s.embed);
  const embedWrap = document.getElementById("signal-embeds");
  const cardWrap = document.getElementById("signal-cards");

  if (embedWrap) {
    embedWrap.innerHTML = embeds.map((s) => `
      <div class="signal-embed">
        <iframe src="https://www.linkedin.com/embed/feed/update/urn:li:activity:${s.id}"
          height="560" loading="lazy" allowfullscreen
          title="LinkedIn post: ${esc(s.title)}"></iframe>
      </div>`).join("");
  }
  if (cardWrap) {
    cardWrap.innerHTML = cards.map((s) => `
      <a class="signal-card" href="https://www.linkedin.com/feed/update/urn:li:activity:${s.id}"
         target="_blank" rel="noopener">
        <div class="signal-top mono"><span>${sigDateLabel(s.id)}</span><span aria-hidden="true">↗</span></div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.blurb)}</p>
        <div class="signal-tags mono">${s.tags.map((t) => "#" + esc(t)).join(" ")}</div>
      </a>`).join("");
  }

  /* ── live github stats ───────────────────────────────────── */
  const setStat = (id, val) => {
    const el = document.getElementById(id);
    if (el && typeof val === "number") el.textContent = val;
  };
  fetch("https://api.github.com/users/aawhan0")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((u) => {
      setStat("stat-repos", u.public_repos);
      setStat("stat-followers", u.followers);
      return fetch("https://api.github.com/users/aawhan0/repos?per_page=100");
    })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((repos) => setStat("stat-stars", repos.reduce((s, r) => s + r.stargazers_count, 0)))
    .catch(() => {/* keep baked-in numbers */});
})();
