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
    tv.classList.add("away");
    document.body.classList.remove("locked");
    blip(720);
    setTimeout(() => tv.remove(), 800);
  };
  document.getElementById("tv-sound").addEventListener("click", () => enterTour(true));
  document.getElementById("tv-mute").addEventListener("click", () => enterTour(false));

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
    if (cur === "wave") drawWave(ctx, W, H, t, 0.85);
    else if (cur === "disk") drawDisk(ctx, W, H, t, 0.85);
    else drawGap(ctx, W, H, t, 1);
    if (cur !== target) {
      ctx.fillStyle = "rgba(11,11,14,1)";
      ctx.globalAlpha = 1 - mix;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      if (target === "wave") drawWave(ctx, W, H, t, 0.85 * mix);
      else if (target === "disk") drawDisk(ctx, W, H, t, 0.85 * mix);
      else drawGap(ctx, W, H, t, mix);
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
