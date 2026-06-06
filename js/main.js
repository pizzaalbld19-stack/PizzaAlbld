(function () {
  const site = window.PIZZA_BALAD_SITE || {};
  const menu = Array.isArray(window.PIZZA_BALAD_MENU) ? window.PIZZA_BALAD_MENU : [];
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const formatPrice = (price) => `${price} ₪`;

  const FALLBACK_IMAGE = "assets/logo-transparent.png";
  const ALLOWED_EXTERNAL_HOSTS = new Set([
    "instagram.com",
    "www.instagram.com",
    "wa.me",
    "api.whatsapp.com",
    "www.whatsapp.com",
    "maps.app.goo.gl",
    "waze.com",
    "www.waze.com",
    "www.google.com",
    "maps.google.com",
    "oh-tech.co",
    "www.oh-tech.co"
  ]);

  const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

  const safeExternalUrl = (value) => {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol !== "https:") return "";
      if (!ALLOWED_EXTERNAL_HOSTS.has(url.hostname)) return "";
      return url.href;
    } catch (error) {
      return "";
    }
  };

  const safeTelHref = (value) => {
    const digits = digitsOnly(value);
    return digits.length >= 7 && digits.length <= 15 ? `tel:${digits}` : "";
  };

  const safeWhatsAppHref = (value) => {
    const digits = digitsOnly(value);
    return digits.length >= 7 && digits.length <= 15 ? `https://api.whatsapp.com/send?phone=${digits}&type=phone_number&app_absent=0` : "";
  };

  const safeWhatsAppAppHref = (value) => {
    const digits = digitsOnly(value);
    return digits.length >= 7 && digits.length <= 15 ? `whatsapp://send?phone=${digits}` : "";
  };

  const safeLocalAsset = (value, fallback = FALLBACK_IMAGE) => {
    const path = String(value || "").trim().replace(/\\/g, "/");
    if (!/^(assets|photos|video)\/[A-Za-z0-9\u0600-\u06FF\u0590-\u05FF _.\-()]+$/u.test(path)) return fallback;
    if (/(^|\/)\.\.(\/|$)/.test(path)) return fallback;
    if (!/\.(png|jpe?g|webp|gif|svg|mp4)$/i.test(path)) return fallback;
    return path;
  };

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
      setHref("[data-site-phone-link]", safeTelHref(site.phone.tel));
      setText("[data-site-phone]", site.phone.display);
    }

    if (site.phone?.whatsapp) {
      setHref("[data-site-whatsapp]", safeWhatsAppHref(site.phone.whatsapp));
    }

    if (site.instagram) {
      setHref("[data-site-instagram]", safeExternalUrl(site.instagram.url));
      setText("[data-site-instagram-handle]", site.instagram.handle);
    }

    if (site.location) {
      setText("[data-site-location]", site.location.display);
      setHref("[data-site-map-link]", safeExternalUrl(site.location.mapUrl));
      setHref("[data-site-waze-link]", safeExternalUrl(site.location.wazeUrl));
      document.querySelectorAll("[data-site-map-embed]").forEach((frame) => {
        const safeEmbed = safeExternalUrl(site.location.embedUrl);
        if (safeEmbed) frame.src = safeEmbed;
      });
    }

    if (site.hours) {
      setText("[data-site-hours]", site.hours.display);
      setText("[data-site-closed]", site.hours.closed);
      setText("[data-site-notice]", site.hours.notice);
    }
  };

  const enhanceWhatsAppLinks = () => {
    const appHref = safeWhatsAppAppHref(site.phone?.whatsapp);
    if (!appHref) return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (!isMobile) return;

    document.querySelectorAll("[data-site-whatsapp]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const fallbackHref = safeWhatsAppHref(site.phone?.whatsapp);
        if (!fallbackHref) return;
        event.preventDefault();
        window.location.href = appHref;
        window.setTimeout(() => {
          window.location.href = fallbackHref;
        }, 900);
      });
    });
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
        image.src = safeLocalAsset(product.image);
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
  enhanceWhatsAppLinks();
  applyFeaturedProducts();
  updateSchema();

  const sideActions = document.querySelector(".side-actions");
  if (sideActions) {
    const mobileActionsQuery = window.matchMedia("(max-width: 640px)");
    const toggleSideActions = () => {
      const shouldShow = !mobileActionsQuery.matches || window.scrollY > 220;
      sideActions.classList.toggle("is-visible", shouldShow);
    };

    toggleSideActions();
    window.addEventListener("scroll", toggleSideActions, { passive: true });
    mobileActionsQuery.addEventListener("change", toggleSideActions);
  }

  document.querySelectorAll("[data-scroll-top]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.scrollTo?.({ top: 0, behavior: "smooth" });
      document.body.scrollTo?.({ top: 0, behavior: "smooth" });
    });
  });

  const siteAudio = document.getElementById("siteAudio");
  const audioToggle = document.querySelector("[data-audio-toggle]");
  if (siteAudio && audioToggle) {
    const AUDIO_PREF_KEY = "pizzaBaladAudioEnabled";
    siteAudio.volume = 0.42;

    const setAudioState = (isPlaying) => {
      audioToggle.setAttribute("aria-pressed", isPlaying ? "true" : "false");
      audioToggle.setAttribute("aria-label", isPlaying ? "إيقاف الأنشودة" : "تشغيل الأنشودة");
    };

    const playAudio = async () => {
      try {
        await siteAudio.play();
        setAudioState(true);
        localStorage.setItem(AUDIO_PREF_KEY, "1");
      } catch (error) {
        setAudioState(false);
      }
    };

    const pauseAudio = () => {
      siteAudio.pause();
      setAudioState(false);
      localStorage.setItem(AUDIO_PREF_KEY, "0");
    };

    audioToggle.addEventListener("click", () => {
      if (siteAudio.paused) {
        playAudio();
      } else {
        pauseAudio();
      }
    });

    siteAudio.addEventListener("pause", () => setAudioState(false));
    siteAudio.addEventListener("play", () => setAudioState(true));

    if (localStorage.getItem(AUDIO_PREF_KEY) === "1") {
      const resumeAfterInteraction = () => {
        playAudio();
        document.removeEventListener("pointerdown", resumeAfterInteraction);
        document.removeEventListener("keydown", resumeAfterInteraction);
      };
      document.addEventListener("pointerdown", resumeAfterInteraction, { once: true });
      document.addEventListener("keydown", resumeAfterInteraction, { once: true });
    }
  }

  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    const lightboxImage = lightbox.querySelector("img");
    const close = lightbox.querySelector(".lightbox-close");

    document.querySelectorAll("[data-lightbox]").forEach((item) => {
      item.addEventListener("click", () => {
        const src = safeLocalAsset(item.getAttribute("data-lightbox"), "");
        if (!src) return;
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
