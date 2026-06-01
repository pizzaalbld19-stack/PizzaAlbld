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
  const toastStack = document.getElementById("toastStack");
  const customizer = document.getElementById("customizer");
  const closeCustomizer = document.getElementById("closeCustomizer");
  const saveCartItem = document.getElementById("saveCartItem");

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

  const categoryCards = document.getElementById("categoryCards");
  const scrollToCats = document.getElementById("scrollToCats");
  const navMenu = document.getElementById("navMenu");
  const menuShell = document.querySelector(".menu-shell");
  const backToCats = document.getElementById("backToCats");
  const activeCategoryTitle = document.getElementById("activeCategoryTitle");

  const STORAGE_KEY = "pizzaBaladCart";

  let activeCategory = "الكل";
  let query = "";
  let cart = [];
  let activeProduct = null;
  let editingCartId = null;

  if (year) year.textContent = new Date().getFullYear();

  if (site.phone?.tel) {
    document.querySelectorAll("[data-site-phone-link]").forEach((link) => {
      link.href = `tel:${site.phone.tel}`;
    });
  }

  const formatPrice = (price) => `${price} ₪`;
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const toArray = (value) => Array.isArray(value) ? value : [];
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const newCartId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const getProduct = (id) => menu.find((product) => product.id === Number(id));

  const itemAddonTotal = (item) => toArray(item.paidAddons).reduce((sum, addon) => sum + Number(addon.price || 0), 0);

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
        .filter((item) => item && getProduct(item.productId))
        .map((item) => ({
          cartId: item.cartId || newCartId(),
          productId: Number(item.productId),
          qty: Math.max(1, Number(item.qty || 1)),
          removedIngredients: toArray(item.removedIngredients),
          freeAddons: toArray(item.freeAddons),
          paidAddons: toArray(item.paidAddons).map((addon) => ({
            name: addon.name,
            price: Number(addon.price || 0)
          })),
          notes: typeof item.notes === "string" ? item.notes : ""
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
    card.className = "product-card";
    card.style.animationDelay = `${Math.min(index * 45, 360)}ms`;
    const freeAddons = toArray(product.freeAddons);
    const paidAddons = toArray(product.paidAddons);
    const ingredients = toArray(product.ingredients);

    card.innerHTML = `
      <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" width="520" height="410">
      <div class="product-body">
        <span class="category-pill">${escapeHTML(product.category)}</span>
        <div class="product-top">
          <h2>${escapeHTML(product.name)}</h2>
          <span class="price">${escapeHTML(formatPrice(product.price))}</span>
        </div>
        <p>${escapeHTML(product.description)}</p>
        <div class="product-options-preview">
          <strong>المكونات</strong>
          ${createChips(ingredients, "لا توجد مكونات قابلة للتعديل")}
          ${freeAddons.length ? `<strong>إضافات مجانية</strong>${createChips(freeAddons, "")}` : ""}
          ${paidAddons.length ? `<strong>إضافات مدفوعة</strong><div class="chips">${paidAddons.map((addon) => `<span>${escapeHTML(addon.name)} +${escapeHTML(formatPrice(addon.price))}</span>`).join("")}</div>` : ""}
        </div>
        <button class="add-cart-btn product-add" type="button" data-product-id="${product.id}">
          ${productHasOptions(product) ? "اختيار وتعديل" : "إضافة للسلة"}
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
    return product ? product.image : "";
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

  const openCustomizer = (product, cartItem = null) => {
    activeProduct = product;
    editingCartId = cartItem?.cartId || null;
    customizerImage.src = product.image;
    customizerImage.alt = product.name;
    customizerCategory.textContent = product.category;
    customizerTitle.textContent = product.name;
    customizerDescription.textContent = product.description;
    customizerPrice.textContent = `السعر الأساسي: ${formatPrice(product.price)}`;
    itemNotes.value = cartItem?.notes || "";
    itemQty.value = cartItem?.qty || 1;

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
    const existing = cart.find((item) =>
      item.productId === product.id &&
      !item.removedIngredients.length &&
      !item.freeAddons.length &&
      !item.paidAddons.length &&
      !item.notes
    );

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        cartId: newCartId(),
        productId: product.id,
        qty: 1,
        removedIngredients: [],
        freeAddons: [],
        paidAddons: [],
        notes: ""
      });
    }

    renderCart();
    pulseFloat();
    showToast(`تمت إضافة ${product.name} إلى السلة.`);
  };

  const saveItem = () => {
    if (!activeProduct) return;

    const productName = activeProduct.name;
    const isEditing = Boolean(editingCartId);

    const item = {
      cartId: editingCartId || newCartId(),
      productId: activeProduct.id,
      qty: Math.max(1, Number(itemQty.value || 1)),
      removedIngredients: checkedValues("removedIngredients"),
      freeAddons: checkedValues("freeAddons"),
      paidAddons: checkedPaidAddons(),
      notes: itemNotes.value.trim()
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

  const renderItemDetails = (item) => {
    const details = [];
    if (item.removedIngredients.length) details.push(`بدون: ${item.removedIngredients.join("، ")}`);
    if (item.freeAddons.length) details.push(`إضافات مجانية: ${item.freeAddons.join("، ")}`);
    if (item.paidAddons.length) details.push(`إضافات مدفوعة: ${item.paidAddons.map((addon) => `${addon.name} +${formatPrice(addon.price)}`).join("، ")}`);
    if (item.notes) details.push(`ملاحظة: ${item.notes}`);
    return details.length ? details.map((detail) => `<p>${escapeHTML(detail)}</p>`).join("") : `<p>بدون تعديلات خاصة</p>`;
  };

  const renderCart = () => {
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
            <button type="button" data-dec-id="${escapeHTML(item.cartId)}" aria-label="إنقاص الكمية">−</button>
            <span class="qty-value">${escapeHTML(item.qty)}</span>
            <button type="button" data-inc-id="${escapeHTML(item.cartId)}" aria-label="زيادة الكمية">+</button>
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
    item.qty = Math.max(1, Number(item.qty || 1) + delta);
    renderCart();
  };

  /* ---------- إتمام الطلب عبر واتساب ---------- */
  const buildOrderText = () => {
    const lines = ["طلب جديد من بيتسا البلد:", ""];
    let total = 0;

    cart.forEach((item, index) => {
      const product = getProduct(item.productId);
      if (!product) return;
      total += itemTotal(item);
      lines.push(`${index + 1}) ${product.name} × ${item.qty} — ${formatPrice(itemTotal(item))}`);
      if (item.removedIngredients.length) lines.push(`   بدون: ${item.removedIngredients.join("، ")}`);
      if (item.freeAddons.length) lines.push(`   إضافات مجانية: ${item.freeAddons.join("، ")}`);
      if (item.paidAddons.length) lines.push(`   إضافات مدفوعة: ${item.paidAddons.map((addon) => `${addon.name} (+${formatPrice(addon.price)})`).join("، ")}`);
      if (item.notes) lines.push(`   ملاحظة: ${item.notes}`);
    });

    lines.push("", `المجموع التقريبي: ${formatPrice(total)}`);
    return lines.join("\n");
  };

  const checkout = () => {
    if (!cart.length) {
      showToast("السلة فارغة، أضف أصنافاً أولاً.", "error");
      return;
    }
    const text = encodeURIComponent(buildOrderText());
    const whatsapp = site.phone?.whatsapp;
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp}?text=${text}`, "_blank", "noopener");
      showToast("تم تجهيز طلبك، أكمل الإرسال عبر واتساب.");
    } else {
      showToast("تم تجهيز ملخص الطلب.");
    }
  };

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-id]");
    if (!button) return;
    const product = getProduct(button.dataset.productId);
    if (!product) return;
    if (productHasOptions(product)) {
      openCustomizer(product);
    } else {
      addSimpleProduct(product);
    }
  });

  cartItems.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const removeButton = event.target.closest("[data-remove-id]");
    const incButton = event.target.closest("[data-inc-id]");
    const decButton = event.target.closest("[data-dec-id]");

    if (editButton) {
      const item = cart.find((cartItem) => cartItem.cartId === editButton.dataset.editId);
      const product = item ? getProduct(item.productId) : null;
      if (product && item) openCustomizer(product, item);
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
  customizer.addEventListener("click", (event) => {
    if (event.target === customizer) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && customizer.classList.contains("is-open")) closeModal();
    if (event.key === "Escape" && cartPanel.classList.contains("is-open")) closeCart();
  });

  cart = loadCart();
  renderCategoryCards();
  renderTabs();
  renderProducts();
  renderCart();
})();
