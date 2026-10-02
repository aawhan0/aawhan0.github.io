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

  /* ── per-section colour identity ─────────────────────────── */
  document.querySelectorAll(".chapter").forEach((c) => {
    if (c.dataset.hue) c.style.setProperty("--hue", c.dataset.hue);
  });

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
  let widgetLoading = false;
  let songWanted = false;

  const setPill = (playing) => {
    pill.classList.toggle("paused", !playing);
    pillBtn.setAttribute("aria-pressed", String(playing));
    pillBtn.setAttribute("aria-label", playing ? "mute background music" : "unmute background music");
  };
  setPill(false);

  /* The widget was fetched + instantiated on every page load, even though
     playback can only ever begin from a real user gesture ("continue with
     sound", or the corner pill). On a cold visit that meant the whole
     SoundCloud stack — player iframe, two widget bundles, a track resolve
     round trip — competing with first paint for bandwidth on a page that was
     already the slowest of the four.

     So it is now loaded on first intent instead. songWanted is latched, and
     the READY handler plays only if intent arrived before the widget was up,
     so a click during the load window is never dropped. The <iframe> carries
     data-src (see story.html) so its src is set at the same moment. */
  const loadWidget = () => {
    if (widget || widgetLoading) return;
    widgetLoading = true;
    const frame = document.getElementById("sc-widget");
    if (frame && !frame.src && frame.dataset.src) frame.src = frame.dataset.src;
    const api = document.createElement("script");
    api.src = "https://w.soundcloud.com/player/api.js";
    api.onload = () => {
      widget = SC.Widget(frame);
      widget.bind(SC.Widget.Events.READY, () => {
        widget.setVolume(65);
        if (songWanted) widget.play();
      });
      widget.bind(SC.Widget.Events.PLAY, () => setPill(true));
      widget.bind(SC.Widget.Events.PAUSE, () => setPill(false));
      // loop forever: restart unless the visitor explicitly muted us
      widget.bind(SC.Widget.Events.FINISH, () => {
        if (songWanted) widget.play();
        else setPill(false);
      });
    };
    document.head.appendChild(api);
  };

  const startSong = () => {
    songWanted = true;
    try { localStorage.setItem("aw-music", "on"); } catch (e) {}
    setPill(true);
    if (widget) widget.play(); else loadWidget();
  };

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
      // first unmute may be the very first intent on the page — load then
      if (widget) widget.play(); else loadWidget();
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


  /* ── the dawn family ───────────────────────────────────────────
     ch02, ch04 and ch05 all stand in the same light: horizontal sky
     strips that warm up toward a low sun, a hard dark ground line and
     one silhouette in front of it. Same sunrise, three landscapes, so
     scrolling between them never feels like the same room twice.    */

  /* sky strips, brightening the closer they sit to the sun */
  const skyBands = (ctx, W, H, hz, sunY, warm, alpha) => {
    const bands = 16, span = hz - sunY + H * 0.2;
    for (let i = 0; i < bands; i++) {
      const y = sunY + (i / bands) * span;
      const prox = 1 - Math.min(1, Math.abs(y - sunY) / (H * 0.45));
      ctx.fillStyle = "rgba(" + warm[0] + "," + Math.floor(warm[1] + prox * 90) + "," +
        Math.floor(warm[2] + prox * 80) + "," + ((0.02 + prox * 0.05) * alpha) + ")";
      ctx.fillRect(0, y, W, span / bands + 1);
    }
  };

  /* the disc and its halo. fall is the cooler tone it fades into. */
  const sun = (ctx, x, y, half, glow, core, fall, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, glow * dpr);
    g.addColorStop(0, "rgba(" + core[0] + "," + core[1] + "," + core[2] + "," + (0.4 * alpha) + ")");
    g.addColorStop(1, "rgba(" + fall[0] + "," + fall[1] + "," + fall[2] + ",0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - glow * dpr, y - glow * dpr, glow * 2 * dpr, glow * 2 * dpr);
    const s = half * dpr;
    ctx.fillStyle = "rgba(" + core[0] + "," + core[1] + "," + core[2] + "," + (0.7 * alpha) + ")";
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  };

  const dark = "rgba(8,8,11,";

  const drawBench = (ctx, W, H, t, alpha) => {
    // thirty runs against a pass line: a low sun, the mark held level
    // across the whole sky, one post per run. all but one get over.
    const hz = H * 0.72, thresh = H * 0.4;
    const rise = 0.5 + 0.5 * Math.sin(t * 0.06);
    const sunY = hz - (0.06 + rise * 0.1) * H * 0.5;
    const sunX = W * 0.5 + Math.sin(t * 0.03) * W * 0.06;
    skyBands(ctx, W, H, hz, sunY, [255, 162, 84], alpha);
    sun(ctx, sunX, sunY, 30, 150, [255, 226, 156], [255, 176, 96], alpha);

    ctx.setLineDash([8 * dpr, 8 * dpr]);
    ctx.strokeStyle = "rgba(255,234,196," + (0.3 * alpha) + ")";
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    ctx.moveTo(W * 0.05, thresh); ctx.lineTo(W * 0.95, thresh);
    ctx.stroke();
    ctx.setLineDash([]);

    // a far ridge, low and wide, so it never reads as ch04's skyline
    let s = 5;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const rbw = 54 * dpr;
    for (let x = -rbw; x < W + rbw; x += rbw) {
      const hgt = (0.012 + rnd() * 0.03) * H;
      ctx.fillStyle = dark + (0.82 * alpha) + ")";
      ctx.fillRect(x, hz - hgt, rbw - 2 * dpr, hgt);
    }
    ctx.fillStyle = dark + (0.9 * alpha) + ")";
    ctx.fillRect(0, hz, W, H - hz);

    // the runs. the light walks across them, over and over, re-running
    const n = 14, gap = (W * 0.9) / n;
    const head = (t * 0.3) % (n + 3) - 1.5;
    for (let i = 0; i < n; i++) {
      const x = W * 0.05 + (i + 0.5) * gap;
      const miss = i === 9;
      const hgt = (miss ? 0.21 : 0.345 + ((i * 7) % 5) * 0.028) * H;
      const top = hz - hgt;
      const near = Math.max(0, 1 - Math.abs(i - head) / 2.4);
      ctx.fillStyle = dark + (0.88 * alpha) + ")";
      ctx.fillRect(x - 1.5 * dpr, top, 3 * dpr, hgt);
      const c = miss ? 5 : 5 + near * 3;
      ctx.fillStyle = miss
        ? "rgba(255,124,86," + (0.8 * alpha) + ")"
        : "rgba(255,238,202," + ((0.28 + near * 0.62) * alpha) + ")";
      ctx.fillRect(x - c * dpr, top - c * dpr, c * 2 * dpr, c * 2 * dpr);
    }
  };

  let voidDots = null;
  const drawVoid = (ctx, W, H, t, alpha) => {
    // the empty repo: one commit light holding on in a big dark field
    const cx = W * 0.72, cy = H * 0.36;
    if (!voidDots || voidDots.w !== W || voidDots.h !== H) {
      let s = 7;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      voidDots = { w: W, h: H, pts: Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd() })) };
    }
    for (const p of voidDots.pts) {
      const tw = 0.5 + 0.5 * Math.sin(t * 0.5 + p.x * 20);
      ctx.fillStyle = `rgba(150,130,220,${(0.04 + tw * 0.05) * alpha})`;
      ctx.fillRect(p.x * W, p.y * H, 2 * dpr, 2 * dpr);
    }
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.1);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90 * dpr);
    g.addColorStop(0, `rgba(180,150,255,${0.5 * pulse * alpha})`);
    g.addColorStop(1, "rgba(180,150,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 90 * dpr, cy - 90 * dpr, 180 * dpr, 180 * dpr);
    ctx.fillStyle = `rgba(210,190,255,${0.9 * alpha})`;
    ctx.fillRect(cx - 2 * dpr, cy - 2 * dpr, 4 * dpr, 4 * dpr);
    const k = (t * 0.12) % 1;
    ctx.strokeStyle = `rgba(160,140,230,${(1 - k) * 0.16 * alpha})`;
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, k * W * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawDawn = (ctx, W, H, t, alpha) => {
    // sunrise over the ledger: warm horizon bands rising behind a dark skyline
    const hz = H * 0.62;
    const rise = 0.5 + 0.5 * Math.sin(t * 0.08);
    const sunY = hz - (0.18 + rise * 0.16) * H * 0.5;
    const sunX = W * 0.5 + Math.sin(t * 0.05) * W * 0.08;
    skyBands(ctx, W, H, hz, sunY, [255, 150, 60], alpha);
    sun(ctx, sunX, sunY, 26, 120, [255, 226, 164], [255, 180, 90], alpha);
    ctx.fillStyle = dark + (0.9 * alpha) + ")";
    ctx.fillRect(0, hz, W, H - hz);
    let s = 9;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const bw = 26 * dpr;
    for (let x = 0; x < W; x += bw) {
      const hgt = (0.03 + rnd() * 0.14) * H;
      ctx.fillRect(x, hz - hgt, bw - 3 * dpr, hgt);
      if (rnd() > 0.72) {
        ctx.fillStyle = "rgba(255,200,120," + (0.5 * alpha) + ")";
        ctx.fillRect(x + bw * 0.3, hz - hgt * 0.6, 3 * dpr, 4 * dpr);
        ctx.fillStyle = "rgba(8,8,11," + (0.9 * alpha) + ")";
      }
    }
  };

  const drawDoor = (ctx, W, H, t, alpha) => {
    // a doorway of light at the end - the way out, warm and inviting
    const dx = W * 0.5, dw = Math.min(W * 0.16, 150 * dpr), dh = H * 0.5;
    const dy = H * 0.5 - dh * 0.5;
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.7);
    const spill = ctx.createLinearGradient(0, dy, 0, dy + dh);
    spill.addColorStop(0, "rgba(255,200,150," + (0.02 * alpha) + ")");
    spill.addColorStop(0.5, "rgba(255,180,120," + (0.1 * pulse * alpha) + ")");
    spill.addColorStop(1, "rgba(255,160,100," + (0.02 * alpha) + ")");
    ctx.fillStyle = spill;
    ctx.fillRect(dx - dw * 3, dy - dh * 0.2, dw * 6, dh * 1.4);
    const dg = ctx.createLinearGradient(0, dy, 0, dy + dh);
    dg.addColorStop(0, "rgba(255,244,220," + (0.72 * pulse * alpha) + ")");
    dg.addColorStop(1, "rgba(255,196,138," + (0.5 * alpha) + ")");
    ctx.fillStyle = dg;
    ctx.fillRect(dx - dw / 2, dy, dw, dh);
    ctx.strokeStyle = "rgba(255,228,192," + (0.6 * alpha) + ")";
    ctx.lineWidth = 1.6 * dpr;
    ctx.strokeRect(dx - dw / 2, dy, dw, dh);
    ctx.fillStyle = "rgba(26,18,14," + (0.7 * alpha) + ")";
    const pw = 10 * dpr, ph = 46 * dpr;
    ctx.fillRect(dx - pw / 2, dy + dh - ph, pw, ph);
    ctx.beginPath();
    ctx.arc(dx, dy + dh - ph - 6 * dpr, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
    let s = 21;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 26; i++) {
      const fx = dx + (rnd() - 0.5) * dw * 2.4;
      const fy = dy + ((rnd() + t * 0.04) % 1) * dh;
      ctx.fillStyle = "rgba(255,235,200," + (0.25 * alpha) + ")";
      ctx.fillRect(fx, fy, 2 * dpr, 2 * dpr);
    }
  };


  const drawSignal = (ctx, W, H, t, alpha) => {
    // out loud on purpose: a mast at sunrise, arcs going out from its
    // head carrying the takes - wrong ones included
    const hz = H * 0.7;
    const rise = 0.5 + 0.5 * Math.sin(t * 0.09);
    const sunY = hz - (0.08 + rise * 0.14) * H * 0.5;
    const sunX = W * 0.26 + Math.sin(t * 0.04) * W * 0.05;
    skyBands(ctx, W, H, hz, sunY, [255, 138, 56], alpha);
    sun(ctx, sunX, sunY, 24, 140, [255, 206, 128], [255, 168, 84], alpha);

    // the takes themselves, drifting outward on the arcs
    let s = 11;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const phase = rnd();
    for (let i = 0; i < 7; i++) {
      const k = ((t * 0.09 + i / 7 + phase) % 1);
      const ang = -Math.PI / 2 + (rnd() - 0.5) * 2.2;
      const rad = k * H * 0.72;
      const bx = W * 0.68 + Math.cos(ang) * rad, by = hz - H * 0.3 + Math.sin(ang) * rad;
      const blink = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.4 + i * 2.1));
      ctx.fillStyle = "rgba(255,226,180," + (blink * 0.75 * alpha) + ")";
      ctx.fillRect(bx - 1.5 * dpr, by - 1.5 * dpr, 3 * dpr, 3 * dpr);
    }

    ctx.fillStyle = dark + (0.9 * alpha) + ")";
    ctx.fillRect(0, hz, W, H - hz);

    // the mast: tapering lattice with cross-bracing, standing in front
    const mx = W * 0.68, top = hz - H * 0.3, foot = 15 * dpr;
    ctx.strokeStyle = dark + (0.92 * alpha) + ")";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(mx - foot, hz); ctx.lineTo(mx - 3 * dpr, top);
    ctx.moveTo(mx + foot, hz); ctx.lineTo(mx + 3 * dpr, top);
    ctx.stroke();
    const seg = 8;
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    for (let i = 0; i < seg; i++) {
      const y0 = hz - (hz - top) * (i / seg), y1 = hz - (hz - top) * ((i + 1) / seg);
      const w0 = 3 * dpr + (foot - 3 * dpr) * (1 - i / seg);
      const w1 = 3 * dpr + (foot - 3 * dpr) * (1 - (i + 1) / seg);
      ctx.moveTo(mx - w0, y0); ctx.lineTo(mx + w1, y1);
      ctx.moveTo(mx + w0, y0); ctx.lineTo(mx - w1, y1);
    }
    ctx.stroke();
    // guy wires down to the ground
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(mx - 3 * dpr, top); ctx.lineTo(mx - foot * 2.6, hz);
    ctx.moveTo(mx + 3 * dpr, top); ctx.lineTo(mx + foot * 2.6, hz);
    ctx.stroke();
    // the lamp on top, and the arcs going out from it
    ctx.fillStyle = "rgba(255,150,110," + ((0.4 + 0.6 * Math.abs(Math.sin(t * 2.2))) * alpha) + ")";
    ctx.fillRect(mx - 2 * dpr, top - 5 * dpr, 4 * dpr, 4 * dpr);
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.15 + i / 3) % 1;
      ctx.beginPath();
      ctx.arc(mx, top, k * H * 0.72, -Math.PI * 0.92, -Math.PI * 0.08);
      ctx.strokeStyle = "rgba(255,206,140," + ((1 - k) * 0.28 * alpha) + ")";
      ctx.lineWidth = 1.3 * dpr;
      ctx.stroke();
    }
  };

  // six scenes, each drawn exactly once - no background is reused on this page
  const scenes = {
    wave: drawWave, bench: drawBench, void: drawVoid, dawn: drawDawn,
    signal: drawSignal, door: drawDoor,
  };
  const paintScene = (name, a, tt) => (scenes[name] || drawWave)(ctx, W, H, tt, a);

  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const chapters = Array.from(document.querySelectorAll(".chapter"));
  let W, H, cur = "wave", target = "wave", mix = 1;
  const size = () => {
    W = canvas.width = window.innerWidth * dpr;
    H = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  };
  size();
  window.addEventListener("resize", size);

  /* which chapter owns the viewport? the one covering the middle line */
  const pick = () => {
    const mid = window.innerHeight * 0.5;
    let best = null, bestTop = Infinity;
    for (const c of chapters) {
      const r = c.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { best = c; break; }
      if (r.top > mid && r.top < bestTop) { bestTop = r.top; best = c; }
    }
    const s = best && best.dataset.scene;
    if (s && s !== target) { target = s; blip(520); }
  };

  /* ── the loop, on demand ───────────────────────────────────
     This canvas is a fixed full-viewport backdrop behind every
     chapter, so it was painting 60fps for the entire time the tab
     was open — including behind the archive, where it is hidden,
     and while the tab was in the background. Both are pure waste.

     It now halts when the document is hidden and while the
     archive (`.music-experience`) owns the screen, and resumes
     otherwise. story-music.js already raises `music-live` for the
     archive; this is the side that finally reads it.            */
  const t0 = performance.now();
  let raf = null;
  const loop = (now) => {
    const t = (now - t0) / 1000;
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
    raf = requestAnimationFrame(loop);
  };
  const running = () => raf !== null;
  const archiveOwns = () => document.documentElement.classList.contains("music-live");
  const resumeLoop = () => { if (!running() && !document.hidden && !archiveOwns()) raf = requestAnimationFrame(loop); };
  const haltLoop = () => { if (running()) { cancelAnimationFrame(raf); raf = null; } };
  const syncLoop = () => { if (document.hidden || archiveOwns()) haltLoop(); else resumeLoop(); };

  document.addEventListener("visibilitychange", syncLoop);

  /* story-music.js toggles `html.music-live` when the archive slides
     into view. Watch the class so the loop stands down the moment the
     archive arrives, and comes back when it leaves. Attribute filter
     means this fires only for that one class, not every class change. */
  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(syncLoop)
      .observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }

  let pickQueued = false;
  const onScroll = () => {
    if (pickQueued) return;
    pickQueued = true;
    requestAnimationFrame(() => { pickQueued = false; pick(); });
  };
  const hasGsap = () => typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined";

  if (reduced) {
    /* no motion: one static frame, every chapter readable at once */
    paintScene(cur, 0.85, 0);
    chapters.forEach((c) => c.classList.add("on"));
  } else if (hasGsap()) {
    /* ── cinematic: gsap + scrolltrigger ──────────────────────
       scene swaps are scrubbed against scroll position, copy rises
       in with a soft blur, and the headline drifts for depth.     */
    gsap.registerPlugin(ScrollTrigger);
    resumeLoop();

    chapters.forEach((c) => {
      const bits = c.querySelectorAll(".ch-k, .ch-big, .ch-p, .ch-rows, .channels");
      gsap.set(bits, { opacity: 0, y: 28, filter: "blur(7px)" });
      c.classList.add("on");
      gsap.to(bits, {
        opacity: 1, y: 0, filter: "blur(0px)",
        duration: 0.95, ease: "power3.out", stagger: 0.09,
        scrollTrigger: { trigger: c, start: "top 80%", toggleActions: "play none none none" },
      });
      const head = c.querySelector(".ch-big");
      if (head) {
        gsap.to(head, {
          yPercent: -7, ease: "none",
          scrollTrigger: { trigger: c, start: "top bottom", end: "bottom top", scrub: 0.7 },
        });
      }
    });
    addEventListener("scroll", onScroll, { passive: true });
    pick();
  } else {
    /* gsap unavailable (offline or blocked cdn): plain observers */
    resumeLoop();
    addEventListener("scroll", onScroll, { passive: true });
    const rio = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) e.target.classList.add("on");
    }, { threshold: 0.35 });
    chapters.forEach((c) => rio.observe(c));
    pick();
  }
})();