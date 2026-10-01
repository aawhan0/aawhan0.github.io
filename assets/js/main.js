/* aawhan0.me — gate scenes, dither portrait, theme toggle, rows, signals */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ── theme toggle (dark default, like a certain broadcast) ── */
  const root = document.documentElement;
  const ttLabel = document.getElementById("tt-label");
  const applyTheme = (light) => {
    root.classList.toggle("light", light);
    if (ttLabel) ttLabel.textContent = light ? "light mode" : "dark mode";
    try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {}
  };
  try { applyTheme(localStorage.getItem("theme") === "light"); } catch (e) {}
  document.getElementById("theme-toggle")?.addEventListener("click", () =>
    applyTheme(!root.classList.contains("light")));

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

  // left: ascii ridge wave
  const CHARS = " .·:;=+*#%@";
  makeScene(document.getElementById("ascii-wave"), (ctx, W, H, t) => {
    ctx.fillStyle = "#0b0b0e";
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
    const step = 9 * dpr, rowH = 13 * dpr;
    for (let y = rowH; y < H; y += rowH) {
      for (let x = step; x < W; x += step) {
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
        const k = (p.r - inner) / (R - inner);
        const warm = 1 - k;
        ctx.fillStyle = `rgba(255,${Math.floor(178 + warm * 66)},${Math.floor(107 + warm * 123)},${0.12 + (1 - k) * 0.75})`;
        ctx.fillRect(x, y, 1.6 * dpr, 1.6 * dpr);
      }
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
    if (goto === "story") {
      setTimeout(() => { window.location.href = "story.html"; }, 450);
      return;
    }
    setTimeout(() => gate.remove(), 850);
  };
  if (gate) {
    if (location.hash && location.hash !== "#") {
      gate.remove(); document.body.classList.remove("locked");
    } else {
      document.querySelectorAll(".enter").forEach((b) =>
        b.addEventListener("click", () => enterGate(b.dataset.goto)));
    }
  }

  /* ── dithered portrait — color-aware for the yellow mugshot ── */
  const dither = document.getElementById("dither");
  if (dither) {
    const render = (img) => {
      try {
        const SW = 100, SH = 120;
        const off = document.createElement("canvas");
        off.width = SW; off.height = SH;
        const o = off.getContext("2d");
        o.drawImage(img, 0, 0, SW, SH);
        const data = o.getImageData(0, 0, SW, SH).data;
        const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
        const cell = 4;
        dither.width = SW * cell; dither.height = SH * cell;
        dither.style.width = "100%";
        const c = dither.getContext("2d");
        c.fillStyle = "#050507";
        c.fillRect(0, 0, dither.width, dither.height);
        for (let y = 0; y < SH; y++) {
          for (let x = 0; x < SW; x++) {
            const i = (y * SW + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            const sat = mx === 0 ? 0 : (mx - mn) / mx;
            const isYellow = sat > 0.55 && r > 170 && g > 140 && b < 140;
            if (isYellow) {
              // keep the signature backdrop as amber dots
              if (lum > 0.5) {
                c.fillStyle = "rgba(255,178,107,0.92)";
                c.fillRect(x * cell, y * cell, cell - 0.7, cell - 0.7);
              }
            } else if (lum > (BAYER[y % 4][x % 4] + 0.5) / 16) {
              c.fillStyle = lum > 0.72 ? "rgba(233,233,238,0.95)" : "rgba(255,178,107,0.85)";
              c.fillRect(x * cell, y * cell, cell - 0.7, cell - 0.7);
            }
          }
        }
      } catch (e) { /* leave fallback frame */ }
    };
    const img = new Image();
    img.onload = () => render(img);
    img.src = "assets/img/portrait.jpg";
  }

  /* ── scroll reveals ──────────────────────────────────────── */
  if (!reduced && "IntersectionObserver" in window) {
    const rio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); }
      }
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((el) => rio.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

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

  /* ── dot-matrix headline (contact) ───────────────────────── */
  const renderDot = (canvas, segLines) => {
    if (!canvas) return;
    const maxW = Math.min(640, canvas.parentElement.clientWidth || 640);
    const fs = 10, lineH = 14;
    const font = `700 ${fs}px system-ui, sans-serif`;
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    octx.font = font;
    const widths = segLines.map((segs) => segs.reduce((s, x) => s + octx.measureText(x.t).width, 0));
    const W = Math.ceil(Math.max(...widths)) + 2;
    const H = Math.ceil(lineH * segLines.length + 2);
    off.width = W; off.height = H;
    octx.font = font;
    octx.textBaseline = "top";
    segLines.forEach((segs, i) => {
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
    canvas.width = Math.round(W * cell * dpr);
    canvas.height = Math.round(H * cell * dpr);
    canvas.style.width = Math.round(W * cell) + "px";
    canvas.style.height = "auto";
    const ctx = canvas.getContext("2d");
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
  const dotContact = document.getElementById("dot-contact");
  const dotSegs = [[{ t: "LET'S ", a: 0 }, { t: "BUILD.", a: 1 }]];
  renderDot(dotContact, dotSegs);
  let rzT;
  window.addEventListener("resize", () => {
    clearTimeout(rzT);
    rzT = setTimeout(() => renderDot(dotContact, dotSegs), 200);
  });
})();
