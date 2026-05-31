(function () {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    const lightboxImage = lightbox.querySelector("img");
    const close = lightbox.querySelector(".lightbox-close");

    document.querySelectorAll("[data-lightbox]").forEach((item) => {
      item.addEventListener("click", () => {
        const src = item.getAttribute("data-lightbox");
        const alt = item.querySelector("img")?.alt || "";
      lightboxImage.src = src;
        lightboxImage.alt = alt;
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.removeAttribute("src");
    };

    close.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
    });
  }
})();
