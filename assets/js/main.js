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

  // right: behind the scenes — false-colour thermal camera over a convecting field
  makeScene(document.getElementById("disk"), (() => {
    const BW = 300, BH = 360;
    const GW = 150, GH = 180;            // coarse field, bilinearly upsampled — cheap + smooth
    const field = new Float32Array(GW * GH);
    let buf = null, bufCtx = null, img = null, lut = null;

    /* full-spectrum ironbow: indigo → violet → magenta → coral → amber → white.
       hotter always reads brighter, so the palette carries the meaning. */
    const buildLut = () => {
      const stops = [
        [0.00, 4, 5, 14], [0.10, 26, 14, 74], [0.22, 74, 24, 143], [0.34, 140, 32, 160],
        [0.46, 201, 45, 140], [0.58, 236, 78, 106], [0.70, 250, 140, 60], [0.82, 253, 196, 74],
        [0.92, 246, 236, 150], [1.00, 255, 255, 255],
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
    /* deterministic value noise — no allocation, no per-frame drift */
    const hash = (x, y) => {
      let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };
    const smooth = (t) => t * t * (3 - 2 * t);
    const vnoise = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = smooth(x - xi), yf = smooth(y - yi);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      const top = a + (b - a) * xf, bot = c + (d - c) * xf;
      return top + (bot - top) * yf;
    };
    const fbm = (x, y) => vnoise(x, y) * 0.66 + vnoise(x * 2.07 + 11.3, y * 2.07 - 7.1) * 0.34;

    /* drifting heat cells — the subject the camera is watching */
    const cells = Array.from({ length: 6 }, (_, i) => ({
      x: 0.14 + 0.72 * Math.abs(Math.sin(i * 2.71 + 0.6)),
      y: 0.16 + 0.68 * Math.abs(Math.cos(i * 1.93 + 0.4)),
      r: 0.085 + 0.07 * Math.abs(Math.sin(i * 3.17 + 1.1)),
      a: 0.45 + 0.5 * Math.abs(Math.cos(i * 1.29 + 2.2)),
      ph: i * 1.77, sp: 0.22 + 0.07 * i,
    }));

    return (ctx, W, H, t) => {
      if (!buf) {
        buf = document.createElement("canvas");
        buf.width = BW; buf.height = BH;
        bufCtx = buf.getContext("2d");
        img = bufCtx.createImageData(BW, BH);
        buildLut();
      }

      /* ── 1. coarse field: domain-warped fbm + heat cells + rising plumes ── */
      for (let gy = 0; gy < GH; gy++) {
        const v = gy / GH;
        for (let gx = 0; gx < GW; gx++) {
          const u = gx / GW;
          // domain warp gives the fluid its curling, non-repeating structure
          const warp = Math.sin(v * 7.3 + t * 0.55) * 0.34 + Math.sin(u * 5.1 - t * 0.42) * 0.24;
          let f = fbm(u * 5.6 + warp, v * 5.6 - warp - t * 0.2) * 1.1;
          // hottest cores punch through the noise floor
          for (let c = 0; c < cells.length; c++) {
            const k = cells[c];
            const dx = (u - (k.x + Math.sin(t * k.sp + k.ph) * 0.1)) * 1.45;
            const dy = v - (k.y + Math.cos(t * k.sp * 0.75 + k.ph) * 0.075);
            f += k.a * 0.5 * Math.exp(-(dx * dx + dy * dy) / (k.r * k.r));
          }
          // convection plumes rising out of frame
          f += 0.14 * Math.sin(u * 11 + Math.sin(v * 4.2 + t * 0.8) * 1.6 + t * 0.85) * Math.max(0, 1 - v * 0.8);
          field[gy * GW + gx] = f;
        }
      }

      /* ── 2. colourise: isotherms, vignette, rolling refresh band, grain ── */
      const d = img.data;
      const sx = GW / BW, sy = GH / BH;
      const sweep = ((t * 0.12) % 1.45) - 0.22;
      const frame = (t * 60) | 0;
      for (let y = 0; y < BH; y++) {
        const fy = y * sy, gy0 = Math.min(GH - 1, fy | 0), gy1 = Math.min(GH - 1, gy0 + 1), ty = fy - gy0;
        const r0 = gy0 * GW, r1 = gy1 * GW;
        for (let x = 0; x < BW; x++) {
          const i = (y * BW + x) * 4;
          const fx = x * sx, gx0 = Math.min(GW - 1, fx | 0), gx1 = Math.min(GW - 1, gx0 + 1), tx = fx - gx0;
          // bilinear upsample of the coarse field
          const top = field[r0 + gx0] + (field[r0 + gx1] - field[r0 + gx0]) * tx;
          const bot = field[r1 + gx0] + (field[r1 + gx1] - field[r1 + gx0]) * tx;
          let v = (top + (bot - top) * ty - 0.18) * 1.12;
          v = v < 0 ? 0 : v > 1 ? 1 : v;
          v = v * v * (3 - 2 * v);                       // gentle S-curve for contrast
          // isotherms — the contour banding that reads as an instrument
          if (Math.abs(((v * 8) % 1) - 0.5) * 2 > 0.88) v = Math.min(1, v + 0.32);
          // rolling refresh band sweeping down the sensor
          const s = y / BH - sweep;
          v += 0.1 * Math.exp(-(s * s) / 0.00098);
          // vignette, then sensor grain
          v *= 1 - 0.5 * Math.pow(Math.hypot(x / BW - 0.5, y / BH - 0.5) * 1.42, 2.4);
          v += (hash(x + frame, y) - 0.5) * 0.05;
          v = v < 0 ? 0 : v > 1 ? 1 : v;
          const q = (v * 255) | 0;
          d[i] = lut[q * 3]; d[i + 1] = lut[q * 3 + 1]; d[i + 2] = lut[q * 3 + 2]; d[i + 3] = 255;
        }
      }
      bufCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buf, 0, 0, W, H);
      // instrument chrome: scanlines, corner brackets, frame
      ctx.fillStyle = "rgba(0,0,0,0.13)";
      for (let y = 0; y < H; y += 6 * dpr) ctx.fillRect(0, y, W, dpr);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = dpr;
      const m = 15 * dpr, L = 20 * dpr;
      ctx.beginPath();
      [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]
        .forEach(([cx, cy, dx, dy]) => {
          ctx.moveTo(cx, cy + dy * L);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx + dx * L, cy);
        });
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
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
      let start = null;
      const DURATION = 1100;                   // ms — framerate-independent
      const tick = (now) => {
        if (start === null) start = now;
        const progress = Math.min(1, (now - start) / DURATION);
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
        if (bootFill) bootFill.style.width = (progress * 100).toFixed(1) + "%";
        if (bootStatus) bootStatus.textContent = STATUS[Math.min(STATUS.length - 1, Math.floor(progress * STATUS.length))];

        if (progress < 1) {
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
    // failsafe: never leave the visitor staring at the loader (nor able to click through it)
    setTimeout(revealGate, 2600);
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
      /* the whole half is the target, not just the button — canvas clicks
         bubble up here. The button keeps its own listener too, but enterGate
         is idempotent so a double fire is harmless. */
      document.querySelectorAll(".gate-half").forEach((half) => {
        half.addEventListener("click", () => enterGate(half.dataset.goto));
        half.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            enterGate(half.dataset.goto);
          }
        });
      });
      document.querySelectorAll(".enter").forEach((b) =>
        b.addEventListener("click", (e) => { e.stopPropagation(); enterGate(b.dataset.goto); }));
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
