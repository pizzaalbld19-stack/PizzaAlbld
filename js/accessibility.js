(function () {
  const STORAGE_KEY = "pizzaBaladAccessibilityV2";
  const root = document.documentElement;
  const main = document.querySelector("main");

  const translations = {
    ar: {
      widget: "إعدادات إمكانية الوصول",
      open: "فتح إعدادات إمكانية الوصول",
      close: "إغلاق إعدادات إمكانية الوصول",
      title: "أدوات إمكانية الوصول",
      help: "قم بتخصيص تجربتك لتناسب احتياجاتك",
      skip: "تخطي إلى المحتوى",
      textSize: "حجم النص",
      decrease: "تصغير النص",
      increase: "تكبير النص",
      colors: "أوضاع الألوان",
      grayscale: "تدرج رمادي",
      invertColors: "عكس الألوان",
      lowSaturation: "تشبع منخفض",
      colorFilter: "فلتر عمى الألوان",
      none: "لا شيء",
      red: "أحمر",
      redGreen: "أحمر-أخضر",
      blueYellow: "أزرق-أصفر",
      visual: "خيارات بصرية",
      highContrast: "تباين عالٍ",
      largeText: "نص كبير",
      highlightLinks: "تسليط الضوء على الروابط",
      underlineLinks: "تسطير الروابط",
      hideImages: "إخفاء الصور",
      textOptions: "خيارات النص",
      readableFont: "خط قابل للقراءة",
      lineSpacing: "زيادة المسافة بين الأسطر",
      letterSpacing: "مسافة بين الحروف",
      alignLeft: "محاذاة النص لليسار",
      navigation: "خيارات التنقل",
      largeCursor: "مؤشر كبير",
      reduceMotion: "تقليل الحركة",
      stopAnimations: "إيقاف الرسوم المتحركة",
      reset: "إعادة تعيين إلى الافتراضي"
    },
    he: {
      widget: "הגדרות נגישות",
      open: "פתיחת הגדרות נגישות",
      close: "סגירת הגדרות נגישות",
      title: "כלי נגישות",
      help: "התאימו את חוויית הגלישה לצרכים שלכם",
      skip: "דילוג לתוכן",
      textSize: "גודל טקסט",
      decrease: "הקטנת טקסט",
      increase: "הגדלת טקסט",
      colors: "מצבי צבע",
      grayscale: "גווני אפור",
      invertColors: "היפוך צבעים",
      lowSaturation: "רוויה נמוכה",
      colorFilter: "מסנן עיוורון צבעים",
      none: "ללא",
      red: "אדום",
      redGreen: "אדום-ירוק",
      blueYellow: "כחול-צהוב",
      visual: "אפשרויות חזותיות",
      highContrast: "ניגודיות גבוהה",
      largeText: "טקסט גדול",
      highlightLinks: "הדגשת קישורים",
      underlineLinks: "קו תחתון לקישורים",
      hideImages: "הסתרת תמונות",
      textOptions: "אפשרויות טקסט",
      readableFont: "גופן קריא",
      lineSpacing: "ריווח בין שורות",
      letterSpacing: "ריווח בין אותיות",
      alignLeft: "יישור טקסט לשמאל",
      navigation: "אפשרויות ניווט",
      largeCursor: "סמן גדול",
      reduceMotion: "הפחתת תנועה",
      stopAnimations: "עצירת אנימציות",
      reset: "איפוס לברירת מחדל"
    },
    en: {
      widget: "Accessibility settings",
      open: "Open accessibility settings",
      close: "Close accessibility settings",
      title: "Accessibility tools",
      help: "Customize your browsing experience to suit your needs",
      skip: "Skip to content",
      textSize: "Text size",
      decrease: "Decrease text size",
      increase: "Increase text size",
      colors: "Color modes",
      grayscale: "Grayscale",
      invertColors: "Invert colors",
      lowSaturation: "Low saturation",
      colorFilter: "Color blindness filter",
      none: "None",
      red: "Red",
      redGreen: "Red-green",
      blueYellow: "Blue-yellow",
      visual: "Visual options",
      highContrast: "High contrast",
      largeText: "Large text",
      highlightLinks: "Highlight links",
      underlineLinks: "Underline links",
      hideImages: "Hide images",
      textOptions: "Text options",
      readableFont: "Readable font",
      lineSpacing: "Increase line spacing",
      letterSpacing: "Letter spacing",
      alignLeft: "Align text left",
      navigation: "Navigation options",
      largeCursor: "Large cursor",
      reduceMotion: "Reduce motion",
      stopAnimations: "Stop animations",
      reset: "Reset to default"
    }
  };

  const toggles = [
    "grayscale", "invertColors", "lowSaturation", "highContrast", "largeText",
    "highlightLinks", "underlineLinks", "hideImages", "readableFont",
    "lineSpacing", "letterSpacing", "alignLeft", "largeCursor",
    "reduceMotion", "stopAnimations"
  ];
  const exclusiveColorModes = ["grayscale", "invertColors", "lowSaturation"];

  const state = {
    textScale: 100,
    colorFilter: "none"
  };
  toggles.forEach((key) => { state[key] = false; });

  const getLanguage = () => {
    const language = String(root.lang || navigator.language || "ar").toLowerCase();
    if (language.startsWith("he")) return "he";
    if (language.startsWith("en")) return "en";
    return "ar";
  };

  const t = (key) => translations[getLanguage()][key] || translations.en[key] || key;

  const readState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      toggles.forEach((key) => { state[key] = Boolean(saved[key]); });
      state.textScale = Math.min(150, Math.max(80, Number(saved.textScale) || 100));
      state.colorFilter = ["none", "red", "redGreen", "blueYellow"].includes(saved.colorFilter)
        ? saved.colorFilter
        : "none";
    } catch (error) {
      /* localStorage may be unavailable. */
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      /* localStorage may be unavailable. */
    }
  };

  const syncVideos = () => {
    document.querySelectorAll("video").forEach((video) => {
      if (state.reduceMotion || state.stopAnimations) {
        video.pause();
      } else if (video.autoplay) {
        video.play().catch(() => {});
      }
    });
  };

  const applyState = () => {
    toggles.forEach((key) => {
      root.classList.toggle(`a11y-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, state[key]);
    });
    root.dataset.a11yColorFilter = state.colorFilter;
    root.style.setProperty("--a11y-text-scale", String(state.textScale / 100));
    document.querySelectorAll("[data-a11y-option]").forEach((button) => {
      const key = button.dataset.a11yOption;
      button.setAttribute("aria-pressed", state[key] ? "true" : "false");
    });
    document.querySelectorAll("[data-a11y-filter]").forEach((button) => {
      const active = button.dataset.a11yFilter === state.colorFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const value = document.querySelector("[data-a11y-text-value]");
    if (value) value.textContent = `${state.textScale}%`;
    syncVideos();
  };

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
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
    ["M10 8h4l1 12", "M9 20l1-8", "M15 20l-1-8", "M5 9h14"].forEach((pathData) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      svg.appendChild(path);
    });
    svg.prepend(circle);
    return svg;
  };

  const createSection = (titleKey) => {
    const section = make("section", "a11y-section");
    section.appendChild(make("h3", "a11y-section-title", t(titleKey)));
    return section;
  };

  const createToggle = (key, labelKey) => {
    const button = make("button", "a11y-option");
    button.type = "button";
    button.dataset.a11yOption = key;
    button.setAttribute("aria-pressed", "false");
    const label = make("span", "a11y-option-label", t(labelKey));
    label.dataset.a11yText = labelKey;
    const switcher = make("span", "a11y-switch");
    switcher.setAttribute("aria-hidden", "true");
    button.append(label, switcher);
    button.addEventListener("click", () => {
      const nextValue = !state[key];
      if (nextValue && exclusiveColorModes.includes(key)) {
        exclusiveColorModes.forEach((mode) => { state[mode] = false; });
      }
      state[key] = nextValue;
      applyState();
      saveState();
    });
    return button;
  };

  const ensureMainTarget = () => {
    if (!main) return;
    if (!main.id) main.id = "main-content";
    main.setAttribute("tabindex", "-1");
  };

  const createSkipLink = () => {
    if (!main) return;
    const skip = make("a", "skip-link", t("skip"));
    skip.dataset.a11yText = "skip";
    skip.href = `#${main.id}`;
    skip.addEventListener("click", () => {
      window.setTimeout(() => main.focus({ preventScroll: true }), 0);
    });
    document.body.prepend(skip);
  };

  const createWidget = () => {
    const widget = make("section", "a11y-widget");
    widget.setAttribute("aria-label", t("widget"));

    const toggle = make("button", "a11y-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-label", t("open"));
    toggle.setAttribute("aria-expanded", "false");
    toggle.appendChild(createIcon());

    const panel = make("div", "a11y-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "a11y-title");

    const header = make("header", "a11y-panel-header");
    const headingBox = make("div", "a11y-heading");
    const title = make("h2", "", t("title"));
    title.id = "a11y-title";
    title.dataset.a11yText = "title";
    const help = make("p", "", t("help"));
    help.dataset.a11yText = "help";
    headingBox.append(title, help);
    const close = make("button", "a11y-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", t("close"));
    header.append(headingBox, close);

    const body = make("div", "a11y-panel-body");

    const textSize = createSection("textSize");
    const textControls = make("div", "a11y-text-controls");
    const decrease = make("button", "a11y-size-button", "−");
    decrease.type = "button";
    decrease.setAttribute("aria-label", t("decrease"));
    const value = make("strong", "a11y-size-value", "100%");
    value.dataset.a11yTextValue = "";
    const increase = make("button", "a11y-size-button", "+");
    increase.type = "button";
    increase.setAttribute("aria-label", t("increase"));
    decrease.addEventListener("click", () => {
      state.textScale = Math.max(80, state.textScale - 10);
      applyState();
      saveState();
    });
    increase.addEventListener("click", () => {
      state.textScale = Math.min(150, state.textScale + 10);
      applyState();
      saveState();
    });
    textControls.append(decrease, value, increase);
    textSize.appendChild(textControls);

    const colors = createSection("colors");
    const colorOptions = make("div", "a11y-options");
    colorOptions.append(
      createToggle("grayscale", "grayscale"),
      createToggle("invertColors", "invertColors"),
      createToggle("lowSaturation", "lowSaturation")
    );
    const filterTitle = make("h4", "a11y-subtitle", t("colorFilter"));
    filterTitle.dataset.a11yText = "colorFilter";
    const filterGrid = make("div", "a11y-filter-grid");
    [
      ["none", "none"], ["red", "red"],
      ["redGreen", "redGreen"], ["blueYellow", "blueYellow"]
    ].forEach(([filter, labelKey]) => {
      const button = make("button", "a11y-filter-button", t(labelKey));
      button.type = "button";
      button.dataset.a11yFilter = filter;
      button.dataset.a11yText = labelKey;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        state.colorFilter = filter;
        applyState();
        saveState();
      });
      filterGrid.appendChild(button);
    });
    colors.append(colorOptions, filterTitle, filterGrid);

    const visual = createSection("visual");
    const visualOptions = make("div", "a11y-options");
    visualOptions.append(
      createToggle("highContrast", "highContrast"),
      createToggle("largeText", "largeText"),
      createToggle("highlightLinks", "highlightLinks"),
      createToggle("underlineLinks", "underlineLinks"),
      createToggle("hideImages", "hideImages")
    );
    visual.appendChild(visualOptions);

    const text = createSection("textOptions");
    const textOptions = make("div", "a11y-options");
    textOptions.append(
      createToggle("readableFont", "readableFont"),
      createToggle("lineSpacing", "lineSpacing"),
      createToggle("letterSpacing", "letterSpacing"),
      createToggle("alignLeft", "alignLeft")
    );
    text.appendChild(textOptions);

    const navigation = createSection("navigation");
    const navigationOptions = make("div", "a11y-options");
    navigationOptions.append(
      createToggle("largeCursor", "largeCursor"),
      createToggle("reduceMotion", "reduceMotion"),
      createToggle("stopAnimations", "stopAnimations")
    );
    navigation.appendChild(navigationOptions);

    const reset = make("button", "a11y-reset", t("reset"));
    reset.type = "button";
    reset.dataset.a11yText = "reset";
    reset.addEventListener("click", () => {
      toggles.forEach((key) => { state[key] = false; });
      state.textScale = 100;
      state.colorFilter = "none";
      applyState();
      saveState();
    });

    body.append(textSize, colors, visual, text, navigation, reset);
    panel.append(header, body);
    widget.append(toggle, panel);
    document.body.appendChild(widget);

    const setOpen = (open) => {
      widget.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", t(open ? "close" : "open"));
      if (open) panel.scrollTop = 0;
    };

    toggle.addEventListener("click", () => setOpen(!widget.classList.contains("is-open")));
    close.addEventListener("click", () => setOpen(false));
    document.addEventListener("click", (event) => {
      if (!widget.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });

    const updateLanguage = () => {
      const language = getLanguage();
      panel.dir = language === "en" ? "ltr" : "rtl";
      widget.setAttribute("aria-label", t("widget"));
      toggle.setAttribute("aria-label", t(widget.classList.contains("is-open") ? "close" : "open"));
      close.setAttribute("aria-label", t("close"));
      decrease.setAttribute("aria-label", t("decrease"));
      increase.setAttribute("aria-label", t("increase"));
      document.querySelectorAll("[data-a11y-text]").forEach((element) => {
        element.textContent = t(element.dataset.a11yText);
      });
      const sectionKeys = ["textSize", "colors", "visual", "textOptions", "navigation"];
      panel.querySelectorAll(".a11y-section-title").forEach((element, index) => {
        element.textContent = t(sectionKeys[index]);
      });
    };

    new MutationObserver(updateLanguage).observe(root, {
      attributes: true,
      attributeFilter: ["lang", "dir"]
    });
    window.addEventListener("languagechange", updateLanguage);
    updateLanguage();
  };

  ensureMainTarget();
  readState();
  createSkipLink();
  createWidget();
  applyState();
})();
