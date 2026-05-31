(function () {
  const site = window.PIZZA_BALAD_SITE || {};
  const menu = Array.isArray(window.PIZZA_BALAD_MENU) ? window.PIZZA_BALAD_MENU : [];
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const formatPrice = (price) => `${price} ₪`;

  const setText = (selector, value) => {
    if (value == null) return;
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const setHref = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach((element) => {
      element.href = value;
    });
  };

  const applySiteData = () => {
    if (site.phone) {
      setHref("[data-site-phone-link]", `tel:${site.phone.tel}`);
      setText("[data-site-phone]", site.phone.display);
    }

    if (site.phone?.whatsapp) {
      setHref("[data-site-whatsapp]", `https://wa.me/${site.phone.whatsapp}`);
    }

    if (site.instagram) {
      setHref("[data-site-instagram]", site.instagram.url);
      setText("[data-site-instagram-handle]", site.instagram.handle);
    }

    if (site.location) {
      setText("[data-site-location]", site.location.display);
      setHref("[data-site-map-link]", site.location.mapUrl);
      document.querySelectorAll("[data-site-map-embed]").forEach((frame) => {
        frame.src = site.location.embedUrl;
      });
    }

    if (site.hours) {
      setText("[data-site-hours]", site.hours.display);
      setText("[data-site-closed]", site.hours.closed);
      setText("[data-site-notice]", site.hours.notice);
    }
  };

  const applyFeaturedProducts = () => {
    document.querySelectorAll("[data-featured-id]").forEach((card) => {
      const product = menu.find((item) => item.id === Number(card.dataset.featuredId));
      if (!product) return;

      const image = card.querySelector("img");
      const title = card.querySelector("h3");
      const description = card.querySelector("p");
      const price = card.querySelector("strong");

      if (image) {
        image.src = product.image;
        image.alt = product.name;
      }
      if (title) title.textContent = product.name;
      if (description) description.textContent = product.description;
      if (price) price.textContent = formatPrice(product.price);
    });
  };

  const updateSchema = () => {
    const schema = document.querySelector('script[type="application/ld+json"]');
    if (!schema) return;

    try {
      const data = JSON.parse(schema.textContent);
      if (site.name) data.name = site.name;
      if (site.phone?.display) data.telephone = site.phone.display;
      if (site.location) {
        data.address = {
          "@type": "PostalAddress",
          "streetAddress": site.location.display,
          "addressLocality": site.location.display
        };
        data.geo = {
          "@type": "GeoCoordinates",
          "latitude": site.location.latitude,
          "longitude": site.location.longitude
        };
      }
      if (site.hours?.schema) data.openingHours = site.hours.schema;
      schema.textContent = JSON.stringify(data);
    } catch (error) {
      console.warn("Could not update restaurant schema", error);
    }
  };

  applySiteData();
  applyFeaturedProducts();
  updateSchema();

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
