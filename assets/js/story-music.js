/* story-music.js — the integration seam for /story.
   ---------------------------------------------------------------------------
   Deliberately tiny. Both story.js and music.js keep their existing
   behaviour; this file only does the two things that can only be done from
   the outside:

     1. tells story.js to stand down while the archive is on screen, so its
        rAF loop isn't painting a scene nobody can see behind the music;
     2. gives the archive chapter a scene name, so story.js's own scene
        picker lands on a quiet backdrop at the seams instead of stranding
        the last story scene under the cards.

   It adds no rAF loop of its own and observes one element.
   --------------------------------------------------------------------------- */

(() => {
  const stage = document.querySelector(".music-experience");
  if (!stage) return;                       // /story without the archive

  const root = document.documentElement;
  const setLive = (on) => root.classList.toggle("music-live", on);

  /* ── the seam scenes ────────────────────────────────────────
     story.js paints `data-scene` per chapter and cross-fades.
     Inside the archive there is no .chapter, so without this the
     picker would keep the previous story scene alive behind the
     music. `void` is story's own quiet, near-empty backdrop, so
     reusing it keeps the handoff feeling like one continuous
     broadcast rather than a hard cut. */
  stage.dataset.scene = "void";

  /* ── visibility ─────────────────────────────────────────────
     One observer, one class. The class is what dims story's
     #scene/.crt (see story-music.css) and what story.js reads
     to skip painting. rootMargin gives a little lead so the swap
     happens just before the archive arrives rather than after. */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) setLive(e.isIntersecting);
    }, { threshold: 0, rootMargin: "12% 0px 12% 0px" });
    io.observe(stage);
  } else {
    setLive(true);
  }

  /* ── deep links ─────────────────────────────────────────────
     story.html's ch06 links into the archive. Honour it on load
     the same way the page honours #c1 etc., without stealing a
     scroll from someone who just arrived at the top. */
  if (location.hash === "#music") {
    requestAnimationFrame(() => {
      stage.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();