(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loader = document.getElementById("siteLoader");
  const progressBar = document.getElementById("loaderProgressBar");
  const progressText = document.getElementById("loaderPercent");
  let pageRevealed = false;

  document.body.classList.add("loading");

  const setProgress = (value) => {
    const progress = Math.max(0, Math.min(100, Math.round(value)));
    if (progressBar) progressBar.style.setProperty("--loader-progress", `${progress}%`);
    if (progressText) progressText.textContent = `${progress}%`;
  };

  const revealPage = () => {
    if (pageRevealed) return;
    pageRevealed = true;
    setProgress(100);
    document.body.classList.remove("loading");
    document.body.classList.add("page-ready");
    if (loader) {
      loader.classList.add("is-hidden");
      window.setTimeout(() => {
        loader.style.display = "none";
      }, 800);
    }
  };

  const startProgress = () => {
    const duration = 4300;
    const startedAt = performance.now();

    const tick = (now) => {
      if (pageRevealed) return;
      const elapsed = now - startedAt;
      const linear = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - linear, 3);
      setProgress(eased * 100);

      if (linear >= 1) {
        window.setTimeout(revealPage, 180);
      } else {
        window.requestAnimationFrame(tick);
      }
    };

    window.requestAnimationFrame(tick);
  };

  if (prefersReducedMotion) {
    revealPage();
  } else {
    window.addEventListener("load", startProgress);
    // السماح بتخطّي شاشة التحميل بالنقر/اللمس أو بمفتاح الإدخال
    if (loader) {
      loader.addEventListener("click", revealPage);
      loader.setAttribute("role", "button");
      loader.setAttribute("tabindex", "0");
      loader.setAttribute("title", "اضغط للتخطّي");
      loader.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") revealPage();
      });
    }
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");

      const items = entry.target.querySelectorAll(".stagger-item");
      items.forEach((item, index) => {
        window.setTimeout(() => item.classList.add("is-visible"), index * 110);
      });

      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  document.querySelectorAll(".section-reveal").forEach((section) => revealObserver.observe(section));

  const parallaxItems = document.querySelectorAll(".parallax-item");
  let ticking = false;

  const updateParallax = () => {
    if (prefersReducedMotion) return;
    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      item.style.transform = `translate3d(0, ${progress * -18}px, 0)`;
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  updateParallax();
})();
