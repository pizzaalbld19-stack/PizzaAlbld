(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loader = document.getElementById("siteLoader");

  document.body.classList.add("loading");

  const revealPage = () => {
    document.body.classList.remove("loading");
    document.body.classList.add("page-ready");
    if (loader) loader.classList.add("is-hidden");
  };

  if (prefersReducedMotion) {
    revealPage();
  } else {
    window.addEventListener("load", () => {
      window.setTimeout(revealPage, 4550);
    });
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
