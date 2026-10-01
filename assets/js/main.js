/* aawhan0.me — gate scenes, theme toggle, portrait reveal, rows, signals */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── theme toggle (dark default, like a certain broadcast) ── */
  const root = document.documentElement;
  const ttLabel = document.getElementById("tt-label");
  const applyTheme = (light, persist = true) => {
    root.classList.toggle("light", light);
    if (ttLabel) ttLabel.textContent = light ? "light mode" : "dark mode";
    if (persist) { try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {} }
  };
  /* On load: an explicit stored choice always wins; otherwise fall back to the
     page's own default. Never write on load — a page default must not become a
     sticky global preference (that used to leak light mode onto the gate). */
  let stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  applyTheme(stored ? stored === "light" : document.body.dataset.defaultTheme === "light", false);
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

  // right: behind the scenes — interstellar black hole through a thermal camera
  makeScene(document.getElementById("disk"), (() => {
    const BW = 320, BH = 380;
    let buf = null, bufCtx = null, img = null, lut = null;
    const buildLut = () => {
      const stops = [
        [0.0, 0, 0, 0], [0.16, 28, 0, 62], [0.36, 122, 14, 52],
        [0.56, 208, 56, 14], [0.74, 255, 132, 0], [0.88, 255, 216, 76], [1.0, 255, 255, 238],
      ];
      lut = new Uint8ClampedArray(256 * 3);
      for (let i = 0; i < 256; i++) {
        const v = i / 255;
        let a = stops[0], b = stops[stops.length - 1];
        for (let s = 0; s < stops.length - 1; s++) {
          if (v >= stops[s][0] && v <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
        }
        const k = (v - a[0]) / ((b[0] - a[0]) || 1);
        lut[i * 3] = a[1] + (b[1] - a[1]) * k;
        lut[i * 3 + 1] = a[2] + (b[2] - a[2]) * k;
        lut[i * 3 + 2] = a[3] + (b[3] - a[3]) * k;
      }
    };
    return (ctx, W, H, t) => {
      if (!buf) {
        buf = document.createElement("canvas");
        buf.width = BW; buf.height = BH;
        bufCtx = buf.getContext("2d");
        img = bufCtx.createImageData(BW, BH);
        buildLut();
      }
      const d = img.data;
      const cx = BW / 2, cy = BH * 0.5;
      const Rh = BH * 0.155;   // event horizon radius
      let seed = 987654321;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let y = 0; y < BH; y++) {
        for (let x = 0; x < BW; x++) {
          const i = (y * BW + x) * 4;
          const px = (x - cx) / Rh, py = (y - cy) / Rh;
          const r = Math.hypot(px, py);
          let v = 0;
          // doppler beaming: the side spinning toward us burns brighter
          const doppler = 1 + 0.8 * -Math.sign(px) * Math.min(1, Math.abs(px) / 2.4);
          const angle = Math.atan2(py, px);
          const streak = 0.7 + 0.3 * Math.sin(angle * 21 + t * 2.4 + r * 4.5);
          // front disk — crosses in front of the horizon, below the center line
          const f = Math.hypot(px / 2.75, (py - 0.1) / 0.38);
          if (py > 0.02 && Math.abs(f - 1) < 0.13) {
            v = Math.max(v, (1 - Math.abs(f - 1) / 0.13) * doppler * streak);
          } else if (py > 0.02 && f >= 1 && f < 1.35) {
            v = Math.max(v, (1 - (f - 1) / 0.35) * 0.35 * doppler * streak);
          }
          if (r >= 1) {
            // lensed far side — the fat arc arched over the top
            const u = Math.hypot(px / 1.48, (py + 0.05) / 1.12);
            if (py < -0.04 && Math.abs(u - 1) < 0.15) {
              v = Math.max(v, (1 - Math.abs(u - 1) / 0.15) * (0.45 + 0.55 * doppler) * streak);
            }
            // lensed underside — the smaller mirrored arc below the disk
            const lo = Math.hypot(px / 1.1, (py - 0.06) / 0.75);
            if (py > 0.3 && Math.abs(lo - 1) < 0.12) {
              v = Math.max(v, (1 - Math.abs(lo - 1) / 0.12) * 0.75 * doppler * streak);
            }
            // soft halo hugging the horizon
            if (r < 1.7) v = Math.max(v, (1 - (r - 1) / 0.7) * 0.14 * doppler);
            // photon ring — thin, right against the horizon
            if (Math.abs(r - 1.045) < 0.028) v = Math.max(v, 0.95);
          }
          // thermal grain
          v = Math.min(1, Math.max(0, v + (rnd() - 0.5) * 0.08));
          const q = Math.round(v * 255);
          d[i] = lut[q * 3]; d[i + 1] = lut[q * 3 + 1]; d[i + 2] = lut[q * 3 + 2]; d[i + 3] = 255;
        }
      }
      bufCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buf, 0, 0, W, H);
      // thermal camera chrome: scanlines + rolling refresh band
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      for (let y = 0; y < H; y += 6 * dpr) ctx.fillRect(0, y, W, dpr);
      const roll = ((t * 0.1) % 1) * H;
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.fillRect(0, roll, W, 16 * dpr);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = dpr;
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    };
  })());
  /* ── boot: scramble the name in, then lift to reveal the gate ── */
  /* deep links bypass the boot entirely — no loader flash before redirecting */
  const deepLink = location.hash && location.hash !== "#";
  const boot = document.getElementById("boot");
  const bootName = document.getElementById("boot-name");
  const bootStatus = document.getElementById("boot-status");
  const bootFill = document.getElementById("boot-fill");

  const revealGate = () => {
    if (gate) gate.classList.add("gate--live");
    if (boot) {
      boot.classList.add("done");
      setTimeout(() => boot.remove(), 700);
    }
  };

  if (deepLink) {
    if (boot) boot.remove();
  } else if (boot && bootName) {
    const text = bootName.dataset.text || "AAWHAN VYAS";
    const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>*#=+";
    const STATUS = ["initialising", "loading profile", "syncing signal", "ready"];

    /* build one span per character. Spaces become non-breaking so the name
       never wraps mid-word while it decodes. */
    bootName.textContent = "";
    const spans = [];
    for (const ch of text) {
      if (ch === " ") {
        bootName.appendChild(document.createTextNode(" "));
        continue;
      }
      const s = document.createElement("span");
      s.textContent = ch;
      s.dataset.ch = ch;                       // remember the real letter
      s.style.setProperty("--i", String(spans.length));
      bootName.appendChild(s);
      spans.push(s);
    }

    if (reduced) {
      boot.classList.add("in");
      if (bootFill) bootFill.style.width = "100%";
      revealGate();
    } else {
      let frame = 0;
      const TOTAL = 66;                       // ~1.1s at 60fps
      const tick = () => {
        frame++;
        const progress = frame / TOTAL;
        // every letter resolves left-to-right; ahead of the wave they scramble
        const settled = Math.floor(progress * (spans.length + 3));
        spans.forEach((s, i) => {
          if (i < settled) {
            s.textContent = s.dataset.ch;            // resolved — show the real letter
            s.classList.remove("glyph");
          } else if (Math.random() < 0.55) {
            s.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
            if (!s.classList.contains("glyph")) s.classList.add("glyph");
          }
        });
        if (bootFill) bootFill.style.width = Math.min(100, (progress * 100).toFixed(1)) + "%";
        if (bootStatus) bootStatus.textContent = STATUS[Math.min(STATUS.length - 1, Math.floor(progress * STATUS.length))];

        if (frame < TOTAL) {
          requestAnimationFrame(tick);
        } else {
          spans.forEach((s) => { s.textContent = s.dataset.ch; s.classList.remove("glyph"); });
          boot.classList.add("in");
          if (bootFill) bootFill.style.width = "100%";
          if (bootStatus) bootStatus.textContent = STATUS[STATUS.length - 1];
          setTimeout(revealGate, 620);
        }
      };
      requestAnimationFrame(tick);
    }
    // failsafe: never leave the visitor staring at the loader
    setTimeout(revealGate, 4200);
  } else if (gate) {
    gate.classList.add("gate--live");
  }

  const enterGate = (goto) => {
    if (!gate || gate.classList.contains("away")) return;
    gate.classList.add("away");
    document.body.classList.remove("locked");
    stopScenes();
    const routes = { brief: "brief/", story: "story.html" };
    if (routes[goto]) {
      setTimeout(() => { window.location.href = routes[goto]; }, 450);
      return;
    }
    setTimeout(() => gate.remove(), 850);
  };
  if (gate) {
    if (location.hash && location.hash !== "#") {
      // deep links live on the brief route now — carry the anchor over
      window.location.replace("brief/" + location.hash);
    } else {
      document.querySelectorAll(".enter").forEach((b) =>
        b.addEventListener("click", () => enterGate(b.dataset.goto)));
    }
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

})();
