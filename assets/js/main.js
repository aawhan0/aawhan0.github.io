/* aawhan0.me — interactions: constellation, reveal, tilt, live stats */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ── neural constellation background ─────────────────────── */
  const canvas = document.getElementById("constellation");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    let W, H, nodes = [], raf;
    const LINK = 130;

    const resize = () => {
      W = canvas.width = window.innerWidth * devicePixelRatio;
      H = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      const count = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 22000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.22 * devicePixelRatio,
        r: (Math.random() * 1.6 + 0.7) * devicePixelRatio,
      }));
    };

    const mouse = { x: -9999, y: -9999 };
    window.addEventListener("pointermove", (e) => {
      mouse.x = e.clientX * devicePixelRatio;
      mouse.y = e.clientY * devicePixelRatio;
    });

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK * devicePixelRatio) {
            const alpha = (1 - d / (LINK * devicePixelRatio)) * 0.35;
            const nearMouse =
              Math.hypot((a.x + b.x) / 2 - mouse.x, (a.y + b.y) / 2 - mouse.y) <
              170 * devicePixelRatio;
            ctx.strokeStyle = nearMouse
              ? `rgba(198,242,78,${alpha + 0.25})`
              : `rgba(160,160,190,${alpha})`;
            ctx.lineWidth = devicePixelRatio * 0.7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(200,200,230,0.75)";
      for (const n of nodes) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(tick);
    });
    raf = requestAnimationFrame(tick);
  }

  /* ── reveal on scroll ────────────────────────────────────── */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ── subtle card tilt ────────────────────────────────────── */
  if (!reduced && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ── live GitHub stats (graceful fallback to baked-in values) ── */
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
    .then((repos) => {
      setStat("stat-stars", repos.reduce((s, r) => s + r.stargazers_count, 0));
    })
    .catch(() => {/* rate-limited or offline — keep baked-in numbers */});
})();
