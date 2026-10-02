/* music.html — "off the clock", the creative archive.
   Sound-check intro, hidden SoundCloud loop, and the archive itself:
   scroll chapters, counting numerals, a wireframe globe, and
   waveforms that never resolve.

   Everything here is additive. The SoundCloud block and the intro
   gesture are the originals from the listening room, unchanged. */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  /* ── where am I? ──────────────────────────────────────────────
     This file runs in two places: standalone on music.html, and
     embedded as one chapter inside story.html. The chrome around
     the archive — the sound-check gate, the theme toggle, and the
     SoundCloud pill — belongs to the standalone page only. On
     /story those elements are either absent or already owned by
     story.js, so binding them here would double-wire the pill and
     the widget. Everything below is gated on this one flag. */
  const stage = document.querySelector(".music-experience");
  const standalone = document.body.classList.contains("archive");

  /* ── theme toggle ────────────────────────────────────────────
     Same behaviour as the rest of the site: an explicit stored
     choice always wins, and the page default never becomes a
     sticky global preference. The archive's own ground is dark,
     so the toggle only ever swaps the furniture, not the world. */
  const root = document.documentElement;
  const ttLabel = document.getElementById("tt-label");
  const applyTheme = (light) => {
    root.classList.toggle("light", light);
    if (ttLabel) ttLabel.textContent = light ? "light mode" : "dark mode";
    try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {}
  };
  if (standalone) {
    try {
      const stored = localStorage.getItem("theme");
      applyTheme(stored === "light");
    } catch (e) { applyTheme(false); }
    document.getElementById("theme-toggle")?.addEventListener("click",
      () => applyTheme(!root.classList.contains("light")));
  }

  /* ── the song — trees · kurtains, via hidden soundcloud widget.
     starts on "open the archive"; the corner pill is a pure mute —
     no redirect, no visible embed. loops till you leave.

     STANDALONE ONLY. story.html ships its own pill and its own
     widget on the same ids (#bg-music, #bm-toggle, #sc-widget).
     Instantiating a second SC.Widget on that iframe would fight
     story.js for the same element, so when embedded we hand the
     soundtrack back to story.js entirely — one player, one song,
     one mute button, exactly as each page behaves alone. ───── */
  let startSong = () => {};
  if (standalone) {
    const pill = document.getElementById("bg-music");
    const pillBtn = document.getElementById("bm-toggle");
    let widget = null;
    let widgetLoading = false;
    let ready = false;
    let pendingPlay = false;
    let songWanted = false;

    const setPill = (playing) => {
      pill.classList.toggle("paused", !playing);
      pillBtn.setAttribute("aria-pressed", String(playing));
      pillBtn.setAttribute("aria-label", playing ? "mute background music" : "unmute background music");
    };
    setPill(false);

    /* Loaded on first intent, not on page load. Playback here can only begin
       from the gate's "enter" click or the corner pill, so fetching the whole
       SoundCloud player up front (iframe + two widget bundles + a track
       resolve) was pure load-time cost on the critical path. pendingPlay
       latches a click that lands before the widget is up, so nothing is lost. */
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
          ready = true;
          widget.setVolume(65);
          if (pendingPlay) { pendingPlay = false; widget.play(); }
        });
        widget.bind(SC.Widget.Events.PLAY, () => setPill(true));
        widget.bind(SC.Widget.Events.PAUSE, () => setPill(false));
        widget.bind(SC.Widget.Events.FINISH, () => {
          if (songWanted) widget.play(); // the loop
        });
      };
      document.head.appendChild(api);
    };

    const play = () => {
      if (!songWanted) return;
      if (!widget) { loadWidget(); pendingPlay = true; return; }
      if (ready) widget.play(); else pendingPlay = true;
    };

    startSong = () => {
      songWanted = true;
      try { localStorage.setItem("aw-music", "on"); } catch (e) {}
      setPill(true);
      play();
    };

    pillBtn.addEventListener("click", () => {
      const playing = !pill.classList.contains("paused");
      try { localStorage.setItem("aw-music", playing ? "off" : "on"); } catch (e) {}
      songWanted = !playing;
      setPill(!playing);
      // unmute may be the first intent of the visit — play() lazily loads the
      // widget, so don't short-circuit here when it isn't up yet.
      if (playing && widget) widget.pause(); else if (!playing) play();
    });
  }

  /* ── intro ───────────────────────────────────────────────────
     The listening room had a "press play / enter in silence" pair.
     Same two-button contract, new copy. Sound is opt-in either way.

     STANDALONE ONLY. On /story the TV broadcast is the front door
     and body.locked belongs to story.js — this gate neither exists
     nor has any business unlocking the page from under it. */
  if (standalone) {
    const gate = document.getElementById("a-gate");
    const dismissGate = () => {
      if (!gate || gate.classList.contains("away")) return;
      gate.classList.add("away");
      document.body.classList.remove("locked");
      setTimeout(() => gate.remove(), 800);
    };
    document.getElementById("a-enter").addEventListener("click", () => { startSong(); dismissGate(); });
    document.getElementById("a-enter-quiet").addEventListener("click", dismissGate);
    // any scroll past the fold dismisses it too — a visitor who arrives
    // on a deep link should never be stuck behind an overlay
    addEventListener("scroll", () => { if (window.scrollY > 40) dismissGate(); }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════
     THE ARCHIVE
     Scroll chapters, counting numerals, a wireframe globe and
     waveforms that stop before they resolve.

     The motion rule: one rAF loop, and it only draws while
     something on screen actually needs it.
     ══════════════════════════════════════════════════════════ */

  const chapters = Array.from(document.querySelectorAll(".a-ch"));
  const prog = document.getElementById("a-prog");

  /* ── the ambient backdrop ──────────────────────────────────
     A slow field of bars behind everything, tinted by whichever
     chapter is active — so the ground shifts as you move. */
  const bgCanvas = document.getElementById("a-bg");
  const bgCtx = bgCanvas.getContext("2d");
  let bw, bh, bgHue = 265;
  const sizeBg = () => {
    bw = bgCanvas.width = window.innerWidth * dpr;
    bh = bgCanvas.height = window.innerHeight * dpr;
    bgCanvas.style.width = window.innerWidth + "px";
    bgCanvas.style.height = window.innerHeight + "px";
  };
  sizeBg();

  const drawBg = (t) => {
    bgCtx.fillStyle = "#08080c";
    bgCtx.fillRect(0, 0, bw, bh);
    const n = 30, col = bw / n;
    for (let i = 0; i < n; i++) {
      const lvl = Math.abs(
        Math.sin(i * 0.42 + t * 0.55) * 0.6 + Math.sin(i * 1.07 - t * 0.33) * 0.4
      );
      const h = (0.04 + lvl * 0.34) * bh;
      const hue = bgHue + Math.sin(i * 0.3 + t * 0.2) * 26;
      bgCtx.fillStyle = `hsla(${hue}, 88%, 58%, ${0.035 + lvl * 0.075})`;
      bgCtx.fillRect(i * col + col * 0.28, bh - h, col * 0.44, h);
    }
  };

  /* ── the globe ─────────────────────────────────────────────
     A real sphere: lat/long rings projected orthographically,
     five cities plotted at their true coordinates and dropped
     when they rotate to the back. Those five are the ones named
     in the copy — the other 38 countries are not guessed at. */
  const globe = document.getElementById("a-globe");
  const gctx = globe ? globe.getContext("2d") : null;
  const PLACES = [
    { lat: 39.8, lon: -98.6 },
    { lat: 54.0, lon: -2.4 },
    { lat: 20.6, lon: 78.9 },
    { lat: 45.9, lon: 25.0 },
    { lat: 51.2, lon: 10.4 },
  ];
  const project = (lat, lon, R, spin) => {
    const la = (lat * Math.PI) / 180;
    const lo = ((lon + spin) * Math.PI) / 180;
    return {
      x: Math.cos(la) * Math.sin(lo) * R,
      y: -Math.sin(la) * R,
      z: Math.cos(la) * Math.cos(lo),
    };
  };
  const drawGlobe = (t) => {
    if (!gctx) return;
    const w = globe.width, h = globe.height;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
    const spin = t * 6;                    // one revolution ≈ 60s
    gctx.clearRect(0, 0, w, h);
    const line = `hsla(${bgHue}, 80%, 62%, 0.16)`;
    for (let lat = -60; lat <= 60; lat += 30) {
      gctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 4) {
        const p = project(lat, lon, R, spin);
        if (lon === -180) gctx.moveTo(cx + p.x, cy + p.y);
        else gctx.lineTo(cx + p.x, cy + p.y);
      }
      gctx.strokeStyle = line; gctx.lineWidth = 1.2 * dpr; gctx.stroke();
    }
    for (let lon = -180; lon < 180; lon += 30) {
      gctx.beginPath();
      for (let lat = -90; lat <= 90; lat += 4) {
        const p = project(lat, lon, R, spin);
        if (lat === -90) gctx.moveTo(cx + p.x, cy + p.y);
        else gctx.lineTo(cx + p.x, cy + p.y);
      }
      gctx.strokeStyle = line; gctx.lineWidth = 1.2 * dpr; gctx.stroke();
    }
    for (const p of PLACES) {
      const q = project(p.lat, p.lon, R, spin);
      if (q.z < 0) continue;               // back face — not drawn
      const lx = cx + q.x, ly = cy + q.y;
      const front = (q.z + 1) / 2;
      const pulse = 0.55 + 0.45 * Math.sin(t * 2 + p.lat);
      gctx.fillStyle = `hsla(${bgHue}, 95%, 66%, ${0.25 + front * 0.7})`;
      gctx.beginPath();
      gctx.arc(lx, ly, (2.4 + pulse * 1.6) * dpr, 0, Math.PI * 2);
      gctx.fill();
      gctx.strokeStyle = `hsla(${bgHue}, 95%, 70%, ${0.35 * pulse * front})`;
      gctx.lineWidth = 1.4 * dpr;
      gctx.beginPath();
      gctx.arc(lx, ly, (5 + pulse * 5) * dpr, 0, Math.PI * 2);
      gctx.stroke();
    }
  };

  /* ── waveforms that stop early ────────────────────────────
     data-wave is the fraction of the card that is finished. Past
     that point bars go flat and grey and never animate — that gap
     is the point of the chapter, so it is drawn, not hidden. */
  document.querySelectorAll(".a-wave").forEach((wave) => {
    const done = parseFloat(wave.dataset.wave || "0.6");
    const bars = 46, cut = Math.round(bars * done);
    let s = 7;
    const seed = ((s * 16807) % 2147483647) / 2147483647 * 100;
    wave.innerHTML = "";
    for (let i = 0; i < bars; i++) {
      const bar = document.createElement("i");
      const v = 0.28 + 0.72 * Math.abs(
        Math.sin(seed + i * 0.55) * 0.6 + Math.sin(seed + i * 0.21) * 0.4
      );
      bar.style.height = (14 + v * 74) + "%";
      if (i >= cut) {
        bar.dataset.cut = "1";
        bar.style.height = (8 + ((i * 7) % 5) * 3) + "%";   // unfinished tail
      } else if (!reduced) {
        bar.style.animation =
          `a-pulse ${(0.7 + ((i * 13) % 7) * 0.13).toFixed(2)}s ease-in-out ` +
          `${(i * 0.045).toFixed(2)}s infinite alternate`;
      }
      wave.appendChild(bar);
    }
  });

  /* ── counting numerals ─────────────────────────────────────
     Every figure is already real text in the markup, so this only
     animates what is already true. Never runs on reduced-motion,
     and never re-runs a figure it has already counted. */
  const ease = (p) => 1 - Math.pow(1 - p, 3);
  const countUp = (el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    const target = parseFloat(el.dataset.count);
    if (reduced || !Number.isFinite(target)) return;
    const dur = 1500, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(target * ease(p)).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString("en-US");
    };
    requestAnimationFrame(step);
  };

  /* ── the loop, on demand ───────────────────────────────────
     Runs while the archive is visible. Pauses on tab blur, and
     — when embedded in /story — also while the music chapter is
     off screen, so it isn't drawing a bar field nobody can see
     for the length of the whole story. Under reduced-motion it
     draws exactly one static frame and stops. */
  let raf = null;
  let offscreen = false;
  const t0 = performance.now();
  const tick = (now) => {
    const t = (now - t0) / 1000;
    drawBg(t);
    drawGlobe(t);
    raf = requestAnimationFrame(tick);
  };
  const resumeLoop = () => { if (raf === null && !offscreen && !document.hidden) raf = requestAnimationFrame(tick); };
  const haltLoop = () => { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } };
  if (reduced) {
    drawBg(0);
    drawGlobe(0);
  } else {
    raf = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) haltLoop(); else resumeLoop();
    });
    /* embedded only: ride the same signal story-music.js raises */
    if (stage && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        for (const e of entries) offscreen = !e.isIntersecting;
        if (offscreen) haltLoop(); else resumeLoop();
      }, { rootMargin: "10% 0px 10% 0px" }).observe(stage);
    }
  }
  window.addEventListener("resize", () => {
    sizeBg();
    if (reduced) { drawBg(0); drawGlobe(0); }
  });

  /* ── chapters ──────────────────────────────────────────────
     Marks the chapter in view, repaints the backdrop hue, and
     fires the counters once. */
  const reveal = (ch) => {
    if (!ch || ch.dataset.shown) return;
    ch.dataset.shown = "1";
    ch.classList.add("on");
    ch.querySelectorAll("[data-count]").forEach(countUp);
  };

  if ("IntersectionObserver" in window) {
    const ratios = new Map();
    const chObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) reveal(e.target);
        ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
      }
      // whichever chapter covers the most viewport owns the colour
      let best = null, bestR = 0;
      for (const [el, r] of ratios) if (r > bestR) { bestR = r; best = el; }
      if (best) {
        const hue = parseInt(best.dataset.hue || "265", 10);
        if (Number.isFinite(hue)) {
          bgHue = hue;
          // the wash and the progress rail inherit the chapter's hue.
          // Written to the archive root, not <html>: on /story the
          // document root carries story's own --hue and writing here
          // would repaint every story chapter from the music side.
          const hueHost = stage || document.documentElement;
          hueHost.style.setProperty("--hue", String(hue));
        }
      }
    }, { threshold: [0, 0.2, 0.5, 0.8], rootMargin: "-20% 0px -30% 0px" });
    chapters.forEach((c) => chObserver.observe(c));
  } else {
    chapters.forEach(reveal);
  }
  // the opening chapter is on screen before anyone scrolls — reveal it
  // now rather than waiting for the observer to fire
  reveal(chapters[0]);

  /* progress rail — one frame, not one per scroll event */
  let progQueued = false;
  addEventListener("scroll", () => {
    if (progQueued) return;
    progQueued = true;
    requestAnimationFrame(() => {
      progQueued = false;
      const max = document.body.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (prog) prog.style.height = (p * 100).toFixed(2) + "%";
    });
  }, { passive: true });
})();
