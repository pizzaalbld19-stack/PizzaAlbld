(function () {
  const STORAGE_KEY = "pizzaBaladAccessibility";
  const root = document.documentElement;
  const main = document.querySelector("main");
  const settings = [
    { key: "largeText", className: "a11y-large-text", label: "تكبير النص" },
    { key: "highContrast", className: "a11y-high-contrast", label: "تباين عالٍ" },
    { key: "reduceMotion", className: "a11y-reduce-motion", label: "تقليل الحركة" },
    { key: "underlineLinks", className: "a11y-link-underline", label: "تمييز الروابط" },
    { key: "readableFont", className: "a11y-readable-font", label: "خط أوضح" }
  ];

  const state = settings.reduce((acc, item) => ({ ...acc, [item.key]: false }), {});

  const readState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      settings.forEach((item) => {
        state[item.key] = Boolean(parsed[item.key]);
      });
    } catch (error) {
      /* Ignore blocked or invalid localStorage. */
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      /* Ignore blocked localStorage. */
    }
  };

  const applyState = () => {
    settings.forEach((item) => {
      root.classList.toggle(item.className, state[item.key]);
    });
    document.querySelectorAll("video").forEach((video) => {
      if (state.reduceMotion) {
        video.pause();
      } else if (video.autoplay) {
        video.play().catch(() => {});
      }
    });
    document.querySelectorAll("[data-a11y-option]").forEach((button) => {
      const key = button.getAttribute("data-a11y-option");
      button.setAttribute("aria-pressed", state[key] ? "true" : "false");
    });
  };

  const createText = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };

  const createIcon = () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", "4");
    circle.setAttribute("r", "2");

    const pathOne = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathOne.setAttribute("d", "M10 8h4l1 12");

    const pathTwo = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathTwo.setAttribute("d", "M9 20l1-8");

    const pathThree = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathThree.setAttribute("d", "M15 20l-1-8");

    const pathFour = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathFour.setAttribute("d", "M5 9h14");

    svg.append(circle, pathOne, pathTwo, pathThree, pathFour);
    return svg;
  };

  const ensureMainTarget = () => {
    if (!main) return;
    if (!main.id) main.id = "main-content";
    main.setAttribute("tabindex", "-1");
  };

  const createSkipLink = () => {
    if (!main) return;
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = `#${main.id}`;
    skip.textContent = "تخطي إلى المحتوى";
    skip.addEventListener("click", () => {
      window.setTimeout(() => main.focus({ preventScroll: true }), 0);
    });
    document.body.prepend(skip);
  };

  const createWidget = () => {
    const widget = document.createElement("section");
    widget.className = "a11y-widget";
    widget.setAttribute("aria-label", "إعدادات إمكانية الوصول");

    const toggle = document.createElement("button");
    toggle.className = "a11y-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "فتح إعدادات إمكانية الوصول");
    toggle.setAttribute("aria-expanded", "false");
    toggle.appendChild(createIcon());

    const panel = document.createElement("div");
    panel.className = "a11y-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "a11y-title");

    const title = createText("h2", "إمكانية الوصول");
    title.id = "a11y-title";
    const help = createText("p", "اختر ما يناسبك لتحسين القراءة والتنقل داخل الموقع.");
    const options = document.createElement("div");
    options.className = "a11y-options";

    settings.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "a11y-option";
      button.setAttribute("data-a11y-option", item.key);
      button.setAttribute("aria-pressed", "false");

      const label = createText("span", item.label);
      const switcher = document.createElement("span");
      switcher.className = "a11y-switch";
      switcher.setAttribute("aria-hidden", "true");

      button.append(label, switcher);
      button.addEventListener("click", () => {
        state[item.key] = !state[item.key];
        applyState();
        saveState();
      });
      options.appendChild(button);
    });

    panel.append(title, help, options);
    widget.append(toggle, panel);
    document.body.appendChild(widget);

    const setOpen = (open) => {
      widget.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "إغلاق إعدادات إمكانية الوصول" : "فتح إعدادات إمكانية الوصول");
    };

    toggle.addEventListener("click", () => {
      setOpen(!widget.classList.contains("is-open"));
    });

    document.addEventListener("click", (event) => {
      if (!widget.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  };

  ensureMainTarget();
  readState();
  createSkipLink();
  createWidget();
  applyState();
})();
