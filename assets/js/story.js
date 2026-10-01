/* story.html — broadcast tour: tv intro, optional audio, scroll-driven scenes */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  /* ── signal one-liners (reuse SIGNALS) ───────────────────── */
  const sigDateLabel = (id) => {
    const d = new Date(Number((BigInt(id) >> 22n).toString()));
    return d.toLocaleDateString("en-US", { month: "short" }).toLowerCase() +
      " " + String(d.getFullYear()).slice(2);
  };
  const list = document.getElementById("story-sigs");
  if (list) {
    list.innerHTML = SIGNALS.slice(0, 5).map((s) => `
      <li><a href="https://www.linkedin.com/feed/update/urn:li:activity:${s.id}"
        target="_blank" rel="noopener">${s.title}</a></li>`).join("");
  }

  /* ── tv intro ────────────────────────────────────────────── */
  let audioOn = false;
  let audioCtx = null, hum = null, humGain = null;

  const startAudio = () => {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      hum = audioCtx.createOscillator();
      humGain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 220;
      hum.type = "sawtooth";
      hum.frequency.value = 48;
      humGain.gain.value = 0.012;
      hum.connect(filter).connect(humGain).connect(audioCtx.destination);
      hum.start();
    } catch (e) { audioCtx = null; }
  };
  const blip = (f) => {
    if (!audioOn || !audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "square";
    o.frequency.value = f || 620;
    g.gain.setValueAtTime(0.035, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.13);
  };

  const tv = document.getElementById("tv");
  const enterTour = (sound) => {
    audioOn = !!sound;
    if (audioOn) startAudio();
    if (sound) startSong();
    tv.classList.add("away");
    document.body.classList.remove("locked");
    blip(720);
    setTimeout(() => tv.remove(), 800);
  };
  document.getElementById("tv-sound").addEventListener("click", () => enterTour(true));
  document.getElementById("tv-mute").addEventListener("click", () => enterTour(false));

  /* ── background song — trees · kurtains, via hidden soundcloud
     widget. starts on "continue with sound"; the corner pill is a
     pure mute (song + broadcast hum), no redirect, no embed. ──── */
  const pill = document.getElementById("bg-music");
  const pillBtn = document.getElementById("bm-toggle");
  let widget = null;
  let songWanted = false;

  const setPill = (playing) => {
    pill.classList.toggle("paused", !playing);
    pillBtn.setAttribute("aria-pressed", String(playing));
    pillBtn.setAttribute("aria-label", playing ? "mute background music" : "unmute background music");
  };
  setPill(false);

  const startSong = () => {
    songWanted = true;
    try { localStorage.setItem("aw-music", "on"); } catch (e) {}
    setPill(true);
    if (widget) widget.play();
  };

  const api = document.createElement("script");
  api.src = "https://w.soundcloud.com/player/api.js";
  api.onload = () => {
    widget = SC.Widget(document.getElementById("sc-widget"));
    widget.bind(SC.Widget.Events.READY, () => {
      widget.setVolume(65);
      if (songWanted) widget.play();
    });
    widget.bind(SC.Widget.Events.PLAY, () => setPill(true));
    widget.bind(SC.Widget.Events.PAUSE, () => setPill(false));
    widget.bind(SC.Widget.Events.FINISH, () => setPill(false));
  };
  document.head.appendChild(api);

  pillBtn.addEventListener("click", () => {
    const playing = !pill.classList.contains("paused");
    try { localStorage.setItem("aw-music", playing ? "off" : "on"); } catch (e) {}
    if (playing) {
      songWanted = false;
      setPill(false);
      if (widget) widget.pause();
      audioOn = false;
      if (audioCtx) audioCtx.suspend().catch(() => {});
    } else {
      songWanted = true;
      setPill(true);
      if (audioCtx) audioCtx.resume().catch(() => {});
      else startAudio();
      audioOn = true;
      if (widget) widget.play();
    }
  });

  // signal acquisition animation
  const fill = document.getElementById("tv-fill");
  const pct = document.getElementById("tv-pct");
  const label = document.getElementById("tv-label");
  const note = document.getElementById("tv-note");
  if (!reduced) {
    const labels = ["acquiring signal", "aligning receipts", "checking ground truth", "signal acquired"];
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + 3 + Math.random() * 9);
      fill.style.width = p + "%";
      pct.textContent = Math.floor(p) + "%";
      label.textContent = labels[Math.min(3, Math.floor(p / 28))];
      if (p >= 100) {
        clearInterval(tick);
        note.textContent = "signal locked. every claim checked.";
      }
    }, 90);
  } else {
    fill.style.width = "100%"; pct.textContent = "100%";
    label.textContent = "signal acquired";
    note.textContent = "signal locked. every claim checked.";
  }

  /* ── scenes ──────────────────────────────────────────────── */
  const CHARS = " .·:;=+*#%@";
  const drawWave = (ctx, W, H, t, alpha) => {
    ctx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
    const step = 9 * dpr, rowH = 13 * dpr;
    for (let y = rowH; y < H; y += rowH) {
      for (let x = step; x < W; x += step) {
        const ridge = H * 0.5 + Math.sin(x * 0.004 / dpr + t * 0.9) * H * 0.22
          + Math.sin(x * 0.011 / dpr - t * 0.5) * H * 0.08;
        const d = Math.abs(y - ridge);
        const band = Math.exp(-(d * d) / (2 * Math.pow(H * 0.11, 2)));
        const shimmer = 0.5 + 0.5 * Math.sin(x * 0.02 / dpr + y * 0.03 / dpr + t * 2);
        const n = band * (0.55 + 0.45 * shimmer) * alpha;
        if (n < 0.1) continue;
        const ch = CHARS[Math.floor(n * (CHARS.length - 1))];
        ctx.fillStyle = `rgba(125,145,190,${0.1 + n * 0.6})`;
        ctx.fillText(ch, x, y);
      }
    }
  };

  let stars = null, parts = null, seedW = 0, seedH = 0;
  const drawDisk = (ctx, W, H, t, alpha) => {
    if (!parts || W !== seedW || H !== seedH) {
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
    }
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.46, inner = R * 0.28;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(11,11,14,${0.4 * alpha + (1 - alpha) * 0.28})`;
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      ctx.fillStyle = `rgba(200,205,225,${s.a * alpha})`;
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
      ctx.fillStyle = `rgba(255,${Math.floor(178 + warm * 66)},${Math.floor(107 + warm * 123)},${(0.12 + (1 - k) * 0.75) * alpha})`;
      ctx.fillRect(x, y, 1.6 * dpr, 1.6 * dpr);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    ctx.arc(cx, cy, inner * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = "#050507";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, inner * 0.66, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,225,190,${0.55 * alpha})`;
    ctx.lineWidth = 1.4 * dpr;
    ctx.stroke();
  };

  const drawGap = (ctx, W, H, t, alpha) => {
    // quiet static grid with a slow scanning line
    ctx.strokeStyle = `rgba(255,255,255,${0.03 * alpha})`;
    ctx.lineWidth = 1;
    const step = 48 * dpr;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const scanY = ((t * 0.06) % 1) * H;
    ctx.fillStyle = `rgba(255,178,107,${0.05 * alpha})`;
    ctx.fillRect(0, scanY, W, 2 * dpr);
  };

  const drawGrid = (ctx, W, H, t, alpha) => {
    // drifting constellation — nodes link up as they pass each other
    let s = 42;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const pts = [];
    for (let i = 0; i < 42; i++) {
      pts.push({
        x: rnd() * W, y: rnd() * H,
        dx: Math.sin(t * 0.35 + i) * 14 * dpr,
        dy: Math.cos(t * 0.28 + i * 1.7) * 10 * dpr,
      });
    }
    ctx.strokeStyle = `rgba(145,158,198,${0.13 * alpha})`;
    ctx.lineWidth = dpr;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const ax = pts[i].x + pts[i].dx, ay = pts[i].y + pts[i].dy;
        const bx = pts[j].x + pts[j].dx, by = pts[j].y + pts[j].dy;
        if (Math.hypot(ax - bx, ay - by) < W * 0.14) {
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = `rgba(145,158,198,${0.5 * alpha})`;
    for (const p of pts) ctx.fillRect(p.x + p.dx - 1.5 * dpr, p.y + p.dy - 1.5 * dpr, 3 * dpr, 3 * dpr);
  };

  const drawSignal = (ctx, W, H, t, alpha) => {
    // radar sweep: expanding rings, a slow scan arm, blinking blips
    const cx = W * 0.5, cy = H * 0.42, R = Math.min(W, H) * 0.55;
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.22 + i / 3) % 1;
      ctx.beginPath();
      ctx.arc(cx, cy, k * R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,178,107,${(1 - k) * 0.26 * alpha})`;
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();
    }
    const a = t * 0.9;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.strokeStyle = `rgba(255,178,107,${0.3 * alpha})`;
    ctx.stroke();
    let s = 11;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 9; i++) {
      const bx = cx + (rnd() - 0.5) * W * 0.6, by = cy + (rnd() - 0.5) * H * 0.5;
      const blink = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.4 + i * 2.1));
      ctx.fillStyle = `rgba(233,233,238,${blink * alpha})`;
      ctx.fillRect(bx - 1.5 * dpr, by - 1.5 * dpr, 3 * dpr, 3 * dpr);
    }
  };

  const drawEq = (ctx, W, H, t, alpha) => {
    // low equalizer wall
    const n = 30, bw = W / n;
    for (let i = 0; i < n; i++) {
      const lvl = Math.abs(Math.sin(i * 0.5 + t * 0.45) * 0.62 + Math.sin(i * 1.21 - t * 0.28) * 0.38);
      const h2 = (0.06 + lvl * 0.6) * H;
      ctx.fillStyle = `rgba(255,178,107,${(0.05 + lvl * 0.1) * alpha})`;
      ctx.fillRect(i * bw + bw * 0.3, H - h2, bw * 0.4, h2);
    }
  };

  const scenes = { wave: drawWave, gap: drawGap, disk: drawDisk, grid: drawGrid, signal: drawSignal, eq: drawEq };
  const paintScene = (name, a, tt) => (scenes[name] || drawGap)(ctx, W, H, tt, name === "gap" ? 1 : a);

  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  let W, H, cur = "wave", target = "wave", mix = 1;
  const size = () => {
    W = canvas.width = window.innerWidth * dpr;
    H = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    seedW = 0;
  };
  size();
  window.addEventListener("resize", size);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        const s = e.target.dataset.scene;
        if (s && s !== target) { target = s; blip(520); }
      }
    }
  }, { threshold: 0.55 });
  document.querySelectorAll(".chapter").forEach((c) => io.observe(c));

  const t0 = performance.now();
  const loop = (now) => {
    const t = (now - t0) / 1000;
    // crossfade scene mix
    mix += ((target === cur ? 1 : 0) - mix) * 0.06;
    if (mix < 0.04 && cur !== target) { cur = target; }
    W = canvas.width; H = canvas.height;
    ctx.fillStyle = "#0b0b0e";
    ctx.fillRect(0, 0, W, H);
    paintScene(cur, 0.85, t);
    if (cur !== target) {
      ctx.fillStyle = "rgba(11,11,14,1)";
      ctx.globalAlpha = 1 - mix;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      paintScene(target, 0.85 * mix, t);
    }
    requestAnimationFrame(loop);
  };
  if (!reduced) requestAnimationFrame(loop);
  else { drawDisk(ctx, canvas.width, canvas.height, 0, 0.85); }

  /* ── chapter reveal ──────────────────────────────────────── */
  const rio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.classList.add("on");
    }
  }, { threshold: 0.35 });
  document.querySelectorAll(".chapter").forEach((c) => rio.observe(c));
})();
