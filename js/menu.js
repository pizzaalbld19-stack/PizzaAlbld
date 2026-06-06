(function () {
  const site = window.PIZZA_BALAD_SITE || {};
  const menu = Array.isArray(window.PIZZA_BALAD_MENU) ? window.PIZZA_BALAD_MENU : [];
  const categories = ["الكل", "بيتسا", "باستا", "رڤيولي", "سلطات", "مشروبات"];
  const grid = document.getElementById("productsGrid");
  const tabs = document.getElementById("categoryTabs");
  const search = document.getElementById("menuSearch");
  const meta = document.getElementById("resultsMeta");
  const empty = document.getElementById("emptyState");
  const year = document.getElementById("year");
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const emptyCart = document.getElementById("emptyCart");
  const clearCart = document.getElementById("clearCart");
  const cartPanel = document.querySelector(".cart-panel");
  const cartToggle = document.getElementById("cartToggle");
  const cartClose = document.getElementById("cartClose");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartFloatCount = document.getElementById("cartFloatCount");
  const cartFloatTotal = document.getElementById("cartFloatTotal");
  const checkoutOrder = document.getElementById("checkoutOrder");
  const orderConfirmModal = document.getElementById("orderConfirmModal");
  const rejectOrderConfirm = document.getElementById("rejectOrderConfirm");
  const acceptOrderConfirm = document.getElementById("acceptOrderConfirm");
  const toastStack = document.getElementById("toastStack");
  const customizer = document.getElementById("customizer");
  const closeCustomizer = document.getElementById("closeCustomizer");
  const saveCartItem = document.getElementById("saveCartItem");
  const pizzaSplitModal = document.getElementById("pizzaSplitModal");
  const pizzaSplitClose = document.getElementById("pizzaSplitClose");
  const pizzaSplitContent = document.getElementById("pizzaSplitContent");

  const customizerImage = document.getElementById("customizerImage");
  const customizerCategory = document.getElementById("customizerCategory");
  const customizerTitle = document.getElementById("customizerTitle");
  const customizerDescription = document.getElementById("customizerDescription");
  const customizerPrice = document.getElementById("customizerPrice");
  const ingredientsOptions = document.getElementById("ingredientsOptions");
  const freeAddonOptions = document.getElementById("freeAddonOptions");
  const paidAddonOptions = document.getElementById("paidAddonOptions");
  const itemNotes = document.getElementById("itemNotes");
  const itemQty = document.getElementById("itemQty");
  const itemQtyMinus = document.getElementById("itemQtyMinus");
  const itemQtyPlus = document.getElementById("itemQtyPlus");

  const categoryCards = document.getElementById("categoryCards");
  const scrollToCats = document.getElementById("scrollToCats");
  const navMenu = document.getElementById("navMenu");
  const menuShell = document.querySelector(".menu-shell");
  const backToCats = document.getElementById("backToCats");
  const activeCategoryTitle = document.getElementById("activeCategoryTitle");

  const STORAGE_KEY = "pizzaBaladCart";
  const MAX_ITEM_QTY = 20;

  let activeCategory = "الكل";
  let query = "";
  let cart = [];
  let activeProduct = null;
  let editingCartId = null;
  let pizzaSplit = null;
  let pizzaSliceSheet = null;
  let customizerQty = 1;

  if (year) year.textContent = new Date().getFullYear();

  const formatPrice = (price) => `${price} ₪`;
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const toArray = (value) => Array.isArray(value) ? value : [];
  const uniqueValues = (values) => [...new Set(toArray(values).map((value) => String(value || "").trim()).filter(Boolean))];
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
  const FALLBACK_IMAGE = "assets/logo-transparent.png";
  const digitsOnly = (value) => String(value || "").replace(/\D/g, "");
  const safeTelHref = (value) => {
    const digits = digitsOnly(value);
    return digits.length >= 7 && digits.length <= 15 ? `tel:${digits}` : "";
  };
  const safeWhatsAppNumber = (value) => {
    const digits = digitsOnly(value);
    return digits.length >= 7 && digits.length <= 15 ? digits : "";
  };
  const safeLocalAsset = (value, fallback = FALLBACK_IMAGE) => {
    const path = String(value || "").trim().replace(/\\/g, "/");
    if (!/^(assets|photos|video)\/[A-Za-z0-9\u0600-\u06FF\u0590-\u05FF _.\-()]+$/u.test(path)) return fallback;
    if (/(^|\/)\.\.(\/|$)/.test(path)) return fallback;
    if (!/\.(png|jpe?g|webp|gif|svg|mp4)$/i.test(path)) return fallback;
    return path;
  };

  if (site.phone?.tel) {
    document.querySelectorAll("[data-site-phone-link]").forEach((link) => {
      const safeHref = safeTelHref(site.phone.tel);
      if (safeHref) link.href = safeHref;
    });
  }

  const newCartId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const getProduct = (id) => menu.find((product) => product.id === Number(id));
  const isProductAvailable = (product) => Number(product?.available ?? 1) === 1;
  const isPizzaProduct = (product) => normalize(product?.category) === normalize("بيتسا");

  const itemAddonTotal = (item) => {
    if (item.splitMode === "slices") return Number(item.sliceAddonsCost || 0);
    return toArray(item.paidAddons).reduce((sum, addon) => sum + Number(addon.price || 0), 0);
  };

  const itemTotal = (item) => {
    const product = getProduct(item.productId);
    if (!product) return 0;
    return (Number(product.price || 0) + itemAddonTotal(item)) * Number(item.qty || 1);
  };

  const productHasOptions = (product) => (
    toArray(product.ingredients).length > 0 ||
    toArray(product.freeAddons).length > 0 ||
    toArray(product.paidAddons).length > 0
  );

  /* ---------- حفظ السلة محليًا (تبقى بعد تحديث الصفحة) ---------- */
  const saveCart = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      /* قد يكون التخزين معطّلاً (وضع التصفح الخاص) — نتجاهل بهدوء */
    }
  };

  const loadCart = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // نُبقي فقط العناصر التي ما زال منتجها موجودًا في القائمة الحالية
      return parsed
        .filter((item) => {
          const product = item && getProduct(item.productId);
          return product && isProductAvailable(product);
        })
        .map((item) => ({
          cartId: item.cartId || newCartId(),
          productId: Number(item.productId),
          qty: Math.min(MAX_ITEM_QTY, Math.max(1, Number(item.qty || 1))),
          removedIngredients: toArray(item.removedIngredients),
          freeAddons: toArray(item.freeAddons),
          paidAddons: toArray(item.paidAddons).map((addon) => ({
            name: addon.name,
            price: Number(addon.price || 0)
          })),
          notes: typeof item.notes === "string" ? item.notes : "",
          splitMode: item.splitMode === "slices" ? "slices" : null,
          pizzaSplitMode: item.pizzaSplitMode || (item.splitMode === "slices" ? "slices" : null),
          doughType: item.doughType === "رقيق" ? "رقيق" : "عادي",
          sliceCount: Number(item.sliceCount || 0),
          pizzaSections: toArray(item.pizzaSections),
          pizzaAdditions: item.pizzaAdditions || null,
          additionsText: toArray(item.additionsText),
          sliceSummary: toArray(item.sliceSummary),
          sliceAddonsCost: Number(item.sliceAddonsCost || 0)
        }));
    } catch (error) {
      return [];
    }
  };

  /* ---------- نظام التنبيهات (بديل alert) ---------- */
  const showToast = (message, type = "success") => {
    if (!toastStack) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = message;
    toastStack.appendChild(toast);
    window.requestAnimationFrame(() => toast.classList.add("is-visible"));
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 320);
    }, 2600);
  };

  const pulseFloat = () => {
    if (!cartToggle) return;
    cartToggle.classList.remove("pulse");
    void cartToggle.offsetWidth; // إعادة تشغيل الأنيميشن
    cartToggle.classList.add("pulse");
  };

  const createChips = (items, emptyText) => {
    if (!toArray(items).length) return `<p class="muted-line">${escapeHTML(emptyText)}</p>`;
    return `<div class="chips">${items.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}</div>`;
  };

  const createProductCard = (product, index) => {
    const card = document.createElement("article");
    const available = isProductAvailable(product);
    card.className = `product-card product-row${available ? "" : " is-unavailable"}`;
    card.dataset.productId = product.id;
    card.tabIndex = available ? 0 : -1;
    card.setAttribute("role", "button");
    card.setAttribute("aria-disabled", available ? "false" : "true");
    card.style.animationDelay = `${Math.min(index * 45, 360)}ms`;
    const freeAddons = toArray(product.freeAddons);
    const paidAddons = toArray(product.paidAddons);
    const ingredients = toArray(product.ingredients);

    card.innerHTML = `
      <img src="${escapeHTML(safeLocalAsset(product.image))}" alt="${escapeHTML(product.name)}" loading="lazy" width="520" height="410">
      <div class="product-body">
        <span class="category-pill">${escapeHTML(product.category)}</span>
        <div class="product-top">
          <h2>${escapeHTML(product.name)}</h2>
          <span class="price">${escapeHTML(formatPrice(product.price))}</span>
        </div>
        ${available ? "" : `<span class="unavailable-badge">غير متاح حالياً</span>`}
        <p>${escapeHTML(product.description)}</p>
        <div class="product-options-preview">
          <strong>المكونات</strong>
          ${createChips(ingredients, "لا توجد مكونات قابلة للتعديل")}
          ${freeAddons.length ? `<strong>إضافات مجانية</strong>${createChips(freeAddons, "")}` : ""}
          ${paidAddons.length ? `<strong>إضافات مدفوعة</strong><div class="chips">${paidAddons.map((addon) => `<span>${escapeHTML(addon.name)} +${escapeHTML(formatPrice(addon.price))}</span>`).join("")}</div>` : ""}
        </div>
        <button class="add-cart-btn product-add" type="button" data-product-id="${product.id}" ${available ? "" : "disabled"}>
          ${available ? (productHasOptions(product) ? "اختيار وتعديل" : "إضافة للسلة") : "غير متاح"}
        </button>
      </div>
    `;

    return card;
  };

  const renderTabs = () => {
    const fragment = document.createDocumentFragment();
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = category;
      button.className = category === activeCategory ? "is-active" : "";
      button.setAttribute("aria-pressed", category === activeCategory ? "true" : "false");
      button.addEventListener("click", () => {
        activeCategory = category;
        renderTabs();
        renderProducts();
        // إبقاء الفئة المختارة ظاهرة داخل الشريط الأفقي على الهاتف
        button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
      fragment.appendChild(button);
    });
    tabs.replaceChildren(fragment);
  };

  const filterProducts = () => {
    const term = normalize(query);
    return menu.filter((product) => {
      const matchesCategory = activeCategory === "الكل" || product.category === activeCategory;
      const searchTarget = normalize([
        product.name,
        product.description,
        product.category,
        ...toArray(product.ingredients),
        ...toArray(product.freeAddons),
        ...toArray(product.paidAddons).map((addon) => addon.name)
      ].join(" "));
      return matchesCategory && searchTarget.includes(term);
    });
  };

  const renderProducts = () => {
    const products = filterProducts();
    const fragment = document.createDocumentFragment();
    products.forEach((product, index) => fragment.appendChild(createProductCard(product, index)));
    grid.replaceChildren(fragment);
    empty.hidden = products.length > 0;
    meta.textContent = `تم عرض ${products.length} من ${menu.length} منتج`;
  };

  /* ---------- بطاقات الفئات (شاشة اختيار الفئة بأسلوب التطبيق) ---------- */
  const categoryMeta = {
    "بيتسا": "بيتسا طازجة من الفرن بعجينة مخمّرة",
    "باستا": "باستا إيطالية بصوصات كريمية غنية",
    "رڤيولي": "رڤيولي محشو يقدّم ساخناً بصوص غني",
    "سلطات": "سلطات منعشة بخضار ومكوّنات طازجة",
    "مشروبات": "مشروبات باردة تكمل وجبتك"
  };

  const categoryImage = (category) => {
    const product = menu.find((item) => item.category === category);
    return product ? safeLocalAsset(product.image) : FALLBACK_IMAGE;
  };

  const CC_SLICE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c4.4 0 8.3 2.4 9 5.8L12 21 3 8.8C3.7 5.4 7.6 3 12 3Z"/><circle cx="9.5" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="13.5" cy="10.5" r="1" fill="currentColor" stroke="none"/></svg>`;
  const CC_CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>`;

  /* التنقّل بين شاشة الفئات وشاشة منتجات الفئة (Drill-down) */
  const showCategories = () => {
    if (menuShell) menuShell.dataset.view = "categories";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showProducts = (category) => {
    activeCategory = category;
    renderTabs();
    renderProducts();
    if (activeCategoryTitle) activeCategoryTitle.textContent = category;
    if (menuShell) menuShell.dataset.view = "products";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderCategoryCards = () => {
    if (!categoryCards) return;
    const cats = categories.filter((category) => category !== "الكل");
    const fragment = document.createDocumentFragment();

    cats.forEach((category, index) => {
      const count = menu.filter((product) => product.category === category).length;
      if (!count) return;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "category-card";
      card.style.animationDelay = `${Math.min(index * 70, 420)}ms`;
      card.innerHTML = `
        <span class="cc-img"><img src="${escapeHTML(categoryImage(category))}" alt="" loading="lazy"></span>
        <span class="cc-text">
          <strong>${escapeHTML(category)}</strong>
          <span>${escapeHTML(categoryMeta[category] || `${count} أصناف`)}</span>
        </span>
        <span class="cc-go"><span class="cc-badge">${CC_SLICE_ICON}</span>${CC_CHEVRON}</span>
      `;
      card.addEventListener("click", () => showProducts(category));
      fragment.appendChild(card);
    });

    categoryCards.replaceChildren(fragment);
  };

  const createCheckbox = ({ name, value, checked = false, price = null, group }) => `
    <label class="option-check">
      <input type="checkbox" name="${escapeHTML(group)}" value="${escapeHTML(value)}" ${checked ? "checked" : ""} data-price="${price ?? ""}">
      <span>${escapeHTML(name)}${price ? ` <small>+${escapeHTML(formatPrice(price))}</small>` : ""}</span>
    </label>
  `;

  const renderOptionGroup = ({ container, title, help, options, selected = [], group, isPaid = false, invertSelection = false }) => {
    const list = toArray(options);
    if (!list.length) {
      container.innerHTML = "";
      return;
    }

    const checkboxes = list.map((option) => {
      const name = typeof option === "string" ? option : option.name;
      const price = typeof option === "string" ? null : option.price;
      const isSelected = selected.includes(name);
      return createCheckbox({
        name: invertSelection ? `بدون ${name}` : name,
        value: name,
        checked: isSelected,
        price: isPaid ? price : null,
        group
      });
    }).join("");

    container.innerHTML = `
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(help)}</p>
      <div class="option-list">${checkboxes}</div>
    `;
  };

  const setCustomizerQty = (value) => {
    customizerQty = Math.min(MAX_ITEM_QTY, Math.max(1, Number(value || 1)));
    if (itemQty) itemQty.textContent = String(customizerQty);
    if (itemQtyMinus) itemQtyMinus.disabled = customizerQty <= 1;
    if (itemQtyPlus) itemQtyPlus.disabled = customizerQty >= MAX_ITEM_QTY;
  };

  const PIZZA_SLICE_COUNTS = [4, 8, 10, 12, 16];
  const PIZZA_DEFAULT_SLICE_COUNT = 8;
  const PIZZA_COLORS = ["#f7b84b", "#d9472f", "#2f9f72", "#9f6bff", "#f97316", "#38bdf8", "#ef5da8", "#84cc16"];
  const PIZZA_NAMED_COLORS = [
    { words: ["زيتون أخضر"], color: "#2f9f55" },
    { words: ["ذرة"], color: "#ffd22e" },
    { words: ["فلفل حار"], color: "#8bdc45" },
    { words: ["زيتون أسود"], color: "#151515" },
    { words: ["فقع", "فطر"], color: "#8b8b84" },
    { words: ["طماطم", "طاطم"], color: "#d92f24" },
    { words: ["بصل"], color: "#f8f1df" },
    { words: ["فلفل ألوان"], color: "#d99a13" },
    { words: ["تونة"], color: "#8b5a2b" }
  ];
  const PIZZA_EMOJI = [
    { words: ["زيتون"], mark: "●" },
    { words: ["ذرة"], mark: "●" },
    { words: ["فلفل"], mark: "●" },
    { words: ["فقع", "فطر"], mark: "●" },
    { words: ["طماطم"], mark: "●" },
    { words: ["بصل"], mark: "●" },
    { words: ["تونة"], mark: "●" },
    { words: ["جبنة", "جبن"], mark: "●" }
  ];

  const pizzaDescriptorKey = (descriptor) => `${descriptor.scope}:${descriptor.name}`;
  const pizzaDescriptorColor = (descriptor, index = 0) => {
    const text = normalize(descriptor.name);
    const named = PIZZA_NAMED_COLORS.find((entry) => entry.words.some((word) => text.includes(normalize(word))));
    if (named) return named.color;
    return descriptor.scope === "removable" ? "#f43f5e" : PIZZA_COLORS[index % PIZZA_COLORS.length];
  };
  const pizzaDescriptorMark = (name) => {
    const text = normalize(name);
    const item = PIZZA_EMOJI.find((entry) => entry.words.some((word) => text.includes(normalize(word))));
    return item?.mark || "●";
  };

  const buildSlicePath = (sliceIndex, sliceCount, radius = 122, cx = 150, cy = 150) => {
    const sliceDeg = 360 / sliceCount;
    const startDeg = sliceIndex * sliceDeg - 90;
    const endDeg = startDeg + sliceDeg;
    const start = (startDeg * Math.PI) / 180;
    const end = (endDeg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const largeArc = sliceDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
  };

  const sliceCentroid = (sliceIndex, sliceCount, radius = 72, cx = 150, cy = 150) => {
    const sliceDeg = 360 / sliceCount;
    const midDeg = sliceIndex * sliceDeg - 90 + sliceDeg / 2;
    const mid = (midDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(mid), y: cy + radius * Math.sin(mid) };
  };

  const clampSliceSelections = (map, nextCount) => {
    map.forEach((set, key) => {
      const trimmed = new Set();
      set.forEach((sliceIndex) => {
        if (sliceIndex < nextCount) trimmed.add(sliceIndex);
      });
      map.set(key, trimmed);
    });
  };

  const getPizzaSliceDefinition = (sliceIndex) => ({
    key: `slice-${sliceIndex + 1}`,
    label: `الشريحة ${sliceIndex + 1}`
  });

  const buildPizzaAdditionsTextFromSections = (sections) => {
    const list = toArray(sections);
    const additionsText = [`تقسيم المنتج: شرائح (${list.length} شرائح)`];
    const groups = [];

    list.forEach((section, index) => {
      const sigKey = JSON.stringify({
        f: [...toArray(section.freeAdditions)].sort(),
        p: [...toArray(section.paidAdditions)].sort(),
        r: [...toArray(section.removedIngredients)].sort()
      });
      if (groups.length && groups[groups.length - 1].sigKey === sigKey) {
        groups[groups.length - 1].end = index + 1;
      } else {
        groups.push({ sigKey, start: index + 1, end: index + 1, section });
      }
    });

    groups.forEach(({ start, end, section }) => {
      const parts = [];
      if (toArray(section.freeAdditions).length) parts.push(`مجانية: ${section.freeAdditions.join("، ")}`);
      if (toArray(section.paidAdditions).length) parts.push(`مدفوعة: ${section.paidAdditions.join("، ")}`);
      if (toArray(section.removedIngredients).length) parts.push(`بدون: ${section.removedIngredients.join("، ")}`);
      const label = start === end ? `الشريحة ${start}` : `الشرائح ${start}–${end}`;
      additionsText.push(`${label}: ${parts.length ? parts.join(" | ") : "بدون تعديلات"}`);
    });

    const uniquePaid = uniqueValues(list.flatMap((section) => section.paidAdditions || []));
    if (uniquePaid.length) additionsText.push(`الإضافات المدفوعة المحتسبة: ${uniquePaid.join("، ")}`);

    return additionsText;
  };

  const getFlatPizzaAdditionsFromSections = (sections) => ({
    freeAdditions: uniqueValues(toArray(sections).flatMap((section) => section.freeAdditions || [])),
    paidAdditions: uniqueValues(toArray(sections).flatMap((section) => section.paidAdditions || []))
  });

  const getPizzaDescriptors = (product) => [
    ...toArray(product.freeAddons).map((name, index) => ({
      scope: "free",
      name,
      price: 0,
      color: pizzaDescriptorColor({ scope: "free", name }, index)
    })),
    ...toArray(product.paidAddons).map((addon, index) => ({
      scope: "paid",
      name: addon.name,
      price: Number(addon.price || 0),
      color: pizzaDescriptorColor({ scope: "paid", name: addon.name }, index + toArray(product.freeAddons).length)
    })),
    ...toArray(product.removableIngredients || product.ingredients).map((name) => ({
      scope: "removable",
      name,
      price: 0,
      color: pizzaDescriptorColor({ scope: "removable", name })
    }))
  ];

  const computePizzaSplitPrice = () => {
    if (!pizzaSplit) return { addons: 0, unit: 0, total: 0 };
    let addons = 0;
    pizzaSplit.descriptors.forEach((descriptor) => {
      if (descriptor.scope !== "paid") return;
      const selected = pizzaSplit.selections.get(pizzaDescriptorKey(descriptor));
      if (!selected?.size) return;
      addons += Number(descriptor.price || 0);
    });
    addons = Number(addons.toFixed(2));
    const unit = Number((Number(pizzaSplit.product.price || 0) + addons).toFixed(2));
    return { addons, unit, total: Number((unit * pizzaSplit.qty).toFixed(2)) };
  };

  const hydratePizzaSelections = (product, cartItem) => {
    const descriptors = getPizzaDescriptors(product);
    const selections = new Map(descriptors.map((descriptor) => [pizzaDescriptorKey(descriptor), new Set()]));
    const sections = toArray(cartItem?.pizzaSections);
    const sliceCount = PIZZA_SLICE_COUNTS.includes(sections.length) ? sections.length : PIZZA_DEFAULT_SLICE_COUNT;

    sections.forEach((section, sliceIndex) => {
      if (sliceIndex >= sliceCount) return;
      descriptors.forEach((descriptor) => {
        const key = pizzaDescriptorKey(descriptor);
        const source = descriptor.scope === "free"
          ? section.freeAdditions
          : descriptor.scope === "paid"
            ? section.paidAdditions
            : section.removedIngredients;
        if (toArray(source).includes(descriptor.name)) selections.get(key).add(sliceIndex);
      });
    });

    return { descriptors, selections, sliceCount };
  };

  const openPizzaSplit = (product, cartItem = null) => {
    const hydrated = hydratePizzaSelections(product, cartItem);
    pizzaSplit = {
      product,
      descriptors: hydrated.descriptors,
      selections: hydrated.selections,
      sliceCount: hydrated.sliceCount,
      doughType: cartItem?.doughType === "رقيق" ? "رقيق" : "عادي",
      qty: Math.min(MAX_ITEM_QTY, Math.max(1, Number(cartItem?.qty || 1))),
      notes: cartItem?.notes || "",
      editingCartId: cartItem?.cartId || null
    };
    renderPizzaSplit();
    pizzaSplitModal.classList.add("is-open");
    pizzaSplitModal.setAttribute("aria-hidden", "false");
  };

  const closePizzaSplit = () => {
    closePizzaSliceSheet();
    pizzaSplitModal.classList.remove("is-open");
    pizzaSplitModal.setAttribute("aria-hidden", "true");
    pizzaSplit = null;
  };

  const countPizzaSlices = (descriptor) => pizzaSplit?.selections.get(pizzaDescriptorKey(descriptor))?.size || 0;

  const renderPizzaPreview = () => {
    const slices = Array.from({ length: pizzaSplit.sliceCount }, (_, sliceIndex) => {
      const activeDescriptors = pizzaSplit.descriptors.filter((descriptor) => pizzaSplit.selections.get(pizzaDescriptorKey(descriptor))?.has(sliceIndex));
      const centroid = sliceCentroid(sliceIndex, pizzaSplit.sliceCount);
      const first = activeDescriptors[0];
      const fill = first ? `${first.color}66` : "rgba(248, 183, 75, .22)";
      const marks = activeDescriptors.slice(0, 4).map((descriptor, index) => {
        const x = centroid.x + ((index % 2) - 0.5) * 18;
        const y = centroid.y + (Math.floor(index / 2) - 0.5) * 18;
        const mark = descriptor.scope === "removable" ? "−" : pizzaDescriptorMark(descriptor.name);
        return `<text class="pizza-preview-mark ${descriptor.scope === "removable" ? "is-remove" : ""}" x="${x}" y="${y + 5}" text-anchor="middle">${escapeHTML(mark)}</text>`;
      }).join("");
      const number = activeDescriptors.length ? "" : `<text class="pizza-preview-num" x="${centroid.x}" y="${centroid.y + 5}" text-anchor="middle">${sliceIndex + 1}</text>`;
      return `
        <g>
          <path d="${buildSlicePath(sliceIndex, pizzaSplit.sliceCount)}" fill="${fill}" stroke="rgba(69, 30, 16, .72)" stroke-width="2"></path>
          ${number}
          ${marks}
        </g>
      `;
    }).join("");

    return `
      <svg class="pizza-preview-svg" viewBox="0 0 300 300" role="img" aria-label="تقسيم البيتسا">
        <circle cx="150" cy="150" r="130" fill="#8a3f19"></circle>
        <circle cx="150" cy="150" r="123" fill="#f6c76a"></circle>
        <circle cx="150" cy="150" r="111" fill="#c93124" opacity=".92"></circle>
        <circle cx="150" cy="150" r="105" fill="#ffd36c" opacity=".9"></circle>
        ${slices}
      </svg>
    `;
  };

  const renderPizzaSplit = () => {
    if (!pizzaSplit) return;
    const price = computePizzaSplitPrice();
    const sliceButtons = PIZZA_SLICE_COUNTS.map((count) => `
      <button type="button" class="pizza-slice-count-btn ${count === pizzaSplit.sliceCount ? "is-active" : ""}" data-slice-count="${count}">${count}</button>
    `).join("");
    const chips = pizzaSplit.descriptors.map((descriptor, index, descriptors) => {
      const selected = countPizzaSlices(descriptor);
      const isFull = selected === pizzaSplit.sliceCount;
      const label = descriptor.scope === "removable" ? `بدون ${descriptor.name}` : descriptor.name;
      const priceText = descriptor.scope === "paid" ? `<small>+${formatPrice(descriptor.price)}</small>` : "";
      const badge = selected
        ? `<em>${isFull ? "الكل" : `${selected}/${pizzaSplit.sliceCount}`}</em>`
        : "";
      const divider = index > 0 && descriptors[index - 1].scope !== descriptor.scope
        ? `<span class="pizza-addon-divider" aria-hidden="true"></span>`
        : "";
      return `
        ${divider}
        <button type="button" class="pizza-split-chip ${selected ? "is-selected" : ""} is-${descriptor.scope}"
          style="--chip-color:${escapeHTML(descriptor.color)}"
          data-scope="${escapeHTML(descriptor.scope)}"
          data-name="${escapeHTML(descriptor.name)}">
          <span></span>
          <strong>${escapeHTML(label)}</strong>
          ${priceText}
          ${badge}
        </button>
      `;
    }).join("");

    pizzaSplitContent.innerHTML = `
      <header class="pizza-split-head">
        <span class="category-pill">بيتسا</span>
        <h2 id="pizzaSplitTitle">${escapeHTML(pizzaSplit.product.name)}</h2>
        <p>اختر عدد القطع، ثم اضغط على أي إضافة أو مكوّن لتحديد القطع التي تريدها عليها.</p>
      </header>

      <div class="pizza-split-layout">
        <div class="pizza-preview-panel">
          ${renderPizzaPreview()}
          <p class="pizza-split-hint">الأرقام تعني قطع بدون تعديل. العلامات تظهر على القطع التي اخترتها.</p>
        </div>

        <div class="pizza-split-controls">
          <div class="pizza-split-field">
            <span>نوع العجينة</span>
            <div class="pizza-dough-options" role="radiogroup" aria-label="نوع العجينة">
              <button type="button" class="pizza-dough-btn ${pizzaSplit.doughType === "رقيق" ? "is-active" : ""}" data-dough-type="رقيق" role="radio" aria-checked="${pizzaSplit.doughType === "رقيق" ? "true" : "false"}">رقيق</button>
              <button type="button" class="pizza-dough-btn ${pizzaSplit.doughType === "عادي" ? "is-active" : ""}" data-dough-type="عادي" role="radio" aria-checked="${pizzaSplit.doughType === "عادي" ? "true" : "false"}">عادي</button>
            </div>
          </div>

          <div class="pizza-split-field">
            <span>عدد القطع</span>
            <div class="pizza-slice-counts">${sliceButtons}</div>
          </div>

          <div class="pizza-split-field">
            <span>الإضافات والمكونات</span>
            <div class="pizza-split-chips">${chips || `<p class="muted-line">لا توجد إضافات لهذه البيتسا.</p>`}</div>
          </div>

          <label class="pizza-note-field">
            <span>ملاحظات خاصة</span>
            <textarea id="pizzaSplitNotes" rows="3" placeholder="مثال: خبز زيادة، تقطيع جيد...">${escapeHTML(pizzaSplit.notes)}</textarea>
          </label>

          <div class="pizza-split-bottom">
            <div class="qty-stepper">
              <span>الكمية</span>
              <button type="button" id="pizzaQtyMinus" ${pizzaSplit.qty <= 1 ? "disabled" : ""} aria-label="إنقاص الكمية">−</button>
              <strong id="pizzaQtyValue">${pizzaSplit.qty}</strong>
              <button type="button" id="pizzaQtyPlus" ${pizzaSplit.qty >= MAX_ITEM_QTY ? "disabled" : ""} aria-label="زيادة الكمية">+</button>
            </div>
            <div class="pizza-price-box">
              <span>السعر</span>
              <strong>${formatPrice(price.total)}</strong>
              ${price.addons ? `<small>الإضافات المختارة: +${formatPrice(price.addons)} للوحدة</small>` : ""}
            </div>
          </div>

          <button class="add-cart-btn pizza-save-btn" id="pizzaSplitSave" type="button">
            ${pizzaSplit.editingCartId ? "حفظ التعديل" : "إضافة للسلة"} — ${formatPrice(price.total)}
          </button>
        </div>
      </div>
    `;

    pizzaSplitContent.querySelectorAll("[data-slice-count]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextCount = Number(button.dataset.sliceCount);
        if (!PIZZA_SLICE_COUNTS.includes(nextCount) || nextCount === pizzaSplit.sliceCount) return;
        pizzaSplit.sliceCount = nextCount;
        clampSliceSelections(pizzaSplit.selections, nextCount);
        renderPizzaSplit();
      });
    });

    pizzaSplitContent.querySelectorAll("[data-dough-type]").forEach((button) => {
      button.addEventListener("click", () => {
        pizzaSplit.doughType = button.dataset.doughType === "رقيق" ? "رقيق" : "عادي";
        renderPizzaSplit();
      });
    });

    pizzaSplitContent.querySelectorAll(".pizza-split-chip").forEach((button) => {
      button.addEventListener("click", () => {
        const descriptor = pizzaSplit.descriptors.find((item) => item.scope === button.dataset.scope && item.name === button.dataset.name);
        if (descriptor) openPizzaSliceSheet(descriptor);
      });
    });

    pizzaSplitContent.querySelector("#pizzaSplitNotes").addEventListener("input", (event) => {
      pizzaSplit.notes = event.target.value;
    });
    pizzaSplitContent.querySelector("#pizzaQtyMinus").addEventListener("click", () => {
      pizzaSplit.qty = Math.max(1, pizzaSplit.qty - 1);
      renderPizzaSplit();
    });
    pizzaSplitContent.querySelector("#pizzaQtyPlus").addEventListener("click", () => {
      pizzaSplit.qty = Math.min(MAX_ITEM_QTY, pizzaSplit.qty + 1);
      renderPizzaSplit();
    });
    pizzaSplitContent.querySelector("#pizzaSplitSave").addEventListener("click", savePizzaSplit);
  };

  const closePizzaSliceSheet = () => {
    if (!pizzaSliceSheet) return;
    pizzaSliceSheet.remove();
    pizzaSliceSheet = null;
  };

  const openPizzaSliceSheet = (descriptor) => {
    closePizzaSliceSheet();
    const key = pizzaDescriptorKey(descriptor);
    const selected = new Set(pizzaSplit.selections.get(key) || []);
    const title = descriptor.scope === "removable" ? `حدد القطع بدون ${descriptor.name}` : `حدد القطع لـ ${descriptor.name}`;
    const sheet = document.createElement("div");
    sheet.className = "pizza-slice-sheet";
    sheet.innerHTML = `
      <div class="pizza-slice-sheet-backdrop"></div>
      <div class="pizza-slice-sheet-panel" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
        <header>
          <h3>${escapeHTML(title)} ${descriptor.scope === "paid" ? `<small>+${formatPrice(descriptor.price)}</small>` : ""}</h3>
          <button type="button" class="pizza-slice-sheet-close" aria-label="إغلاق">×</button>
        </header>
        <div class="pizza-slice-sheet-actions">
          <button type="button" data-pizza-quick="all">الكل</button>
          <button type="button" data-pizza-quick="none">لا شيء</button>
        </div>
        <div class="pizza-slice-sheet-canvas"></div>
        <p>اضغط على القطع لتحديدها أو إلغاء تحديدها.</p>
        <button type="button" class="pizza-slice-confirm"></button>
      </div>
    `;
    document.body.appendChild(sheet);
    pizzaSliceSheet = sheet;

    const canvas = sheet.querySelector(".pizza-slice-sheet-canvas");
    const confirm = sheet.querySelector(".pizza-slice-confirm");
    const refreshConfirm = () => {
      confirm.textContent = `تأكيد القطع (${selected.size} محددة)`;
    };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 300 300");
    svg.classList.add("pizza-slice-sheet-svg");
    svg.innerHTML = `<circle cx="150" cy="150" r="130" fill="#8a3f19"></circle><circle cx="150" cy="150" r="122" fill="#ffd36c"></circle>`;
    for (let index = 0; index < pizzaSplit.sliceCount; index += 1) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const centroid = sliceCentroid(index, pizzaSplit.sliceCount);
      path.setAttribute("d", buildSlicePath(index, pizzaSplit.sliceCount));
      path.setAttribute("class", selected.has(index) ? "is-on" : "");
      path.dataset.slice = String(index);
      path.addEventListener("click", () => {
        if (selected.has(index)) selected.delete(index);
        else selected.add(index);
        path.setAttribute("class", selected.has(index) ? "is-on" : "");
        refreshConfirm();
      });
      svg.appendChild(path);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", centroid.x);
      label.setAttribute("y", centroid.y + 5);
      label.setAttribute("text-anchor", "middle");
      label.textContent = String(index + 1);
      svg.appendChild(label);
    }
    canvas.appendChild(svg);
    refreshConfirm();

    sheet.querySelector('[data-pizza-quick="all"]').addEventListener("click", () => {
      selected.clear();
      for (let index = 0; index < pizzaSplit.sliceCount; index += 1) selected.add(index);
      sheet.querySelectorAll(".pizza-slice-sheet-svg path").forEach((path) => path.setAttribute("class", "is-on"));
      refreshConfirm();
    });
    sheet.querySelector('[data-pizza-quick="none"]').addEventListener("click", () => {
      selected.clear();
      sheet.querySelectorAll(".pizza-slice-sheet-svg path").forEach((path) => path.setAttribute("class", ""));
      refreshConfirm();
    });
    sheet.querySelector(".pizza-slice-sheet-backdrop").addEventListener("click", closePizzaSliceSheet);
    sheet.querySelector(".pizza-slice-sheet-close").addEventListener("click", closePizzaSliceSheet);
    confirm.addEventListener("click", () => {
      pizzaSplit.selections.set(key, selected);
      closePizzaSliceSheet();
      renderPizzaSplit();
    });
    requestAnimationFrame(() => sheet.classList.add("is-open"));
  };

  const savePizzaSplit = () => {
    if (!pizzaSplit) return;
    if (!isProductAvailable(pizzaSplit.product)) {
      closePizzaSplit();
      showToast("هذا الصنف غير متاح حالياً.", "error");
      return;
    }
    const productName = pizzaSplit.product.name;
    const isEditing = Boolean(pizzaSplit.editingCartId);
    const price = computePizzaSplitPrice();
    const sections = Array.from({ length: pizzaSplit.sliceCount }, (_, sliceIndex) => {
      const selectedDescriptors = pizzaSplit.descriptors.filter((descriptor) => pizzaSplit.selections.get(pizzaDescriptorKey(descriptor))?.has(sliceIndex));
      const definition = getPizzaSliceDefinition(sliceIndex);
      return {
        key: definition.key,
        label: definition.label,
        freeAdditions: selectedDescriptors.filter((descriptor) => descriptor.scope === "free").map((descriptor) => descriptor.name),
        paidAdditions: selectedDescriptors.filter((descriptor) => descriptor.scope === "paid").map((descriptor) => descriptor.name),
        removedIngredients: selectedDescriptors.filter((descriptor) => descriptor.scope === "removable").map((descriptor) => descriptor.name)
      };
    });
    const additionsText = buildPizzaAdditionsTextFromSections(sections);
    const pizzaAdditions = getFlatPizzaAdditionsFromSections(sections);
    const removedIngredients = uniqueValues(sections.flatMap((section) => section.removedIngredients || []));

    const item = {
      cartId: pizzaSplit.editingCartId || newCartId(),
      productId: pizzaSplit.product.id,
      qty: pizzaSplit.qty,
      removedIngredients,
      freeAddons: [],
      paidAddons: [],
      notes: pizzaSplit.notes.trim(),
      splitMode: "slices",
      pizzaSplitMode: "slices",
      doughType: pizzaSplit.doughType,
      sliceCount: pizzaSplit.sliceCount,
      pizzaSections: sections,
      pizzaAdditions,
      additionsText,
      sliceSummary: additionsText,
      sliceAddonsCost: price.addons
    };

    if (isEditing) {
      cart = cart.map((cartItem) => cartItem.cartId === pizzaSplit.editingCartId ? item : cartItem);
    } else {
      cart.push(item);
    }

    renderCart();
    closePizzaSplit();
    if (!isEditing) pulseFloat();
    showToast(isEditing ? "تم تحديث البيتسا." : `تمت إضافة ${productName} إلى السلة.`);
  };

  const openProductPicker = (product, cartItem = null) => {
    if (!isProductAvailable(product)) {
      showToast("هذا الصنف غير متاح حالياً.", "error");
      return;
    }
    if (isPizzaProduct(product)) {
      openPizzaSplit(product, cartItem);
      return;
    }
    openCustomizer(product, cartItem);
  };

  const openCustomizer = (product, cartItem = null) => {
    activeProduct = product;
    editingCartId = cartItem?.cartId || null;
    customizerImage.src = safeLocalAsset(product.image);
    customizerImage.alt = product.name;
    customizerCategory.textContent = product.category;
    customizerTitle.textContent = product.name;
    customizerDescription.textContent = product.description;
    customizerPrice.textContent = `السعر الأساسي: ${formatPrice(product.price)}`;
    itemNotes.value = cartItem?.notes || "";
    setCustomizerQty(cartItem?.qty || 1);

    renderOptionGroup({
      container: ingredientsOptions,
      title: "إزالة مكونات",
      help: "اختر أي مكون تريد إزالةه من الوجبة.",
      options: product.removableIngredients || product.ingredients,
      selected: cartItem?.removedIngredients || [],
      group: "removedIngredients",
      invertSelection: true
    });

    renderOptionGroup({
      container: freeAddonOptions,
      title: "إضافات مجانية",
      help: "اختر الإضافات المجانية التي تريدها.",
      options: product.freeAddons,
      selected: cartItem?.freeAddons || [],
      group: "freeAddons"
    });

    renderOptionGroup({
      container: paidAddonOptions,
      title: "إضافات مدفوعة",
      help: "كل إضافة مدفوعة تضاف إلى سعر الوجبة.",
      options: product.paidAddons,
      selected: toArray(cartItem?.paidAddons).map((addon) => addon.name),
      group: "paidAddons",
      isPaid: true
    });

    saveCartItem.textContent = editingCartId ? "حفظ التعديل" : "إضافة للسلة";
    customizer.classList.add("is-open");
    customizer.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    customizer.classList.remove("is-open");
    customizer.setAttribute("aria-hidden", "true");
    activeProduct = null;
    editingCartId = null;
  };

  const checkedValues = (group) => [...customizer.querySelectorAll(`input[name="${group}"]:checked`)].map((input) => input.value);

  const checkedPaidAddons = () => [...customizer.querySelectorAll('input[name="paidAddons"]:checked')].map((input) => ({
    name: input.value,
    price: Number(input.dataset.price || 0)
  }));

  const openCart = () => {
    cartPanel.classList.add("is-open");
    cartBackdrop.classList.add("is-open");
    cartBackdrop.setAttribute("aria-hidden", "false");
  };

  const closeCart = () => {
    cartPanel.classList.remove("is-open");
    cartBackdrop.classList.remove("is-open");
    cartBackdrop.setAttribute("aria-hidden", "true");
  };

  /* إضافة مباشرة للمنتجات التي لا تحتوي خيارات (مثل المشروبات) */
  const addSimpleProduct = (product) => {
    if (!isProductAvailable(product)) {
      showToast("هذا الصنف غير متاح حالياً.", "error");
      return;
    }
    const existing = cart.find((item) =>
      item.productId === product.id &&
      !item.removedIngredients.length &&
      !item.freeAddons.length &&
      !item.paidAddons.length &&
      item.splitMode !== "slices" &&
      !item.notes
    );

    if (existing) {
      existing.qty = Math.min(MAX_ITEM_QTY, existing.qty + 1);
    } else {
      cart.push({
        cartId: newCartId(),
        productId: product.id,
        qty: 1,
        removedIngredients: [],
        freeAddons: [],
        paidAddons: [],
        notes: "",
        splitMode: null,
        doughType: null,
        sliceCount: 0,
        pizzaSections: [],
        sliceSummary: [],
        sliceAddonsCost: 0
      });
    }

    renderCart();
    pulseFloat();
    showToast(`تمت إضافة ${product.name} إلى السلة.`);
  };

  const saveItem = () => {
    if (!activeProduct) return;
    if (!isProductAvailable(activeProduct)) {
      closeModal();
      showToast("هذا الصنف غير متاح حالياً.", "error");
      return;
    }

    const productName = activeProduct.name;
    const isEditing = Boolean(editingCartId);

    const item = {
      cartId: editingCartId || newCartId(),
      productId: activeProduct.id,
      qty: customizerQty,
      removedIngredients: checkedValues("removedIngredients"),
      freeAddons: checkedValues("freeAddons"),
      paidAddons: checkedPaidAddons(),
      notes: itemNotes.value.trim(),
      splitMode: null,
      doughType: null,
      sliceCount: 0,
      pizzaSections: [],
      sliceSummary: [],
      sliceAddonsCost: 0
    };

    if (isEditing) {
      cart = cart.map((cartItem) => cartItem.cartId === editingCartId ? item : cartItem);
    } else {
      cart.push(item);
    }

    renderCart();
    closeModal();
    if (!isEditing) pulseFloat();
    showToast(isEditing ? "تم تحديث الصنف." : `تمت إضافة ${productName} إلى السلة.`);
  };

  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);

  const formatFraction = (part, total) => {
    const divisor = gcd(part, total) || 1;
    return `${part / divisor}/${total / divisor}`;
  };

  const pizzaSectionSignature = (section) => JSON.stringify({
    free: [...toArray(section.freeAdditions)].sort(),
    paid: [...toArray(section.paidAdditions)].sort(),
    removed: [...toArray(section.removedIngredients)].sort()
  });

  const buildPizzaSectionGroups = (sections) => {
    const groups = [];
    toArray(sections).forEach((section, index) => {
      const signature = pizzaSectionSignature(section);
      if (groups.length && groups[groups.length - 1].signature === signature) {
        groups[groups.length - 1].end = index + 1;
        groups[groups.length - 1].count += 1;
      } else {
        groups.push({
          signature,
          start: index + 1,
          end: index + 1,
          count: 1,
          section
        });
      }
    });
    return groups;
  };

  const formatSliceRange = (start, end) => {
    if (start === end) return `ق${start}`;
    if (end - start === 1) return `ق${start}، ق${end}`;
    return `ق${start}–ق${end}`;
  };

  const formatPrettyFraction = (part, total) => {
    const raw = formatFraction(part, total);
    return ({
      "1/2": "½",
      "1/3": "⅓",
      "2/3": "⅔",
      "1/4": "¼",
      "3/4": "¾",
      "1/8": "⅛",
      "3/8": "⅜",
      "5/8": "⅝",
      "7/8": "⅞"
    })[raw] || raw;
  };

  const pizzaAddonPriceByName = (product, name) => {
    const addon = toArray(product?.paidAddons).find((item) => normalize(item.name) === normalize(name));
    return Number(addon?.price || 0);
  };

  const pizzaDetailIcon = (name) => {
    const text = normalize(name);
    if (text.includes("زيتون")) return "🫒";
    if (text.includes("فقع") || text.includes("فطر")) return "🍄";
    if (text.includes("ذرة")) return "🌽";
    if (text.includes("طماطم") || text.includes("طاطم") || text.includes("بندورة")) return "🍅";
    if (text.includes("بصل")) return "🧅";
    if (text.includes("تونة")) return "🐟";
    if (text.includes("فلفل")) return "🌶";
    return "●";
  };

  const renderPizzaChip = (product, type, name) => {
    const price = type === "paid" ? pizzaAddonPriceByName(product, name) : 0;
    const label = type === "removed" ? `بدون ${name}` : `${name}${price ? ` +${formatPrice(price)}` : ""}`;
    const color = pizzaDescriptorColor({ scope: type === "removed" ? "removable" : type, name });
    return `
      <span class="pizza-detail-chip is-${escapeHTML(type)}" style="--chip-color:${escapeHTML(color)}">
        <span class="pizza-detail-chip-text">${escapeHTML(label)}</span>
        <span class="pizza-detail-chip-icon" aria-hidden="true">${escapeHTML(pizzaDetailIcon(name))}</span>
      </span>
    `;
  };

  const renderPizzaSliceDetails = (item, product) => {
    const sections = toArray(item.pizzaSections);
    if (!sections.length) return "";
    const groups = buildPizzaSectionGroups(sections);

    const rows = groups.map((group) => {
      const section = group.section;
      const chips = [
        ...toArray(section.freeAdditions).map((name) => renderPizzaChip(product, "free", name)),
        ...toArray(section.paidAdditions).map((name) => renderPizzaChip(product, "paid", name)),
        ...toArray(section.removedIngredients).map((name) => renderPizzaChip(product, "removed", name))
      ].join("");
      const label = formatSliceRange(group.start, group.end);
      return `
        <div class="pizza-slice-detail-row">
          <span class="pizza-slice-range">${escapeHTML(label)}</span>
          <div class="pizza-slice-tags">${chips || `<span class="pizza-slice-empty">بدون تعديلات</span>`}</div>
          <span class="pizza-slice-fraction">${escapeHTML(formatFraction(group.count, sections.length))}</span>
        </div>
      `;
    }).join("");

    return `
      <div class="pizza-slice-details">
        <h4>تفاصيل الشرائح</h4>
        <div class="pizza-slice-detail-list">${rows}</div>
      </div>
    `;
  };

  const renderItemDetails = (item) => {
    const details = [];
    if (item.splitMode === "slices") {
      const product = getProduct(item.productId);
      details.push(`نوع العجينة: ${item.doughType || "عادي"}`);
      const pizzaDetails = renderPizzaSliceDetails(item, product);
      if (pizzaDetails) details.push(pizzaDetails);
      if (item.sliceAddonsCost) details.push(`<p>تكلفة الإضافات المختارة: +${escapeHTML(formatPrice(item.sliceAddonsCost))} للوحدة</p>`);
    } else if (item.removedIngredients.length) {
      details.push(`بدون: ${item.removedIngredients.join("، ")}`);
    }
    if (item.freeAddons.length) details.push(`إضافات مجانية: ${item.freeAddons.join("، ")}`);
    if (item.paidAddons.length) details.push(`إضافات مدفوعة: ${item.paidAddons.map((addon) => `${addon.name} +${formatPrice(addon.price)}`).join("، ")}`);
    if (item.notes) details.push(`ملاحظة: ${item.notes}`);
    return details.length
      ? details.map((detail) => detail.trim().startsWith("<") ? detail : `<p>${escapeHTML(detail)}</p>`).join("")
      : `<p>بدون تعديلات خاصة</p>`;
  };

  const buildWhatsAppPizzaDetails = (item, product) => {
    const sections = toArray(item.pizzaSections);
    if (!sections.length) return [];

    const lines = [
      "تفاصيل البيتسا:",
      `نوع العجينة: ${item.doughType || "عادي"}`,
      `عدد القطع: ${sections.length}`,
      ""
    ];

    buildPizzaSectionGroups(sections).forEach((group) => {
      const section = group.section;
      const items = [
        ...toArray(section.freeAdditions).map((name) => `${pizzaDetailIcon(name)} ${name}`),
        ...toArray(section.paidAdditions).map((name) => {
          const price = pizzaAddonPriceByName(product, name);
          return `${pizzaDetailIcon(name)} ${name}${price ? ` +${formatPrice(price)}` : ""}`;
        }),
        ...toArray(section.removedIngredients).map((name) => `بدون ${name}`)
      ];
      const fraction = formatPrettyFraction(group.count, sections.length);
      lines.push(`- ${fraction} | ${formatSliceRange(group.start, group.end)}`);
      if (items.length) {
        items.forEach((detail) => lines.push(`  ${detail}`));
      } else {
        lines.push("  بدون إضافات");
      }
      lines.push("");
    });

    const paid = uniqueValues(sections.flatMap((section) => section.paidAdditions || []));
    if (paid.length) lines.push(`الإضافات المدفوعة المحتسبة: ${paid.join("، ")}`);
    if (item.sliceAddonsCost) lines.push(`تكلفة الإضافات: +${formatPrice(item.sliceAddonsCost)} للوحدة`);

    return lines.filter((line, index, list) => !(line === "" && list[index - 1] === ""));
  };

  const renderCart = () => {
    cart = cart.filter((item) => {
      const product = getProduct(item.productId);
      return product && isProductAvailable(product);
    });
    const fragment = document.createDocumentFragment();
    let total = 0;
    let count = 0;

    cart.forEach((item) => {
      const product = getProduct(item.productId);
      if (!product) return;
      total += itemTotal(item);
      count += Number(item.qty || 1);

      const row = document.createElement("article");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-top">
          <div>
            <h3>${escapeHTML(product.name)}</h3>
            <span>${escapeHTML(formatPrice(product.price))} للوحدة</span>
          </div>
          <strong>${escapeHTML(formatPrice(itemTotal(item)))}</strong>
        </div>
        <div class="cart-item-details">${renderItemDetails(item)}</div>
        <div class="cart-item-foot">
          <div class="qty-control">
            <button type="button" data-dec-id="${escapeHTML(item.cartId)}" ${Number(item.qty || 1) <= 1 ? "disabled" : ""} aria-label="إنقاص الكمية">−</button>
            <span class="qty-value">${escapeHTML(item.qty)}</span>
            <button type="button" data-inc-id="${escapeHTML(item.cartId)}" ${Number(item.qty || 1) >= MAX_ITEM_QTY ? "disabled" : ""} aria-label="زيادة الكمية">+</button>
          </div>
          <div class="cart-actions">
            <button type="button" data-edit-id="${escapeHTML(item.cartId)}">تعديل</button>
            <button type="button" data-remove-id="${escapeHTML(item.cartId)}">إزالة</button>
          </div>
        </div>
      `;
      fragment.appendChild(row);
    });

    cartItems.replaceChildren(fragment);
    cartCount.textContent = count;
    cartTotal.textContent = formatPrice(total);
    cartFloatCount.textContent = count;
    cartFloatTotal.textContent = formatPrice(total);
    cartToggle.classList.toggle("has-items", count > 0);
    emptyCart.hidden = cart.length > 0;
    clearCart.disabled = cart.length === 0;
    if (checkoutOrder) checkoutOrder.disabled = cart.length === 0;

    saveCart();
  };

  const changeQty = (cartId, delta) => {
    const item = cart.find((cartItem) => cartItem.cartId === cartId);
    if (!item) return;
      item.qty = Math.min(MAX_ITEM_QTY, Math.max(1, Number(item.qty || 1) + delta));
    renderCart();
  };

  /* ---------- إتمام الطلب عبر واتساب ---------- */
  const buildOrderText = () => {
    const lines = ["طلب جديد من بيتسا البلد", ""];
    let total = 0;

    cart.forEach((item, index) => {
      const product = getProduct(item.productId);
      if (!product) return;
      total += itemTotal(item);
      if (index > 0) lines.push("");
      lines.push(`${index + 1}. ${product.name} × ${item.qty}`);
      lines.push(`السعر: ${formatPrice(itemTotal(item))}`);
      if (item.splitMode === "slices") {
        lines.push(...buildWhatsAppPizzaDetails(item, product));
      } else if (item.removedIngredients.length) {
        lines.push(`بدون: ${item.removedIngredients.join("، ")}`);
      }
      if (item.freeAddons.length) lines.push(`إضافات مجانية: ${item.freeAddons.join("، ")}`);
      if (item.paidAddons.length) lines.push(`إضافات مدفوعة: ${item.paidAddons.map((addon) => `${addon.name} (+${formatPrice(addon.price)})`).join("، ")}`);
      if (item.notes) lines.push(`ملاحظة: ${item.notes}`);
    });

    lines.push("", `المجموع التقريبي: ${formatPrice(total)}`);
    return lines.join("\n");
  };

  const openOrderConfirm = () => {
    if (!orderConfirmModal) {
      sendOrderToWhatsApp();
      return;
    }
    orderConfirmModal.classList.add("is-open");
    orderConfirmModal.setAttribute("aria-hidden", "false");
    acceptOrderConfirm?.focus();
  };

  const closeOrderConfirm = () => {
    if (!orderConfirmModal) return;
    orderConfirmModal.classList.remove("is-open");
    orderConfirmModal.setAttribute("aria-hidden", "true");
  };

  const sendOrderToWhatsApp = () => {
    const text = encodeURIComponent(buildOrderText());
    const whatsapp = safeWhatsAppNumber(site.phone?.whatsapp);
    if (whatsapp) {
      const win = window.open(`https://api.whatsapp.com/send?phone=${whatsapp}&text=${text}`, "_blank", "noopener,noreferrer");
      if (win) win.opener = null;
      showToast("تم تجهيز طلبك، أكمل الإرسال عبر واتساب.");
    } else {
      showToast("تم تجهيز ملخص الطلب.");
    }
  };

  const checkout = () => {
    if (!cart.length) {
      showToast("السلة فارغة، أضف أصنافاً أولاً.", "error");
      return;
    }
    openOrderConfirm();
  };

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-id]");
    if (!button) return;
    const product = getProduct(button.dataset.productId);
    if (!product) return;
    if (!isProductAvailable(product)) {
      showToast("هذا الصنف غير متاح حالياً.", "error");
      return;
    }
    openProductPicker(product);
  });

  grid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest(".product-row[data-product-id]");
    if (!row) return;
    event.preventDefault();
    const product = getProduct(row.dataset.productId);
    if (!product) return;
    if (!isProductAvailable(product)) {
      showToast("هذا الصنف غير متاح حالياً.", "error");
      return;
    }
    openProductPicker(product);
  });

  cartItems.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const removeButton = event.target.closest("[data-remove-id]");
    const incButton = event.target.closest("[data-inc-id]");
    const decButton = event.target.closest("[data-dec-id]");

    if (editButton) {
      const item = cart.find((cartItem) => cartItem.cartId === editButton.dataset.editId);
      const product = item ? getProduct(item.productId) : null;
      if (product && item && isProductAvailable(product)) openProductPicker(product, item);
      else if (product) showToast("هذا الصنف غير متاح حالياً.", "error");
    }

    if (removeButton) {
      cart = cart.filter((cartItem) => cartItem.cartId !== removeButton.dataset.removeId);
      renderCart();
      showToast("تمت إزالة الصنف من السلة.");
    }

    if (incButton) changeQty(incButton.dataset.incId, 1);
    if (decButton) changeQty(decButton.dataset.decId, -1);
  });

  search.addEventListener("input", (event) => {
    query = event.target.value;
    renderProducts();
  });

  clearCart.addEventListener("click", () => {
    if (!cart.length) return;
    cart = [];
    renderCart();
    showToast("تم تفريغ السلة.");
  });

  if (checkoutOrder) checkoutOrder.addEventListener("click", checkout);
  if (rejectOrderConfirm) rejectOrderConfirm.addEventListener("click", closeOrderConfirm);
  if (acceptOrderConfirm) {
    acceptOrderConfirm.addEventListener("click", () => {
      closeOrderConfirm();
      sendOrderToWhatsApp();
      cart = [];
      renderCart();
      closeCart();
    });
  }

  cartToggle.addEventListener("click", openCart);
  cartClose.addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);

  if (scrollToCats) {
    scrollToCats.addEventListener("click", () => {
      if (categoryCards) categoryCards.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (backToCats) backToCats.addEventListener("click", showCategories);
  if (navMenu) navMenu.addEventListener("click", showCategories);

  closeCustomizer.addEventListener("click", closeModal);
  saveCartItem.addEventListener("click", saveItem);
  if (itemQtyMinus) itemQtyMinus.addEventListener("click", () => setCustomizerQty(customizerQty - 1));
  if (itemQtyPlus) itemQtyPlus.addEventListener("click", () => {
    if (customizerQty >= MAX_ITEM_QTY) {
      showToast(`الحد الأقصى للكمية هو ${MAX_ITEM_QTY}.`, "error");
      return;
    }
    setCustomizerQty(customizerQty + 1);
  });
  if (pizzaSplitClose) pizzaSplitClose.addEventListener("click", closePizzaSplit);
  customizer.addEventListener("click", (event) => {
    if (event.target === customizer) closeModal();
  });
  if (pizzaSplitModal) {
    pizzaSplitModal.addEventListener("click", (event) => {
      if (event.target === pizzaSplitModal) closePizzaSplit();
    });
  }
  if (orderConfirmModal) {
    orderConfirmModal.addEventListener("click", (event) => {
      if (event.target === orderConfirmModal) closeOrderConfirm();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && pizzaSliceSheet) {
      closePizzaSliceSheet();
      return;
    }
    if (event.key === "Escape" && orderConfirmModal?.classList.contains("is-open")) {
      closeOrderConfirm();
      return;
    }
    if (event.key === "Escape" && pizzaSplitModal?.classList.contains("is-open")) closePizzaSplit();
    if (event.key === "Escape" && customizer.classList.contains("is-open")) closeModal();
    if (event.key === "Escape" && cartPanel.classList.contains("is-open")) closeCart();
  });

  cart = loadCart();
  renderCategoryCards();
  renderTabs();
  renderProducts();
  renderCart();
})();
