/* AURA 2026 — polished interactions + curated video placement */

(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  const onScroll = () => {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 16);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Sport filters */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".sport-card");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const tags = (card.dataset.tags || "").split(/\s+/);
        const show = filter === "all" || tags.includes(filter);
        card.classList.toggle("hidden", !show);
        if (!show) {
          const v = card.querySelector("video");
          if (v) {
            v.pause();
            v.classList.remove("is-playing");
          }
        }
      });
    });
  });

  /* Reveal */
  const reveals = document.querySelectorAll(".reveal");
  if (prefersReduced) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 6) * 0.04}s`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  /* ---- Video system ----
     - Hero: one muted loop
     - About cinema: play only when in view (max ~2)
     - Film side cards: play when in view
     - Sport cards: only ONE active at a time (most visible)
     - Feature player: user-controlled (has controls)
  */

  function loadVideo(video) {
    const src = video.getAttribute("data-src") || video.getAttribute("src");
    if (!src) return Promise.resolve(false);
    if (video.dataset.loaded === "1") return Promise.resolve(true);

    return new Promise((resolve) => {
      const done = (ok) => {
        if (ok) {
          video.dataset.loaded = "1";
          video.classList.add("is-ready");
        }
        resolve(ok);
      };
      video.muted = true;
      video.playsInline = true;
      video.addEventListener("loadeddata", () => done(true), { once: true });
      video.addEventListener("error", () => done(false), { once: true });
      if (!video.getAttribute("src") || video.getAttribute("data-src")) {
        video.src = video.getAttribute("data-src") || src;
      }
      // already has src attribute (feature player)
      if (video.readyState >= 2) done(true);
    });
  }

  async function playVideo(video) {
    if (prefersReduced) return;
    const ok = await loadVideo(video);
    if (!ok) return;
    try {
      await video.play();
      video.classList.add("is-playing");
    } catch (_) {}
  }

  function pauseVideo(video) {
    video.pause();
    video.classList.remove("is-playing");
  }

  // Hero — src is inline for faster start; force play ASAP
  const heroVid = document.querySelector(".hero-bg-video");
  if (heroVid) {
    heroVid.muted = true;
    heroVid.playsInline = true;
    heroVid.classList.add("is-on", "is-ready");
    const kick = () => heroVid.play().catch(() => {});
    if (heroVid.readyState >= 2) kick();
    else heroVid.addEventListener("loadeddata", kick, { once: true });
    heroVid.addEventListener("canplay", kick, { once: true });
  }

  // Side film cards + about cinema — in-view play
  const ambientVideos = [
    ...document.querySelectorAll(".film-side-media video[data-src]"),
    ...document.querySelectorAll(".cinema-frame video[data-src]"),
  ];

  if ("IntersectionObserver" in window) {
    const ambientIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
            playVideo(v);
          } else {
            pauseVideo(v);
          }
        });
      },
      { threshold: [0, 0.35, 0.6] }
    );
    ambientVideos.forEach((v) => ambientIo.observe(v));
  }

  // Sport cards — single active (most visible)
  const sportVideos = [...document.querySelectorAll(".sport-media video[data-src]")];
  let activeSport = null;

  function setActiveSport(video) {
    if (activeSport && activeSport !== video) pauseVideo(activeSport);
    activeSport = video;
    if (video) playVideo(video);
  }

  if ("IntersectionObserver" in window && sportVideos.length) {
    const ratios = new Map();
    const sportIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        let best = null;
        let bestR = 0.4;
        ratios.forEach((r, v) => {
          if (r > bestR) {
            bestR = r;
            best = v;
          }
        });
        setActiveSport(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sportVideos.forEach((v) => sportIo.observe(v));
  }

  // Hover boost for sport cards
  document.querySelectorAll(".sport-card").forEach((card) => {
    const v = card.querySelector("video[data-src]");
    if (!v) return;
    card.addEventListener("mouseenter", () => setActiveSport(v));
  });

  /* Smooth anchors */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if (!prefersReduced) {
    const heroImg = document.querySelector(".hero-bg-img");
    if (heroImg) {
      window.addEventListener(
        "scroll",
        () => {
          const y = window.scrollY;
          if (y > window.innerHeight) return;
          heroImg.style.transform = `scale(1.06) translate3d(0, ${y * 0.12}px, 0)`;
        },
        { passive: true }
      );
    }
  }
})();
