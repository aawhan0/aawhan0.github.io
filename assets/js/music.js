/* music.html — the listening room: sound check, hidden song, mute pill */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  /* ── the song — trees · kurtains, via hidden soundcloud widget.
     starts on "press play"; the corner pill is a pure mute —
     no redirect, no visible embed. loops till you leave. ───── */
  const pill = document.getElementById("bg-music");
  const pillBtn = document.getElementById("bm-toggle");
  let widget = null;
  let ready = false;
  let pendingPlay = false;
  let songWanted = false;

  const setPill = (playing) => {
    pill.classList.toggle("paused", !playing);
    pillBtn.setAttribute("aria-pressed", String(playing));
    pillBtn.setAttribute("aria-label", playing ? "mute background music" : "unmute background music");
  };
  setPill(false);

  const play = () => {
    if (!songWanted || !widget) return;
    if (ready) widget.play(); else pendingPlay = true;
  };

  const api = document.createElement("script");
  api.src = "https://w.soundcloud.com/player/api.js";
  api.onload = () => {
    widget = SC.Widget(document.getElementById("sc-widget"));
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

  const startSong = () => {
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
    if (!widget) return;
    if (playing) widget.pause(); else play();
  });

  /* ── sound check intro ───────────────────────────────────── */
  const tv = document.getElementById("tv");
  const enterRoom = (sound) => {
    if (sound) startSong();
    tv.classList.add("away");
    document.body.classList.remove("locked");
    setTimeout(() => tv.remove(), 800);
  };
  document.getElementById("tv-play").addEventListener("click", () => enterRoom(true));
  document.getElementById("tv-silent").addEventListener("click", () => enterRoom(false));

  /* ── room scene: slow amber eq wall ──────────────────────── */
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  let W, H;
  const size = () => {
    W = canvas.width = window.innerWidth * dpr;
    H = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  };
  size();
  window.addEventListener("resize", size);

  const draw = (t) => {
    ctx.fillStyle = "#0b0b0e";
    ctx.fillRect(0, 0, W, H);
    const n = 26, bw = W / n;
    for (let i = 0; i < n; i++) {
      const lvl = Math.abs(Math.sin(i * 0.5 + t * 0.9) * 0.62 + Math.sin(i * 1.21 - t * 0.55) * 0.38);
      const h = (0.06 + lvl * 0.6) * H;
      ctx.fillStyle = `rgba(255,178,107,${0.05 + lvl * 0.1})`;
      ctx.fillRect(i * bw + bw * 0.3, H - h, bw * 0.4, h);
    }
  };
  if (!reduced) {
    const t0 = performance.now();
    const loop = (now) => {
      draw((now - t0) / 1000);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } else {
    draw(0);
  }

  document.querySelectorAll(".chapter").forEach((c) => c.classList.add("on"));
})();
